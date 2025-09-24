import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Success from '../react_components/success';
import { auth, getUserData } from '../firebase/firebase';

// Mock Firebase
jest.mock('../firebase/firebase', () => ({
  auth: {
    currentUser: null
  },
  getUserData: jest.fn()
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Success Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderSuccess = () => {
    return render(
      <BrowserRouter>
        <Success />
      </BrowserRouter>
    );
  };

  test('renders loading state initially', () => {
    renderSuccess();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('redirects to login when no user is logged in', async () => {
    auth.currentUser = null;
    renderSuccess();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('displays user data when logged in', async () => {
    const mockUser = {
      uid: 'test123',
      email: 'test@example.com'
    };
    const mockUserData = {
      Name: 'John Doe',
      Role: 'student',
      Email: 'test@example.com',
      LeaderBoardPoints: 150
    };

    auth.currentUser = mockUser;
    getUserData.mockResolvedValue(mockUserData);

    renderSuccess();

    await waitFor(() => {
      expect(screen.getByText('Login Successful!')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('student')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });

  test('handles missing leaderboard points', async () => {
    const mockUser = { uid: 'test123' };
    const mockUserData = {
      Name: 'John Doe',
      Role: 'student',
      Email: 'test@example.com'
    };

    auth.currentUser = mockUser;
    getUserData.mockResolvedValue(mockUserData);

    renderSuccess();

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  test('handles getUserData error', async () => {
    const mockUser = { uid: 'test123' };
    auth.currentUser = mockUser;
    getUserData.mockRejectedValue(new Error('Failed to fetch'));
    console.error = jest.fn();

    renderSuccess();

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to fetch user data:', expect.any(Error));
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('displays correct styling', async () => {
    const mockUser = { uid: 'test123' };
    const mockUserData = {
      Name: 'John Doe',
      Role: 'student',
      Email: 'test@example.com',
      LeaderBoardPoints: 150
    };

    auth.currentUser = mockUser;
    getUserData.mockResolvedValue(mockUserData);

    renderSuccess();

    await waitFor(() => {
      const container = screen.getByText('Login Successful!').closest('main');
      expect(container).toHaveStyle({
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f0f2f5'
      });
    });
  });
});