module.exports = (query, response) => {

  if (response === undefined) {
    return {
      [query]: { error: { status: "Undefined", message: "Undefined" } }
    };
  }

  if (response.error) {
    const {
      error: { error: { status = "undefined", message = "undefined" } }
    } = response;
    return { [query]: { error: { status, message } } };
  }

  const { artists: { items = [] } } = response;

  if (items.length === 0) {
    return { [query]: { error: "No matches found for query." } };
  }

  const { name, id } =
    items.find(item => item.name.toLowerCase() === query.toLowerCase()) ||
    items[0];

  const alternates = items.map(item => {
    const { name, id } = item;
    return { id, name };
  });

  return { [query]: { id, name, alternates } };
};
