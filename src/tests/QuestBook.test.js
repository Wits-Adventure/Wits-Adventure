test('pagination buttons are disabled appropriately', async () => {
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Page 1 / 2')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    const prevButton = buttons.find(btn => 
      btn.querySelector('[data-testid="arrow-left"]')
    );
    const nextButton = buttons.find(btn => 
      btn.querySelector('[data-testid="arrow-right"]')
    );

    // On first page, previous should be disabled
    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();

    // Go to next page
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Page 2 / 2')).toBeInTheDocument();
    });

    // On last page, next should be disabled
    expect(prevButton).not.toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  test('handles user with null acceptedQuests', async () => {
    getUserData.mockResolvedValue({
      uid: 'testUser123',
      acceptedQuests: null // null instead of array
    });
    
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Page 1 / 1')).toBeInTheDocument();
    });
  });

  test('handles user with undefined data', async () => {
    getUserData.mockResolvedValue(null); // No user data
    
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Page 1 / 1')).toBeInTheDocument();
    });
  });

  test('console logs are called correctly', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Fetched quests:', mockQuests);
    });
    
    consoleSpy.mockRestore();
  });

  test('handles complex pagination scenarios', async () => {
    // Test with exactly 4 quests (1 page)
    const fourQuests = mockQuests.slice(0, 4);
    getAllQuests.mockResolvedValue(fourQuests);
    getUserData.mockResolvedValue({
      uid: 'testUser123',
      acceptedQuests: ['1', '2', '3', '4']
    });
    
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Page 1 / 1')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    const prevButton = buttons.find(btn => 
      btn.querySelector('[data-testid="arrow-left"]')
    );
    const nextButton = buttons.find(btn => 
      btn.querySelector('[data-testid="arrow-right"]')
    );

    // Both buttons should be disabled when there's only one page
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  test('handles empty accepted quests array', async () => {
    getUserData.mockResolvedValue({
      uid: 'testUser123',
      acceptedQuests: []
    });
    
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Page 1 / 1')).toBeInTheDocument();
    });
  });

  test('handles pagination edge cases', async () => {
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Page 1 / 2')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    const nextButton = buttons.find(btn => 
      btn.querySelector('[data-testid="arrow-right"]')
    );
    const prevButton = buttons.find(btn => 
      btn.querySelector('[data-testid="arrow-left"]')
    );

    // Test going beyond last page (should stay at last page)
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('Page 2 / 2')).toBeInTheDocument();
    });

    // Test going before first page (should stay at first page)
    fireEvent.click(prevButton);
    fireEvent.click(prevButton);
    
    await waitFor(() => {
      expect(screen.getByText('Page 1 / 2')).toBeInTheDocument();
    });
  });

  test('handles zero total pages scenario', async () => {
    getUserData.mockResolvedValue({
      uid: 'testUser123',
      acceptedQuests: []
    });
    getAllQuests.mockResolvedValue([]);
    
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('No quests available.')).toBeInTheDocument();
    });
  });import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
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
jest.mock('../media/LOGO_Final.jpg', () => 'LOGO_Final.jpg');
jest.mock('../media/trophy.png', () => 'trophy.png');

// Mock CSS import
jest.mock('../css/QuestBook.css', () => ({}));

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaArrowLeft: () => <span data-testid="arrow-left">←</span>,
  FaArrowRight: () => <span data-testid="arrow-right">→</span>,
  FaChevronLeft: () => <span data-testid="chevron-left">‹</span>
}));

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

