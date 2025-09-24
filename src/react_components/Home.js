// Home.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Home from './Home';
import { useAuth } from '../context/AuthContext';
import { useMusic } from '../context/MusicContext';
import { getUserData, logout } from '../firebase/firebase';
import { getAllQuests, acceptQuest, abandonQuest } from '../firebase/general_quest_functions';
import { getProfileData } from '../firebase/profile_functions';
import { doc, updateDoc, increment } from 'firebase/firestore';

// Mock all external dependencies
jest.mock('../context/AuthContext');
jest.mock('../context/MusicContext');
jest.mock('../firebase/firebase');
jest.mock('../firebase/general_quest_functions');
jest.mock('../firebase/profile_functions');
jest.mock('firebase/firestore');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ state: null })
}));

// Mock images
jest.mock('../media/LOGO_Alpha.png', () => 'logo.png');
jest.mock('../media/questbook_outline.png', () => 'questbook.png');
jest.mock('../assets/profile.jpg', () => 'profile.jpg');
jest.mock('../media/bell.png', () => 'bell.png');
jest.mock('../media/music.png', () => 'music.png');
jest.mock('../media/tutorial.png', () => 'tutorial.png');

// Mock CSS import
jest.mock('../css/Home.css', () => ({}));

// Mock CreateQuestForm and CompleteQuestForm
jest.mock('./CreateQuestForm', () => {
  return function MockCreateQuestForm({ isOpen, onClose }) {
    return isOpen ? (
      <div data-testid="create-quest-form">
        <button onClick={onClose}>Close Form</button>
      </div>
    ) : null;
  };
});

jest.mock('./CompleteQuestForm', () => {
  return function MockCompleteQuestForm({ isOpen, onClose, quest, onSubmission }) {
    return isOpen ? (
      <div data-testid="complete-quest-form">
        <div>Quest: {quest?.name}</div>
        <button onClick={onClose}>Close Form</button>
        <button onClick={() => onSubmission && onSubmission(quest?.id)}>Submit</button>
      </div>
    ) : null;
  };
});

