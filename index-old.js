const fm = require('front-matter');
const fs = require('fs');
const meow = require('meow');
const ora = require('ora');
const Spotify = require('node-spotify-api');
const formatResponse = require('./src/formatResponse');

const targetDirectory = '../tinnitus/_posts/';
const savePath = './artists.json';

const cli = meow(
    `
    Usage
      $ get-artist-data

    Options
      --retry, -r  Retry requests that failed (TK)
      --clientId, -i  Client ID
      --clientSecret, -s  Client Secret

    Examples
      $ get-artist-data --r
`,
    {
        flags: {
            retry: {
                type: 'boolean',
                alias: 'r'
            },
            clientId: {
                type: 'string',
                alias: 'i'
            },
            clientSecret: {
                type: 'string',
                alias: 's'
            }
        }
    }
);

if (cli.flags.clientId === undefined || cli.flags.clientSecret === undefined) {
    console.log('clientId and clientSecret are required');
    process.exit();
}

const spotify = new Spotify({
    id: cli.flags.clientId,
    secret: cli.flags.clientSecret
});

const searchForArtistDataOnSpotify = query => {
    return spotify
        .search({ type: 'artist', query: query })
        .then(function(response) {
            if (
                !response ||
                !response.artists ||
                !response.artists.items ||
                response.artists.items.length === 0
            ) {
                return {
                    query,
                    data: {
                        error: 'No items'
                    }
                };
            }
            let item = response.artists.items.find(
                item => item.name.toLowerCase === query.toLowerCase
            );
            item = item || response.artists.items[0];
            return {
                query,
                data: {
                    name: items.name,
                    id: item.id,
                    items: response.artists.items.map(item => item.name)
                }
            };
        })
        .catch(function(error) {
            console.log(JSON.stringify(error, null, 2));
            return {
                query,
                data: error
            };
        });
};

const getTagsFromContent = content => {
    const data = fm(content);
    return data.attributes.tags || [];
};

const getContentsFromPath = path =>
    new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', (error, contents) => {
            if (error) reject(error);
            else resolve(contents);
        });
    });

const getFileNamesForDirectory = directory =>
    new Promise((resolve, reject) => {
        fs.readdir(directory, (error, fileNames) => {
            if (error) reject(error);
            else resolve(fileNames);
        });
    });

const getPathFromFileName = fileName => `./${targetDirectory}${fileName}`;

const flattenUniqueAndSortArray = array => {
    const flattendArray = array.reduce(
        (accumulator, currentValue) => accumulator.concat(currentValue),
        []
    );
    return [...new Set(flattendArray)].sort();
};

const saveFile = (path, data) =>
    new Promise((resolve, reject) => {
        fs.writeFile(path, data, 'utf8', error => {
            if (error) reject(error);
            else resolve();
        });
    });

const arrayToObject = array =>
    array.reduce((obj, item) => {
        obj[item.query] = item.data;
        return obj;
    }, {});

const initialize = async () => {
    try {
        const fileNamesSpinner = ora('Reading directory').start();
        const fileNames = await getFileNamesForDirectory(targetDirectory);
        fileNamesSpinner.succeed(`${fileNames.length} files found`);
        const fileContentsSpinner = ora('Reading contents').start();
        const filePaths = fileNames.map(fileName =>
            getPathFromFileName(fileName)
        );
        const fileContents = await Promise.all(
            filePaths.map(filePath => getContentsFromPath(filePath))
        );
        const tags = fileContents.map(fileContent =>
            getTagsFromContent(fileContent)
        );
        const artists = flattenUniqueAndSortArray(tags);
        fileContentsSpinner.succeed(`${artists.length} unique artists found`);
        const searchSpinner = ora('Searching Spotify for artists').start();
        const dataArray = await Promise.all(
            artists.map(artist => searchForArtistDataOnSpotify(artist))
        );
        searchSpinner.succeed('Search complete');
        const dataProcessingSpinner = ora('Processing data').start();
        const data = arrayToObject(dataArray);
        await saveFile(savePath, JSON.stringify(data, null, 2));
        dataProcessingSpinner.succeed('File saved');
        const errors = dataArray.filter(item => item.data.id === undefined);
        const sucesses = dataArray.filter(item => item.data.id !== undefined);
        console.log(`✅  ${sucesses.length}`);
        console.log(`🛑  ${errors.length}`);
    } catch (error) {
        console.log('🚨  Error: ' + error);
    }
};

initialize();
// const foo = async () => {
//     const result = await spotify.search({type: "artist", query: "andrew wk"});
//     console.log(JSON.stringify(result, null, 2));
//     return result;
// };
//
// foo();