// Mock Leaderboard component
jest.mock('../react_components/Leaderboard.js', () => {
  return function Leaderboard() {
    return (
      <div data-testid="leaderboard-component">
        <h2>Leaderboard</h2>
        <p>Leaderboard content</p>
      </div>
    );
  };
});

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Wrapper component for router
const RouterWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('QuestBook', () => {
  const mockQuests = [
    {
      id: '1',
      name: 'Test Quest 1',
      location: { latitude: -26.1234, longitude: 28.1234 },
      reward: 100,
      submissions: []
    },
    {
      id: '2',
      name: 'Test Quest 2',
      location: { latitude: -26.5678, longitude: 28.5678 },
      reward: 200,
      submissions: []
    },
    {
      id: '3',
      name: 'Test Quest 3',
      location: { latitude: -26.9012, longitude: 28.9012 },
      reward: 300,
      submissions: []
    },
    {
      id: '4',
      name: 'Test Quest 4',
      location: { latitude: -26.3456, longitude: 28.3456 },
      reward: 400,
      submissions: []
    },
    {
      id: '5',
      name: 'Test Quest 5',
      location: { latitude: -26.7890, longitude: 28.7890 },
      reward: 500,
      submissions: []
    }
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockNavigate.mockClear();
    
    // Mock default user data
    getUserData.mockResolvedValue({
      uid: 'testUser123',
      acceptedQuests: ['1', '2', '3', '4', '5']
    });
    
    // Mock quests data
    getAllQuests.mockResolvedValue(mockQuests);
  });

  test('renders loading gif initially', () => {
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    expect(screen.getByAltText('Loading...')).toBeInTheDocument();
  });

  test('renders quest book header and tabs correctly', async () => {
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    
    // Check header elements
    await waitFor(() => {
      expect(screen.getByText('Wits Adventure Quests')).toBeInTheDocument();
      
      // Check that tabs exist and have correct classes
      const tabs = document.querySelectorAll('.questbook-tab');
      expect(tabs).toHaveLength(2);
      
      const questsTab = Array.from(tabs).find(tab => tab.textContent === 'Quests');
      const leaderboardTab = Array.from(tabs).find(tab => tab.textContent === 'Leaderboard');
      
      expect(questsTab).toBeInTheDocument();
      expect(leaderboardTab).toBeInTheDocument();
      
      // Check that Quests tab is initially active
      expect(questsTab).toHaveClass('active');
      expect(leaderboardTab).not.toHaveClass('active');
    });
  });

  test('renders quests after loading', async () => {
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
      expect(screen.getByText('100 points')).toBeInTheDocument();
    });
  });

  test('displays quest details correctly', async () => {
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
      expect(screen.getByText('Lat: -26.123400')).toBeInTheDocument();
      expect(screen.getByText('Lng: 28.123400')).toBeInTheDocument();
      expect(screen.getByText('100 points')).toBeInTheDocument();
    });
  });

  test('handles pagination correctly', async () => {
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
      expect(screen.getByText('Page 1 / 2')).toBeInTheDocument();
    });

    // Find pagination buttons by querying for elements with arrow icons
    const buttons = screen.getAllByRole('button');
    const nextButton = buttons.find(btn => 
      btn.querySelector('[data-testid="arrow-right"]')
    );
    
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Page 2 / 2')).toBeInTheDocument();
      expect(screen.getByText('Test Quest 5')).toBeInTheDocument();
    });

    // Test previous button
    const prevButton = buttons.find(btn => 
      btn.querySelector('[data-testid="arrow-left"]')
    );
    
    fireEvent.click(prevButton);

    await waitFor(() => {
      expect(screen.getByText('Page 1 / 2')).toBeInTheDocument();
      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
    });
  });

  test('switches between tabs correctly', async () => {
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
    });

    // Find tabs by their className since they don't have role="tab"
    const tabs = document.querySelectorAll('.questbook-tab');
    const leaderboardTab = Array.from(tabs).find(tab => tab.textContent === 'Leaderboard');
    
    fireEvent.click(leaderboardTab);
    
    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-component')).toBeInTheDocument();
      expect(screen.getByText('Leaderboard content')).toBeInTheDocument();
    });

    // Click back to Quests tab
    const questsTab = Array.from(tabs).find(tab => tab.textContent === 'Quests');
    fireEvent.click(questsTab);
    
    await waitFor(() => {
      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
    });
  });

  test('opens complete quest form when turn in button is clicked', async () => {
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    
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

  test('quest form closes correctly and resets active quest', async () => {
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    
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
    
    // Test that we can open the form again (activeQuest was properly reset)
    fireEvent.click(turnInButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('complete-quest-form')).toBeInTheDocument();
    });
  });

  test('shows replace submission button for quests with user submissions', async () => {
    const questsWithUserSubmission = mockQuests.map(quest => ({
      ...quest,
      submissions: [{ userId: 'testUser123', submissionData: 'test' }]
    }));
    getAllQuests.mockResolvedValue(questsWithUserSubmission);
    
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getAllByText('Replace Submission')[0]).toBeInTheDocument();
    });
  });

  test('displays no quests message when quest list is empty', async () => {
    getAllQuests.mockResolvedValue([]);
    
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('No quests available.')).toBeInTheDocument();
    });
  });

  test('displays no quests when user has no accepted quests', async () => {
    getUserData.mockResolvedValue({
      uid: 'testUser123',
      acceptedQuests: [] // Empty accepted quests
    });
    
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    
    await waitFor(() => {
      // Should show pagination but no quests
      expect(screen.getByText('Page 1 / 1')).toBeInTheDocument();
    });
  });

  test('handles error when fetching quests', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    getAllQuests.mockRejectedValue(new Error('Failed to fetch quests'));

    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching quests:',
        expect.any(Error)
      );
    });
    
    consoleSpy.mockRestore();
  });

  test('handles error when fetching user data', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    getUserData.mockRejectedValue(new Error('Failed to fetch user data'));

    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching user:',
        expect.any(Error)
      );
    });
    
    consoleSpy.mockRestore();
  });

  test('navigates back to home when back button is clicked', async () => {
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
    });

    const backButton = screen.getByLabelText('Back to home');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('handles quest with no location data', async () => {
    const questsWithoutLocation = [
      {
        id: '1',
        name: 'Test Quest Without Location',
        location: null, // No location data
        reward: 100,
        submissions: []
      }
    ];
    
    getUserData.mockResolvedValue({
      uid: 'testUser123',
      acceptedQuests: ['1']
    });
    
    getAllQuests.mockResolvedValue(questsWithoutLocation);
    
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test Quest Without Location')).toBeInTheDocument();
      expect(screen.getByText('Lat: N/A')).toBeInTheDocument();
      expect(screen.getByText('Lng: N/A')).toBeInTheDocument();
    });
  });

  test('handles quest with no name', async () => {
    const questsWithoutName = [
      {
        id: '1',
        name: null, // No name
        location: { latitude: -26.1234, longitude: 28.1234 },
        reward: 100,
        submissions: []
      }
    ];
    
    getUserData.mockResolvedValue({
      uid: 'testUser123',
      acceptedQuests: ['1']
    });
    
    getAllQuests.mockResolvedValue(questsWithoutName);
    
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Untitled Quest')).toBeInTheDocument();
    });
  });

  test('handles quest with no reward', async () => {
    const questsWithoutReward = [
      {
        id: '1',
        name: 'Test Quest',
        location: { latitude: -26.1234, longitude: 28.1234 },
        reward: null, // No reward
        submissions: []
      }
    ];
    
    getUserData.mockResolvedValue({
      uid: 'testUser123',
      acceptedQuests: ['1']
    });
    
    getAllQuests.mockResolvedValue(questsWithoutReward);
    
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('0 points')).toBeInTheDocument();
    });
  });

  test('handles quest with no submissions array', async () => {
    const questsWithoutSubmissions = [
      {
        id: '1',
        name: 'Test Quest',
        location: { latitude: -26.1234, longitude: 28.1234 },
        reward: 100
        // No submissions property
      }
    ];
    
    getUserData.mockResolvedValue({
      uid: 'testUser123',
      acceptedQuests: ['1']
    });
    
    getAllQuests.mockResolvedValue(questsWithoutSubmissions);
    
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Turn in Quest')).toBeInTheDocument();
    });
  });
});
  test('handles quest with invalid location coordinates', async () => {
    const questsWithInvalidLocation = [
      {
        id: '1',
        name: 'Test Quest',
        location: { latitude: 'invalid', longitude: 'invalid' },
        reward: 100,
        submissions: []
      }
    ];
    
    getUserData.mockResolvedValue({
      uid: 'testUser123',
      acceptedQuests: ['1']
    });
    
    getAllQuests.mockResolvedValue(questsWithInvalidLocation);
    
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Lat: N/A')).toBeInTheDocument();
      expect(screen.getByText('Lng: N/A')).toBeInTheDocument();
    });
  });

  test('filters quests correctly based on accepted quests', async () => {
    getUserData.mockResolvedValue({
      uid: 'testUser123',
      acceptedQuests: ['1', '3'] // Only accept quests 1 and 3
    });
    
    render(
      <RouterWrapper>
        <QuestBook />
      </RouterWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test Quest 1')).toBeInTheDocument();
      expect(screen.getByText('Test Quest 3')).toBeInTheDocument();
      expect(screen.queryByText('Test Quest 2')).not.toBeInTheDocument();
    });
  });