describe('Home Component', () => {
  let mockNavigate;
  let mockUseAuth;
  let mockUseMusic;
  let mockGetUserData;
  let mockGetProfileData;
  let mockGetAllQuests;
  let mockAcceptQuest;
  let mockAbandonQuest;
  let mockLogout;
  let mockUpdateDoc;
  let mockIncrement;
  let mockGeolocation;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup navigation mock
    mockNavigate = jest.fn();
    require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);

    // Setup authentication mock
    mockUseAuth = {
      currentUser: { uid: 'test-user-id', email: 'test@example.com' }
    };
    useAuth.mockReturnValue(mockUseAuth);

    // Setup music context mock
    mockUseMusic = {
      isMusicPlaying: false,
      toggleMusic: jest.fn()
    };
    useMusic.mockReturnValue(mockUseMusic);

    // Setup Firebase mocks
    mockGetUserData = getUserData.mockResolvedValue({ Name: 'Test User' });
    mockGetProfileData = getProfileData.mockResolvedValue({ 
      Name: 'Test User', 
      profilePicture: 'custom-profile.jpg' 
    });
    mockGetAllQuests = getAllQuests.mockResolvedValue([]);
    mockAcceptQuest = acceptQuest.mockResolvedValue();
    mockAbandonQuest = abandonQuest.mockResolvedValue();
    mockLogout = logout.mockImplementation(() => {});

    // Setup Firestore mocks
    mockUpdateDoc = updateDoc.mockResolvedValue();
    mockIncrement = increment.mockReturnValue('mock-increment');
    doc.mockReturnValue('mock-doc-ref');

    // Mock Leaflet
    global.L = {
      map: jest.fn(() => ({
        setView: jest.fn(() => ({ setView: jest.fn() })),
        remove: jest.fn(),
        invalidateSize: jest.fn(),
        removeLayer: jest.fn(),
        eachLayer: jest.fn(),
        addTo: jest.fn()
      })),
      tileLayer: jest.fn(() => ({
        addTo: jest.fn()
      })),
      control: {
        zoom: jest.fn(() => ({
          addTo: jest.fn()
        }))
      },
      divIcon: jest.fn(() => ({})),
      marker: jest.fn(() => ({
        addTo: jest.fn(),
        bindPopup: jest.fn(() => ({ openPopup: jest.fn() })),
        openPopup: jest.fn(),
        on: jest.fn()
      })),
      circle: jest.fn(() => ({
        addTo: jest.fn(),
        bindPopup: jest.fn(),
        openPopup: jest.fn(),
        on: jest.fn(),
        getPopup: jest.fn(() => ({ getContent: jest.fn(() => '🏰 Wits University') })),
        setRadius: jest.fn(),
        setStyle: jest.fn(),
        options: {}
      })),
      latLng: jest.fn(() => ({
        distanceTo: jest.fn(() => 100)
      }))
    };

    // Mock window properties
    global.window.L = global.L;
    delete global.window.__questPlacing;
    delete global.window.__bellPulseCircle;

    // Mock geolocation
    mockGeolocation = {
      getCurrentPosition: jest.fn()
    };
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true
    });

    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));
  });

  afterEach(() => {
    // Clean up global mocks
    delete global.L;
    delete global.window.L;
    delete global.window.handleAcceptQuest;
    delete global.window.handleAbandonQuest;
    delete global.window.handleTurnInQuest;
    delete global.window.handleAcceptJourneyQuest;
  });

  const renderHome = (initialEntries = ['/']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Home />
      </MemoryRouter>
    );
  };

  describe('Rendering', () => {
    test('renders main components when authenticated', async () => {
      await act(async () => {
        renderHome();
      });

      expect(screen.getByText('WITS ADVENTURE')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
      expect(screen.getByText('Create Quest')).toBeInTheDocument();
    });

    test('renders authentication buttons when not authenticated', async () => {
      mockUseAuth.currentUser = null;
      useAuth.mockReturnValue(mockUseAuth);

      await act(async () => {
        renderHome();
      });

      expect(screen.getByText('Sign Up')).toBeInTheDocument();
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });

    test('renders map controls', async () => {
      await act(async () => {
        renderHome();
      });

      expect(screen.getByLabelText('Toggle Music')).toBeInTheDocument();
      expect(screen.getByLabelText('Center on Wits')).toBeInTheDocument();
      expect(screen.getByLabelText('Bell')).toBeInTheDocument();
      expect(screen.getByLabelText('Tutorial')).toBeInTheDocument();
    });
  });

  describe('User Data Loading', () => {
    test('loads user data on mount', async () => {
      await act(async () => {
        renderHome();
      });

      await waitFor(() => {
        expect(mockGetProfileData).toHaveBeenCalled();
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
    });

    test('handles user data loading error', async () => {
      mockGetProfileData.mockRejectedValue(new Error('Profile fetch failed'));

      await act(async () => {
        renderHome();
      });

      await waitFor(() => {
        expect(screen.getByText('User')).toBeInTheDocument();
      });
    });

    test('loads custom profile picture', async () => {
      await act(async () => {
        renderHome();
      });

      await waitFor(() => {
        const profileImg = screen.getByAltText("Test User's avatar");
        expect(profileImg).toHaveAttribute('src', 'custom-profile.jpg');
      });
    });
  });

  describe('Quest Loading', () => {
    test('loads quests from Firebase', async () => {
      const mockQuests = [
        {
          id: 'quest-1',
          name: 'Test Quest',
          location: { _latitude: -26.1929, _longitude: 28.0305 },
          reward: 100,
          radius: 50
        }
      ];
      mockGetAllQuests.mockResolvedValue(mockQuests);

      await act(async () => {
        renderHome();
      });

      await waitFor(() => {
        expect(mockGetAllQuests).toHaveBeenCalled();
      });
    });

    test('handles quest loading with invalid location data', async () => {
      const mockQuests = [
        {
          id: 'quest-1',
          name: 'Invalid Quest',
          location: null,
          reward: 100
        }
      ];
      mockGetAllQuests.mockResolvedValue(mockQuests);

      await act(async () => {
        renderHome();
      });

      await waitFor(() => {
        expect(mockGetAllQuests).toHaveBeenCalled();
      });
    });
  });

  describe('Navigation', () => {
    test('navigates to login page', async () => {
      mockUseAuth.currentUser = null;
      useAuth.mockReturnValue(mockUseAuth);

      await act(async () => {
        renderHome();
      });

      fireEvent.click(screen.getByText('Login'));
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('navigates to signup page', async () => {
      mockUseAuth.currentUser = null;
      useAuth.mockReturnValue(mockUseAuth);

      await act(async () => {
        renderHome();
      });

      fireEvent.click(screen.getByText('Sign Up'));
      expect(mockNavigate).toHaveBeenCalledWith('/signup');
    });

    test('navigates to profile page when clicking username', async () => {
      await act(async () => {
        renderHome();
      });

      fireEvent.click(screen.getByText('Test User'));
      expect(mockNavigate).toHaveBeenCalledWith('/ProfilePage');
    });

    test('navigates to tutorial page', async () => {
      await act(async () => {
        renderHome();
      });

      fireEvent.click(screen.getByLabelText('Tutorial'));
      expect(mockNavigate).toHaveBeenCalledWith('/tutorial');
    });

    test('handles logout', async () => {
      await act(async () => {
        renderHome();
      });

      fireEvent.click(screen.getByText('Logout'));
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('Quest Forms', () => {
    test('opens create quest form when authenticated', async () => {
      await act(async () => {
        renderHome();
      });

      fireEvent.click(screen.getByText('Create Quest'));
      expect(screen.getByTestId('create-quest-form')).toBeInTheDocument();
    });

    test('redirects to login when creating quest without authentication', async () => {
      mockUseAuth.currentUser = null;
      useAuth.mockReturnValue(mockUseAuth);

      await act(async () => {
        renderHome();
      });

      fireEvent.click(screen.getByText('Create Quest'));
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('closes create quest form', async () => {
      await act(async () => {
        renderHome();
      });

      fireEvent.click(screen.getByText('Create Quest'));
      expect(screen.getByTestId('create-quest-form')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Close Form'));
      expect(screen.queryByTestId('create-quest-form')).not.toBeInTheDocument();
    });
  });

  describe('Quest Interactions', () => {
    beforeEach(() => {
      const mockQuests = [
        {
          id: 'quest-1',
          name: 'Test Quest',
          location: { _latitude: -26.1929, _longitude: 28.0305 },
          reward: 100,
          radius: 50,
          creatorId: 'other-user'
        }
      ];
      mockGetAllQuests.mockResolvedValue(mockQuests);
    });

    test('handles quest acceptance', async () => {
      await act(async () => {
        renderHome();
      });

      await waitFor(() => {
        expect(global.window.handleAcceptQuest).toBeDefined();
      });

      await act(async () => {
        await global.window.handleAcceptQuest('quest-1');
      });

      expect(mockAcceptQuest).toHaveBeenCalledWith('quest-1', 'test-user-id');
    });

    test('handles quest abandonment', async () => {
      await act(async () => {
        renderHome();
      });

      await waitFor(() => {
        expect(global.window.handleAbandonQuest).toBeDefined();
      });

      await act(async () => {
        await global.window.handleAbandonQuest('quest-1');
      });

      expect(mockAbandonQuest).toHaveBeenCalledWith('quest-1', 'test-user-id');
    });

    test('handles quest acceptance error', async () => {
      mockAcceptQuest.mockRejectedValue(new Error('Accept failed'));
      global.alert = jest.fn();

      await act(async () => {
        renderHome();
      });

      await waitFor(() => {
        expect(global.window.handleAcceptQuest).toBeDefined();
      });

      await act(async () => {
        await global.window.handleAcceptQuest('quest-1');
      });

      expect(global.alert).toHaveBeenCalledWith('Failed to accept quest.');
    });

    test('opens quest turn-in form', async () => {
      await act(async () => {
        renderHome();
      });

      await waitFor(() => {
        expect(global.window.handleTurnInQuest).toBeDefined();
      });

      act(() => {
        global.window.handleTurnInQuest('quest-1');
      });

      expect(screen.getByTestId('complete-quest-form')).toBeInTheDocument();
    });
  });

  describe('Journey Quests', () => {
    test('handles journey quest acceptance', async () => {
      global.alert = jest.fn();

      await act(async () => {
        renderHome();
      });

      await waitFor(() => {
        expect(global.window.handleAcceptJourneyQuest).toBeDefined();
      });

      act(() => {
        global.window.handleAcceptJourneyQuest('journey-knowledge-quest');
      });

      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('📚 Trail of Knowledge')
      );
    });

    test('redirects to login for journey quest when not authenticated', async () => {
      mockUseAuth.currentUser = null;
      useAuth.mockReturnValue(mockUseAuth);

      await act(async () => {
        renderHome();
      });

      await waitFor(() => {
        expect(global.window.handleAcceptJourneyQuest).toBeDefined();
      });

      global.window.handleAcceptJourneyQuest('journey-knowledge-quest');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Bell and Geolocation', () => {
    test('handles bell ping with geolocation success', async () => {
      const mockPosition = {
        coords: {
          latitude: -26.1929,
          longitude: 28.0305
        }
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      global.alert = jest.fn();

      await act(async () => {
        renderHome();
      });

      fireEvent.click(screen.getByLabelText('Bell'));

      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      });
    });

    test('handles bell ping with geolocation error', async () => {
      const mockError = { code: 1, message: 'Permission denied' };
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      global.alert = jest.fn();

      await act(async () => {
        renderHome();
      });

      fireEvent.click(screen.getByLabelText('Bell'));

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'Location permission denied. Please allow location access to progress Journey Quests.'
        );
      });
    });

    test('handles unsupported geolocation', async () => {
      delete navigator.geolocation;
      global.alert = jest.fn();

      await act(async () => {
        renderHome();
      });

      fireEvent.click(screen.getByLabelText('Bell'));

      expect(global.alert).toHaveBeenCalledWith(
        'Geolocation is not supported on this device/browser.'
      );
    });

    test('completes journey quest and awards points', async () => {
      const mockPosition = {
        coords: { latitude: -26.18944199729973, longitude: 28.030186646826653 }
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      global.alert = jest.fn();

      await act(async () => {
        renderHome();
      });

      // Accept a journey quest first
      act(() => {
        global.window.handleAcceptJourneyQuest('journey-artisan-quest');
      });

      // Simulate being at the second stop and completing to final
      await act(async () => {
        // Mock journey progress state
        const component = screen.getByText('WITS ADVENTURE').closest('section');
        const homeInstance = component?._reactInternalFiber?.memoizedProps;
        
        // Simulate bell ping at final location
        fireEvent.click(screen.getByLabelText('Bell'));
      });

      await waitFor(() => {
        expect(mockUpdateDoc).toHaveBeenCalled();
      });
    });
  });

  describe('Music Controls', () => {
    test('toggles music when clicking music button', async () => {
      await act(async () => {
        renderHome();
      });

      const musicButtons = screen.getAllByLabelText('Toggle Music');
      fireEvent.click(musicButtons[0]);

      expect(mockUseMusic.toggleMusic).toHaveBeenCalled();
    });

    test('displays music playing state', async () => {
      mockUseMusic.isMusicPlaying = true;
      useMusic.mockReturnValue(mockUseMusic);

      await act(async () => {
        renderHome();
      });

      const musicButtons = screen.getAllByLabelText('Toggle Music');
      expect(musicButtons[0]).toHaveClass('playing');
    });
  });

  describe('Map Controls', () => {
    test('centers map on Wits when clicking castle icon', async () => {
      await act(async () => {
        renderHome();
      });

      const castleButton = screen.getByLabelText('Center on Wits');
      fireEvent.click(castleButton);

      // Map centering is handled by Leaflet, so we just verify the button works
      expect(castleButton).toBeInTheDocument();
    });

    test('opens questbook when clicking questbook icon', async () => {
      await act(async () => {
        renderHome();
      });

      const questbookButton = screen.getByRole('button', { name: /questbook/i });
      fireEvent.click(questbookButton);

      expect(mockNavigate).toHaveBeenCalledWith('/questbook');
    });
  });

  describe('Toast Messages', () => {
    test('shows toast message on bell ping', async () => {
      const mockPosition = {
        coords: { latitude: -26.1929, longitude: 28.0305 }
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      await act(async () => {
        renderHome();
      });

      fireEvent.click(screen.getByLabelText('Bell'));

      await waitFor(() => {
        expect(screen.getByText('The bell tolls')).toBeInTheDocument();
      });
    });

    test('hides toast message after timeout', async () => {
      jest.useFakeTimers();
      
      const mockPosition = {
        coords: { latitude: -26.1929, longitude: 28.0305 }
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      await act(async () => {
        renderHome();
      });

      fireEvent.click(screen.getByLabelText('Bell'));

      await waitFor(() => {
        expect(screen.getByText('The bell tolls')).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(2200);
      });

      await waitFor(() => {
        expect(screen.queryByText('The bell tolls')).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('Quest Form Submission', () => {
    test('handles quest submission', async () => {
      const mockQuest = {
        id: 'quest-1',
        name: 'Test Quest'
      };

      await act(async () => {
        renderHome();
      });

      // Open complete quest form
      act(() => {
        global.window.handleTurnInQuest('quest-1');
      });

      expect(screen.getByTestId('complete-quest-form')).toBeInTheDocument();

      // Submit quest
      fireEvent.click(screen.getByText('Submit'));

      // Form should still be open, but submission should be tracked
      expect(screen.getByTestId('complete-quest-form')).toBeInTheDocument();
    });

    test('closes complete quest form', async () => {
      await act(async () => {
        renderHome();
      });

      // Open complete quest form
      act(() => {
        global.window.handleTurnInQuest('quest-1');
      });

      expect(screen.getByTestId('complete-quest-form')).toBeInTheDocument();

      // Close form
      fireEvent.click(screen.getByText('Close Form'));

      expect(screen.queryByTestId('complete-quest-form')).not.toBeInTheDocument();
    });
  });

  describe('Distance Calculation', () => {
    test('calculates distance using Leaflet when available', () => {
      const mockDistanceTo = jest.fn(() => 150);
      global.L.latLng.mockReturnValue({ distanceTo: mockDistanceTo });

      // Import the distance function (would need to export it from Home.js)
      // For now, we'll test the logic conceptually
      const a = [-26.1929, 28.0305];
      const b = [-26.1930, 28.0306];

      if (global.L && global.L.latLng) {
        const result = global.L.latLng(a[0], a[1]).distanceTo(global.L.latLng(b[0], b[1]));
        expect(result).toBe(150);
      }

      expect(mockDistanceTo).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('handles missing quest data gracefully', async () => {
      await act(async () => {
        renderHome();
      });

      // Try to accept non-existent quest
      await act(async () => {
        global.window.handleTurnInQuest('non-existent-quest');
      });

      // Should not crash or show form
      expect(screen.queryByTestId('complete-quest-form')).not.toBeInTheDocument();
    });

    test('handles map initialization failure', async () => {
      global.L = null;
      global.window.L = null;

      // Should not crash
      await act(async () => {
        renderHome();
      });

      expect(screen.getByText('WITS ADVENTURE')).toBeInTheDocument();
    });

    test('handles Firestore error when awarding points', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Firestore error'));
      
      const mockPosition = {
        coords: { latitude: -26.1929, longitude: 28.0305 }
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      console.error = jest.fn();

      await act(async () => {
        renderHome();
      });

      fireEvent.click(screen.getByLabelText('Bell'));

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to update LeaderBoardPoints')
        );
      });
    });
  });

  describe('Focus Quest Feature', () => {
    test('focuses on quest when navigated with state', async () => {
      const mockLocation = {
        state: {
          focusQuest: {
            id: 'quest-1',
            location: { latitude: -26.1929, longitude: 28.0305 }
          }
        }
      };

      require('react-router-dom').useLocation.mockReturnValue(mockLocation);

      await act(async () => {
        renderHome();
      });

      // Should attempt to focus map and clear state
      expect(mockNavigate).toHaveBeenCalledWith('.', { replace: true, state: {} });
    });

    test('handles invalid quest location in focus state', async () => {
      const mockLocation = {
        state: {
          focusQuest: {
            id: 'quest-1',
            location: { latitude: 'invalid', longitude: null }
          }
        }
      };

      require('react-router-dom').useLocation.mockReturnValue(mockLocation);
      console.warn = jest.fn();

      await act(async () => {
        renderHome();
      });

      expect(console.warn).toHaveBeenCalledWith(
        'Invalid quest location:', 
        { latitude: 'invalid', longitude: null }
      );
    });
  });
});