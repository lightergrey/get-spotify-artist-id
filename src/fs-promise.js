const fs = require("fs");
const writeFile = (path, data) =>
  new Promise((resolve, reject) => {
    fs.writeFile(path, data, "utf8", error => {
      if (error) reject(error);
      else resolve();
    });
  });

const readdir = directory =>
  new Promise((resolve, reject) => {
    fs.readdir(directory, (error, fileNames) => {
      if (error) reject(error);
      else resolve(fileNames);
    });
  });

const readFile = path =>
  new Promise((resolve, reject) => {
    fs.readFile(path, "utf8", (error, contents) => {
      if (error) reject(error);
      else resolve(contents);
    });
  });
module.exports = {
  writeFile,
  readdir,
  readFile
};
