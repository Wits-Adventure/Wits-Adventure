// App.test.js
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock react-router-dom so Jest can run
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ element }) => <div>{element}</div>
}));

test('renders welcome message', () => {
  render(<App />);
  const messageElement = screen.getByText(/welcome to wits adventure/i);
  expect(messageElement).toBeInTheDocument();
});
