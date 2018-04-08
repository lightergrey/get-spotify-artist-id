const formatResponse = require("./formatResponse");
const Spotify = require("node-spotify-api");

let spotify;

const promiseSerial = fns =>
  fns.reduce(
    (promise, fn) =>
      promise.then(result => fn().then(Array.prototype.concat.bind(result))),
    Promise.resolve([])
  );

const formatQuery = (query) => '"' + query.replace(/[“”‘’]/g, "") + '"';

const getRequests = queries => queries.map(query => () => {
  return spotify
    .search({
      type: "artist",
      query: formatQuery(query)
    })
    .then(data => formatResponse(query, data))
    .catch(error => formatResponse(query, error));
});

module.exports = async (clientId, clientSecret, queries) => {
  spotify = new Spotify({
    id: clientId,
    secret: clientSecret
  });

  const requests = getRequests(queries);

  return promiseSerial(requests);
};
