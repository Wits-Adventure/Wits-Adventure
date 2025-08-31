import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserData } from '../firebase/firebase';
import Unauthorized from '../react_components/unauthorized';

// Mock the required modules
jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../firebase/firebase', () => ({
  getUserData: jest.fn()
}));

// Wrapper component to provide router context
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Unauthorized Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  test('shows loading state initially', () => {
    useAuth.mockReturnValue({ currentUser: { uid: 'test-uid' } });
    getUserData.mockImplementation(() => new Promise(() => {}));

    renderWithRouter(<Unauthorized />);
    expect(screen.getByText('Loading user data...')).toBeInTheDocument();
  });

  test('displays student homepage link for student role', async () => {
    useAuth.mockReturnValue({ currentUser: { uid: 'test-uid' } });
    getUserData.mockResolvedValue({ Role: 'student' });

    renderWithRouter(<Unauthorized />);

    await waitFor(() => {
      expect(screen.getByText('Go to your Student homepage')).toHaveAttribute('href', '/student-homepage');
    });
  });

  test('displays admin homepage link for admin role', async () => {
    useAuth.mockReturnValue({ currentUser: { uid: 'test-uid' } });
    getUserData.mockResolvedValue({ Role: 'admin' });

    renderWithRouter(<Unauthorized />);

    await waitFor(() => {
      expect(screen.getByText('Go to your Admin homepage')).toHaveAttribute('href', '/admin-dashboard');
    });
  });

  test('displays error message when fetching user role fails', async () => {
    useAuth.mockReturnValue({ currentUser: { uid: 'test-uid' } });
    getUserData.mockRejectedValue(new Error('Failed to fetch user role'));

    renderWithRouter(<Unauthorized />);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch user role:',
        expect.any(Error)
      );
    });
  });

  test('displays standard homepage link', async () => {
    useAuth.mockReturnValue({ currentUser: { uid: 'test-uid' } });
    getUserData.mockResolvedValue({ Role: 'student' });

    renderWithRouter(<Unauthorized />);

    await waitFor(() => {
      expect(screen.getByText('Go back to the standard homepage')).toHaveAttribute('href', '/');
    });
  });

  test('displays unauthorized message', async () => {
    useAuth.mockReturnValue({ currentUser: { uid: 'test-uid' } });
    getUserData.mockResolvedValue({ Role: 'student' });

    renderWithRouter(<Unauthorized />);

    await waitFor(() => {
      expect(screen.getByText('403 - Unauthorized Access')).toBeInTheDocument();
      expect(screen.getByText('You do not have permission to view this page.')).toBeInTheDocument();
    });
  });

  test('handles no user case', async () => {
    useAuth.mockReturnValue({ currentUser: null });

    renderWithRouter(<Unauthorized />);

    await waitFor(() => {
      expect(screen.getByText('403 - Unauthorized Access')).toBeInTheDocument();
    });
  });
});