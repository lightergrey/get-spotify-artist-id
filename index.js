const formatResponse = require("./src/formatResponse");
const getTagsFromFilesInDirectory = require("./src/getTagsFromFilesInDirectory");
const fs = require("./src/fs-promise");
const ora = require("ora");
const promptly = require("promptly");
const Spotify = require("node-spotify-api");

let spotify;

const requestTypes = {
  query: "query",
  directory: "directory"
};

let spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
let spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;

const promiseSerial = fns =>
  fns.reduce(
    (promise, fn) =>
      promise.then(result => fn().then(Array.prototype.concat.bind(result))),
    Promise.resolve([])
  );

const arrayToObject = array =>
  array.reduce((obj, item) => {
    obj[item.query] = item.data;
    return obj;
  }, {});

const initialize = async () => {
  if (!spotifyClientId) {
    spotifyClientId = await promptly.prompt("Spotify Client ID: ");
  }

  if (!spotifyClientSecret) {
    spotifyClientSecret = await promptly.prompt("Spotify Client Secret: ");
  }

  spotify = new Spotify({
    id: spotifyClientId,
    secret: spotifyClientSecret
  });

  const requestType = await promptly.choose(
    `Request type: ${Object.values(requestTypes).join(", ")}?`,
    Object.values(requestTypes),
    { default: requestTypes.directory }
  );

  if (requestType === requestTypes.query) {
    const query = await promptly.prompt("Query: ");
    const searchSpinner = ora("Searching").start();
    try {
      const response = await spotify.search({ type: "artist", query });
      const formattedResponse = formatResponse(query, response);
      searchSpinner.succeed(
        "Result: " + JSON.stringify(formattedResponse, null, 2)
      );
    } catch (error) {
      searchSpinner.fail(`${error}`);
    }
  }

  if (requestType === requestTypes.directory) {
    const directory = await promptly.prompt("Directory: ", {
      default: "./test/"
    });
    const outputPath = await promptly.prompt("Output path: ", {
      default: "./artists.json"
    });
    const searchSpinner = ora("Searching").start();
    const tags = await getTagsFromFilesInDirectory(directory);
    const requests = tags.map(tag => () => {
      return spotify
        .search({
          type: "artist",
          query: '"' + tag.replace(/[“”‘’]/g, "") + '"'
        })
        .catch(e => console.log(`${tag}: ${e.error}`));
    });
    try {
      const responses = await promiseSerial(requests).then(data =>
        data.map((response, index) => formatResponse(tags[index], response))
      );
      fs.writeFile(
        outputPath,
        JSON.stringify(Object.assign({}, ...responses), null, 2)
      );
      searchSpinner.succeed("File saved.");
    } catch (e) {
      console.log(e);
      searchSpinner.fail(`Error: ${e}`);
    }
  }
};

module.exports = initialize();
