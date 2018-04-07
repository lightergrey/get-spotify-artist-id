module.exports = (query, response) => {
  let formatted = {};

  if (response === undefined || response.error) {
    const { error: { error, message } } = response || { error: 'undefined', message: 'undefined'};
    formatted[query] = { error, message };
    return formatted;
  }

  const { artists: { items } } = response;

  if (items.length === 0) {
    formatted[query] = { error: "No matches found for query." };
    return formatted;
  }

  if (items.length > 0) {
    const item =
      items.find(item => item.name.toLowerCase() === query.toLowerCase()) ||
      items[0];
    const alternates = items.map(item => formatValidItem(item));

    formatted[query] = formatValidItem(item, alternates);
  }

  return formatted;
};

const formatValidItem = (item, alternates) => {
  const { name, id } = item;
  return { id, name, alternates };
};
