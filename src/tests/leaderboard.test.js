import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Leaderboard from '../react_components/Leaderboard';
import { collection, getDocs } from 'firebase/firestore';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock('../firebase/firebase', () => ({
  db: {},
}));

// Mock CSS import
jest.mock('../css/Leaderboard.css', () => ({}));

describe('Leaderboard Component', () => {
  const mockUsers = [
    {
      id: '1',
      data: () => ({
        Name: 'John Doe',
        LeaderBoardPoints: 150,
        Level: 5,
        Email: 'john@example.com',
      }),
    },
    {
      id: '2',
      data: () => ({
        Name: 'Jane Smith',
        LeaderBoardPoints: 200,
        Level: 7,
        Email: 'jane@example.com',
      }),
    },
    {
      id: '3',
      data: () => ({
        Name: 'Bob Wilson',
        LeaderBoardPoints: 100,
        Level: 3,
        Email: 'bob@example.com',
      }),
    },
  ];

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementation
    collection.mockReturnValue('mocked-collection');
    getDocs.mockResolvedValue({
      docs: mockUsers,
    });
  });

  test('renders leaderboard table with headers', async () => {
    render(<Leaderboard />);
    
    expect(screen.getByText('Rank')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Points')).toBeInTheDocument();
    expect(screen.getByText('Level')).toBeInTheDocument();
  });

  test('fetches and displays users from Firebase', async () => {
    render(<Leaderboard />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    expect(collection).toHaveBeenCalledWith({}, 'Users');
    expect(getDocs).toHaveBeenCalledWith('mocked-collection');
  });

  test('displays users sorted by LeaderBoardPoints in descending order', async () => {
    render(<Leaderboard />);
    
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      // Skip header row (index 0)
      expect(rows[1]).toHaveTextContent('1Jane Smith200');
      expect(rows[2]).toHaveTextContent('2John Doe150');
      expect(rows[3]).toHaveTextContent('3Bob Wilson100');
    });
  });

  test('displays correct rank numbers', async () => {
    render(<Leaderboard />);
    
    await waitFor(() => {
      const rankCells = screen.getAllByRole('cell').filter((cell, index) => index % 4 === 0);
      expect(rankCells[0]).toHaveTextContent('1');
      expect(rankCells[1]).toHaveTextContent('2');
      expect(rankCells[2]).toHaveTextContent('3');
    });
  });

  test('handles users with missing data fields', async () => {
    const incompleteUsers = [
      {
        id: '1',
        data: () => ({
          Name: 'Complete User',
          LeaderBoardPoints: 100,
          Level: 5,
          Email: 'complete@example.com',
        }),
      },
      {
        id: '2',
        data: () => ({
          // Missing Name, LeaderBoardPoints, Level, Email
        }),
      },
    ];

    getDocs.mockResolvedValue({
      docs: incompleteUsers,
    });

    render(<Leaderboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Complete User')).toBeInTheDocument();
      // Check that empty string is handled for missing Name
      const rows = screen.getAllByRole('row');
      expect(rows[2]).toHaveTextContent('2'); // Second user gets rank 2
      expect(rows[2]).toHaveTextContent('0'); // Default points and level
    });
  });

  test('handles empty user list', async () => {
    getDocs.mockResolvedValue({
      docs: [],
    });

    render(<Leaderboard />);
    
    await waitFor(() => {
      const tbody = screen.getByRole('table').querySelector('tbody');
      expect(tbody.children).toHaveLength(0);
    });
  });

  test('handles Firebase error gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    getDocs.mockRejectedValue(new Error('Firebase error'));

    render(<Leaderboard />);
    
    // Component should still render even if Firebase fails
    expect(screen.getByText('Rank')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    
    consoleError.mockRestore();
  });

  test('applies correct CSS classes', () => {
    render(<Leaderboard />);
    
    const container = screen.getByRole('table').closest('.leaderboard-container');
    const table = screen.getByRole('table');
    
    expect(container).toHaveClass('leaderboard-container');
    expect(table).toHaveClass('leaderboard-table');
  });

  test('uses correct key prop for table rows', async () => {
    render(<Leaderboard />);
    
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      // Check that rows are rendered (we can't directly test key props in RTL,
      // but we can ensure the component renders correctly with unique data)
      expect(rows).toHaveLength(4); // 1 header + 3 data rows
    });
  });

  test('displays all user data correctly in table cells', async () => {
    render(<Leaderboard />);
    
    await waitFor(() => {
      // Test first user (highest points - Jane Smith)
      expect(screen.getByText('1')).toBeInTheDocument(); // Rank
      expect(screen.getByText('Jane Smith')).toBeInTheDocument(); // Name
      expect(screen.getByText('200')).toBeInTheDocument(); // Points
      expect(screen.getByText('7')).toBeInTheDocument(); // Level
    });
  });

  test('sorts users with equal points consistently', async () => {
    const equalPointsUsers = [
      {
        id: '1',
        data: () => ({
          Name: 'User A',
          LeaderBoardPoints: 100,
          Level: 3,
          Email: 'a@example.com',
        }),
      },
      {
        id: '2',
        data: () => ({
          Name: 'User B',
          LeaderBoardPoints: 100,
          Level: 3,
          Email: 'b@example.com',
        }),
      },
    ];

    getDocs.mockResolvedValue({
      docs: equalPointsUsers,
    });

    render(<Leaderboard />);
    
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      // Both users should appear, order may vary but both should have their ranks
      expect(rows[1]).toHaveTextContent('1');
      expect(rows[2]).toHaveTextContent('2');
    });
  });
});