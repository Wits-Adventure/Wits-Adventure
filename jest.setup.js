// jest.setup.js
import "whatwg-fetch"; // or node-fetch

// OR manual mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
);

