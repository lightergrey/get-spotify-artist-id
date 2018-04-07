const formatResponse = require("./formatResponse");

test("formats a successful response that matches exactly", () => {
  const query = "Andrew W.K.";
  const response = {
    artists: {
      items: [
        {
          id: "1",
          name: "Pantaleimon & Andrew W.K"
        },
        {
          id: "2",
          name: "Andrew W.K."
        }
      ]
    }
  };
  const expected = {
    "Andrew W.K.": {
      name: "Andrew W.K.",
      id: "2",
      alternates: [
        {
          id: "1",
          name: "Pantaleimon & Andrew W.K"
        },
        {
          id: "2",
          name: "Andrew W.K."
        }
      ]
    }
  };
  expect(formatResponse(query, response)).toEqual(expected);
});

test("formats a successful response that does not match exactly", () => {
  const query = "Andrew W.K.";
  const response = {
    artists: {
      items: [
        {
          id: "1",
          name: "Pantaleimon & Andrew W.K"
        },
        {
          id: "2",
          name: "Andrew W.K. foo"
        }
      ]
    }
  };
  const expected = {
    "Andrew W.K.": {
      name: "Pantaleimon & Andrew W.K",
      id: "1",
      alternates: [
        {
          id: "1",
          name: "Pantaleimon & Andrew W.K"
        },
        {
          id: "2",
          name: "Andrew W.K. foo"
        }
      ]
    }
  };
  expect(formatResponse(query, response)).toEqual(expected);
});

test("formats no items", () => {
  const query = "Andrew W.K.";
  const response = {
    artists: {
      items: []
    }
  };
  const expected = {
    "Andrew W.K.": {
      error: "No matches found for query."
    }
  };
  expect(formatResponse(query, response)).toEqual(expected);
});

test("formats an error", () => {
  const query = "Andrew W.K.";
  const response = {
    error: {
      statusCode: 429,
      error: {
        status: 429,
        message: "API rate limit exceeded"
      }
    }
  };
  const expected = {
    "Andrew W.K.": {
      error: {
        status: 429,
        message: "API rate limit exceeded"
      }
    }
  };
  expect(formatResponse(query, response)).toEqual(expected);
});
