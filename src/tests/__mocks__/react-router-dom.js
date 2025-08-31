// src/tests/__mocks__/react-router-dom.js
const actual = jest.requireActual('react-router-dom');

module.exports = {
  ...actual,
  // Mock the Navigate component
  Navigate: ({ to }) => {
    // Return a simple div with a data-testid
    return <div data-testid="navigate" data-to={to}>{to}</div>;
  },
};