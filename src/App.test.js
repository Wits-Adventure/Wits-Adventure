import { render, screen } from '@testing-library/react';
import App from './App';

test('renders welcome message', () => {
  render(<App />);
  const messageElement = screen.getByText(/welcome to wits adventure/i);
  expect(messageElement).toBeInTheDocument();
});