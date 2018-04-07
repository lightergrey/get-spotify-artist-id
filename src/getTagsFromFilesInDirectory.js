const fs = require("./fs-promise");
const frontMatter = require("front-matter");

module.exports = async directory => {
  const fileNames = await fs.readdir(directory);
  const fileContents = await Promise.all(
    fileNames.map(fileName => fs.readFile(`./${directory}${fileName}`))
  );
  const frontMatterTags = fileContents
    .map(fileContent => {
      const fm = frontMatter(fileContent);
      return fm.attributes.tags || [];
    })
    .reduce(
      (accumulator, currentValue) => accumulator.concat(currentValue),
      []
    );
  return [...new Set(frontMatterTags)].sort();
};
