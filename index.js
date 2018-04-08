const fs = require("./src/fs-promise");
const getFormattedArtistInfoFromSpotify = require("./src/getFormattedArtistInfoFromSpotify");
const getTagsFromFilesInDirectory = require("./src/getTagsFromFilesInDirectory");
const ora = require("ora");
const promptly = require("promptly");

const requestTypes = {
  query: "q",
  directory: "d"
};

let spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
let spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;

const initialize = async () => {
  if (!spotifyClientId) {
    spotifyClientId = await promptly.prompt("Spotify Client ID: ");
  }

  if (!spotifyClientSecret) {
    spotifyClientSecret = await promptly.prompt("Spotify Client Secret: ");
  }

  const requestType = await promptly.choose(
    `Request type: (q)uery or (d)irectory (default query)?`,
    ["q", "d"],
    { default: requestTypes.query }
  );

  if (requestType === requestTypes.query) {
    const query = await promptly.prompt("Query: ");
    const result = await getFormattedArtistInfoForQueries([query]);
    console.log("Result: " + JSON.stringify(result[0], null, 2));
  }

  if (requestType === requestTypes.directory) {
    const directory = await promptly.prompt("Directory: (default './test/')", {
      default: "./test/"
    });
    const tags = await getTagsFromFilesInDirectory(directory);
    const results = await getFormattedArtistInfoForQueries(tags);
    const shouldSaveFile = await promptly.choose(
      `Should save file? (y) or (n)*`,
      ["y", "n"],
      { default: "n" }
    );
    if (shouldSaveFile) {
      const outputPath = await promptly.prompt(
        "Output path: (default './artists.json')",
        {
          default: "./artists.json"
        }
      );
      fs.writeFile(
        outputPath,
        JSON.stringify(Object.assign({}, ...results), null, 2)
      );
    }
  }
};

const getFormattedArtistInfoForQueries = async queries => {
  const searchSpinner = ora("Searching").start();
  try {
    const responses = await getFormattedArtistInfoFromSpotify(
      spotifyClientId,
      spotifyClientSecret,
      queries
    );
    searchSpinner.succeed("Finished searching");
    return responses;
  } catch (error) {
    searchSpinner.fail(`${error}`);
  }
};

module.exports = initialize();
