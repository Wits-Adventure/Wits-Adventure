import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuestBook from '../react_components/QuestBook';
import { getUserData } from '../firebase/firebase';
import { getAllQuests } from '../firebase/general_quest_functions';

// Mock the required modules
jest.mock('../firebase/firebase', () => ({
  getUserData: jest.fn()
}));

jest.mock('../firebase/general_quest_functions', () => ({
  getAllQuests: jest.fn()
}));

// Mock image imports
jest.mock('../media/logo.jpg', () => 'logo.jpg');
jest.mock('../media/trophy.png', () => 'trophy.png');

// Mock CompleteQuestForm component
jest.mock('../react_components/CompleteQuestForm', () => {
  return function CompleteQuestForm({ isOpen, onClose, quest }) {
    if (!isOpen) return null;
    return (
      <div data-testid="complete-quest-form">
        <h2>Complete Quest Form</h2>
        <p>Quest: {quest?.name}</p>
        <button onClick={onClose}>Close Form</button>
      </div>
    );
  };
});

describe('QuestBook', () => {
  const mockQuests = [
    {
      id: '1',
      name: 'Test Quest 1',
      location: { latitude: -26.1234, longitude: 28.1234 },
      reward: 100
    },
    {
      id: '2',
      name: 'Test Quest 2',
      location: { latitude: -26.5678, longitude: 28.5678 },
      reward: 200
    },
    {
      id: '3',
      name: 'Test Quest 3',
      location: { latitude: -26.9012, longitude: 28.9012 },
      reward: 300
    },
    {
      id: '4',
      name: 'Test Quest 4',
      location: { latitude: -26.3456, longitude: 28.3456 },
      reward: 400
    },
    {
      id: '5',
      name: 'Test Quest 5',
      location: { latitude: -26.7890, longitude: 28.7890 },
      reward: 500
    }
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    // Mock default user data
    getUserData.mockResolvedValue({
      uid: 'testUser123',
      acceptedQuests: ['1', '2', '3', '4', '5']
    });
    // Mock quests data with submissions
    const questsWithSubmissions = mockQuests.map(quest => ({
      ...quest,
      submissions: []
    }));
    getAllQuests.mockResolvedValue(questsWithSubmissions);
  });

  test('renders loading state initially', () => {
    render(<QuestBook />);
    expect(screen.getByText('Loading quests...')).toBeInTheDocument();
  });

  test('renders quests after loading', async () => {
    render(<QuestBook />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
      expect(screen.getByText('100 points')).toBeInTheDocument();
    });
  });

  test('handles pagination correctly', async () => {
    render(<QuestBook />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    expect(screen.getByText('Test Quest 5')).toBeInTheDocument();
  });

  test('switches between tabs correctly', async () => {
    render(<QuestBook />);

    await waitFor(() => {
      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
    });

    // Click Leaderboard tab
    fireEvent.click(screen.getByText('Leaderboard'));
    expect(screen.getByText('Leaderboard content will go here.')).toBeInTheDocument();

    // Click back to Quests tab
    fireEvent.click(screen.getByText('Quests'));
    expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
  });

  test('opens complete quest form when turn in button is clicked', async () => {
    render(<QuestBook />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
    });

    const turnInButton = screen.getAllByText('Turn in Quest')[0];
    fireEvent.click(turnInButton);

    await waitFor(() => {
      expect(screen.getByTestId('complete-quest-form')).toBeInTheDocument();
      expect(screen.getByText('Quest: Test Quest 1')).toBeInTheDocument();
    });
  });

  test('handles error when fetching quests', async () => {
    console.error = jest.fn();
    getAllQuests.mockRejectedValue(new Error('Failed to fetch quests'));

    render(<QuestBook />);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching quests:',
        expect.any(Error)
      );
    });
  });

  test('handles error when fetching user data', async () => {
    console.error = jest.fn();
    getUserData.mockRejectedValue(new Error('Failed to fetch user data'));

    render(<QuestBook />);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching user:',
        expect.any(Error)
      );
    });
  });

  test('displays no quests message when quest list is empty', async () => {
    getAllQuests.mockResolvedValue([]);
    
    render(<QuestBook />);
    
    await waitFor(() => {
      expect(screen.getByText('No quests available.')).toBeInTheDocument();
    });
  });

  test('shows replace submission button for quests with user submissions', async () => {
    const questsWithUserSubmission = mockQuests.map(quest => ({
      ...quest,
      submissions: [{ userId: 'testUser123', submissionData: 'test' }]
    }));
    getAllQuests.mockResolvedValue(questsWithUserSubmission);
    
    render(<QuestBook />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Replace Submission')[0]).toBeInTheDocument();
    });
  });

  test('closes complete quest form when close button is clicked', async () => {
    render(<QuestBook />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
    });

    const turnInButton = screen.getAllByText('Turn in Quest')[0];
    fireEvent.click(turnInButton);

    await waitFor(() => {
      expect(screen.getByTestId('complete-quest-form')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('Close Form');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('complete-quest-form')).not.toBeInTheDocument();
    });
  });

  test('renders quest locations correctly', async () => {
    render(<QuestBook />);
    
    await waitFor(() => {
      expect(screen.getByText('Latitude: -26.123400')).toBeInTheDocument();
      expect(screen.getByText('Longitude: 28.123400')).toBeInTheDocument();
    });
  });
});