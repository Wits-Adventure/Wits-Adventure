// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  })
);

// Mock Firebase modules BEFORE imports
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({}))
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
  getAuth: jest.fn(() => ({}))
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  increment: jest.fn()
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({}))
}));

// Mock geolocation
global.navigator.geolocation = {
  getCurrentPosition: jest.fn()
};

// Mock Leaflet
const mockMapInstance = {
  setView: jest.fn().mockReturnThis(),
  remove: jest.fn(),
  invalidateSize: jest.fn(),
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  eachLayer: jest.fn()
};

global.L = {
  map: jest.fn(() => mockMapInstance),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn()
  })),
  marker: jest.fn(() => ({
    addTo: jest.fn().mockReturnThis(),
    bindPopup: jest.fn().mockReturnThis(),
    openPopup: jest.fn(),
    on: jest.fn()
  })),
  circle: jest.fn(() => ({
    addTo: jest.fn().mockReturnThis(),
    bindPopup: jest.fn().mockReturnThis(),
    setRadius: jest.fn(),
    setStyle: jest.fn(),
    openPopup: jest.fn(),
    getPopup: jest.fn(() => ({ getContent: jest.fn() })),
    on: jest.fn()
  })),
  control: {
    zoom: jest.fn(() => ({
      addTo: jest.fn()
    }))
  },
  divIcon: jest.fn(),
  latLng: jest.fn((lat, lng) => ({ distanceTo: jest.fn(() => 10) }))
};

// Ensure window.L is also available
global.window = global.window || {};
global.window.L = global.L;

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../react_components/Home';
import { useAuth } from '../context/AuthContext';
import { getUserData, logout } from '../firebase/firebase';
import { getAllQuests, acceptQuest, abandonQuest } from '../firebase/general_quest_functions';
import { getProfileData } from '../firebase/profile_functions';

// Mock all the imports
jest.mock('../context/AuthContext');
jest.mock('../context/MusicContext', () => ({
  useMusic: () => ({ isMusicPlaying: false, toggleMusic: jest.fn() })
}));
jest.mock('../firebase/firebase');
jest.mock('../firebase/general_quest_functions');
jest.mock('../firebase/profile_functions');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: {} })
}));

// Mock CSS and images
jest.mock('../css/Home.css', () => ({}));
jest.mock('../media/LOGO_Alpha.png', () => 'logo.png');
jest.mock('../media/questbook_outline.png', () => 'questbook.png');
jest.mock('../assets/profile.jpg', () => 'profile.jpg');
jest.mock('../media/bell.png', () => 'bell.png');
jest.mock('../media/music.png', () => 'music.png');
jest.mock('../media/tutorial.png', () => 'tutorial.png');
jest.mock('../media/castle.png', () => 'castle.png');

// Mock components
jest.mock('../react_components/CreateQuestForm', () => {
  return function MockCreateQuestForm({ isOpen }) {
    return isOpen ? <div data-testid="create-quest-form">Create Quest Form</div> : null;
  };
});
jest.mock('../react_components/CompleteQuestForm', () => {
  return function MockCompleteQuestForm({ isOpen }) {
    return isOpen ? <div data-testid="complete-quest-form">Complete Quest Form</div> : null;
  };
});

describe('Home Component', () => {
  const mockUser = {
    uid: 'testuid123',
    email: 'test@example.com'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    useAuth.mockReturnValue({ currentUser: null });
    getUserData.mockResolvedValue({ Name: 'Test User' });
    getProfileData.mockResolvedValue({ Name: 'Test User', profilePicture: 'test.jpg' });
    getAllQuests.mockResolvedValue([]);
    global.navigator.geolocation.getCurrentPosition.mockClear();
  });

  const renderHome = () => {
    return render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
  };

  test('renders without crashing', () => {
    renderHome();
    expect(screen.getByText('WITS ADVENTURE')).toBeInTheDocument();
  });

  test('shows login and signup buttons when not authenticated', () => {
    renderHome();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });

  test('shows user profile when authenticated', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    renderHome();

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  test('handles create quest button click when not logged in', () => {
    renderHome();
    fireEvent.click(screen.getByText('Create Quest'));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('handles create quest button click when logged in', () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    renderHome();
    fireEvent.click(screen.getByText('Create Quest'));
    // Should open form instead of navigating
  });

  test('handles bell click with geolocation', async () => {
    global.navigator.geolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: { latitude: -26.1929, longitude: 28.0305, accuracy: 10 }
      });
    });

    renderHome();
    fireEvent.click(screen.getByAltText('Bell'));
    
    expect(global.navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
  });

  test('handles bell click without geolocation', () => {
    const originalGeolocation = global.navigator.geolocation;
    delete global.navigator.geolocation;
    renderHome();
    fireEvent.click(screen.getByAltText('Bell'));
    global.navigator.geolocation = originalGeolocation;
  });

  test('handles navigation buttons', () => {
    renderHome();
    
    fireEvent.click(screen.getByAltText('Questbook'));
    expect(mockNavigate).toHaveBeenCalledWith('/questbook');
    
    fireEvent.click(screen.getByAltText('Tutorial'));
    expect(mockNavigate).toHaveBeenCalledWith('/tutorial');
  });

  test('handles profile click when authenticated', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    renderHome();

    await waitFor(() => {
      const profileSection = screen.getByText('Test User').closest('section');
      fireEvent.click(profileSection);
      expect(mockNavigate).toHaveBeenCalledWith('/ProfilePage');
    });
  });

  test('handles logout', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    renderHome();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Logout'));
      expect(logout).toHaveBeenCalled();
    });
  });

  test('handles quest data loading', async () => {
    const mockQuests = [{
      id: 'quest1',
      name: 'Test Quest',
      location: { _latitude: -26.1935, _longitude: 28.0298 },
      radius: 50
    }];
    getAllQuests.mockResolvedValue(mockQuests);
    
    renderHome();
    
    await waitFor(() => {
      expect(getAllQuests).toHaveBeenCalled();
    });
  });

  test('handles profile data fetch error', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    getProfileData.mockRejectedValue(new Error('Failed to fetch'));
    console.error = jest.fn();

    renderHome();

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
  });

  test('handles bell cooldown', async () => {
    global.navigator.geolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: { latitude: -26.1929, longitude: 28.0305, accuracy: 10 }
      });
    });

    renderHome();
    const bellButton = screen.getByAltText('Bell');
    
    // First click
    fireEvent.click(bellButton);
    // Second click should be on cooldown
    fireEvent.click(bellButton);
    
    expect(global.navigator.geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  test('handles journey quest acceptance', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    renderHome();
    
    // Simulate journey quest acceptance
    await waitFor(() => {
      if (window.handleAcceptJourneyQuest) {
        window.handleAcceptJourneyQuest('journey-knowledge-quest');
      }
    });
  });

  test('handles journey quest abandonment', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    renderHome();
    
    await waitFor(() => {
      if (window.handleAbandonJourneyQuest) {
        window.handleAbandonJourneyQuest('journey-knowledge-quest');
      }
    });
  });

  test('handles turn in quest', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    const mockQuests = [{
      id: 'quest1',
      name: 'Test Quest',
      location: { _latitude: -26.1935, _longitude: 28.0298 }
    }];
    getAllQuests.mockResolvedValue(mockQuests);
    
    renderHome();
    
    await waitFor(() => {
      if (window.handleTurnInQuest) {
        window.handleTurnInQuest('quest1');
      }
    });
  });

  test('handles geolocation error', async () => {
    global.navigator.geolocation.getCurrentPosition.mockImplementation((success, error) => {
      error({ code: 1, message: 'Permission denied' });
    });

    renderHome();
    fireEvent.click(screen.getByAltText('Bell'));
    
    expect(global.navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
  });

  test('handles low GPS accuracy', async () => {
    global.navigator.geolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: { latitude: -26.1929, longitude: 28.0305, accuracy: 50 }
      });
    });

    renderHome();
    fireEvent.click(screen.getByAltText('Bell'));
    
    expect(global.navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
  });

  test('handles castle icon click', () => {
    renderHome();
    const castleButton = screen.getByAltText('Center on Wits');
    fireEvent.click(castleButton);
    
    expect(mockMapInstance.setView).toHaveBeenCalledWith([-26.1929, 28.0305], 17, { animate: true });
  });

  test('handles music toggle', () => {
    const mockToggleMusic = jest.fn();
    require('../context/MusicContext').useMusic.mockReturnValue({
      isMusicPlaying: false,
      toggleMusic: mockToggleMusic
    });
    
    renderHome();
    const musicButtons = screen.getAllByAltText('Music');
    fireEvent.click(musicButtons[0]);
    
    expect(mockToggleMusic).toHaveBeenCalled();
  });

  test('handles quest accept/abandon with authentication', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    const mockQuests = [{
      id: 'quest1',
      name: 'Test Quest',
      location: { _latitude: -26.1935, _longitude: 28.0298 },
      creatorId: 'other-user'
    }];
    getAllQuests.mockResolvedValue(mockQuests);
    
    renderHome();
    
    await waitFor(() => {
      if (window.handleAcceptQuest) {
        window.handleAcceptQuest('quest1');
        expect(acceptQuest).toHaveBeenCalledWith('quest1', mockUser.uid);
      }
    });
  });

  test('handles quest accept error', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    acceptQuest.mockRejectedValue(new Error('Failed to accept'));
    console.error = jest.fn();
    
    renderHome();
    
    await waitFor(() => {
      if (window.handleAcceptQuest) {
        window.handleAcceptQuest('quest1');
      }
    });
  });

  test('handles quest abandon error', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    abandonQuest.mockRejectedValue(new Error('Failed to abandon'));
    console.error = jest.fn();
    
    renderHome();
    
    await waitFor(() => {
      if (window.handleAbandonQuest) {
        window.handleAbandonQuest('quest1');
      }
    });
  });

  test('handles create quest form open/close', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    renderHome();
    
    fireEvent.click(screen.getByText('Create Quest'));
    await waitFor(() => {
      expect(screen.queryByTestId('create-quest-form')).toBeInTheDocument();
    });
  });

  test('handles complete quest form', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    const mockQuests = [{
      id: 'quest1',
      name: 'Test Quest',
      location: { _latitude: -26.1935, _longitude: 28.0298 }
    }];
    getAllQuests.mockResolvedValue(mockQuests);
    
    renderHome();
    
    await waitFor(() => {
      if (window.handleTurnInQuest) {
        window.handleTurnInQuest('quest1');
      }
    });
  });

  test('handles journey quest with geolocation match', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    global.navigator.geolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: { latitude: -26.1905275569984, longitude: 28.02991870656233, accuracy: 10 }
      });
    });

    renderHome();
    
    // Accept journey quest first
    await waitFor(() => {
      if (window.handleAcceptJourneyQuest) {
        window.handleAcceptJourneyQuest('journey-knowledge-quest');
      }
    });
    
    // Then trigger bell at matching location
    fireEvent.click(screen.getByAltText('Bell'));
    
    expect(global.navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
  });

  test('handles username fetch error', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    getUserData.mockRejectedValue(new Error('Failed to fetch username'));
    console.error = jest.fn();

    renderHome();

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
  });

  test('handles quest with no location', async () => {
    const mockQuests = [{
      id: 'quest1',
      name: 'Test Quest',
      location: null
    }];
    getAllQuests.mockResolvedValue(mockQuests);
    
    renderHome();
    
    await waitFor(() => {
      expect(getAllQuests).toHaveBeenCalled();
    });
  });

  test('handles map initialization error', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    global.L.map.mockImplementation(() => { throw new Error('Map error'); });
    renderHome();
    consoleSpy.mockRestore();
  });

  test('handles quest with image and description', async () => {
    const mockQuests = [{
      id: 'quest1',
      name: 'Test Quest',
      location: { _latitude: -26.1935, _longitude: 28.0298 },
      imageUrl: 'test.jpg',
      description: 'Test description'
    }];
    getAllQuests.mockResolvedValue(mockQuests);
    renderHome();
    await waitFor(() => expect(getAllQuests).toHaveBeenCalled());
  });

  test('handles own quest display', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    const mockQuests = [{ id: 'quest1', name: 'Test Quest', location: { _latitude: -26.1935, _longitude: 28.0298 }, creatorId: mockUser.uid }];
    getAllQuests.mockResolvedValue(mockQuests);
    renderHome();
    await waitFor(() => expect(getAllQuests).toHaveBeenCalled());
  });

  test('handles journey quest completion', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    global.navigator.geolocation.getCurrentPosition.mockImplementation((success) => {
      success({ coords: { latitude: -26.1895187018387, longitude: 28.029333555477365, accuracy: 10 } });
    });
    renderHome();
    await waitFor(() => {
      if (window.handleAcceptJourneyQuest) {
        window.handleAcceptJourneyQuest('journey-knowledge-quest');
      }
    });
    fireEvent.click(screen.getByAltText('Bell'));
  });

  test('handles bell pulse animation', async () => {
    global.navigator.geolocation.getCurrentPosition.mockImplementation((success) => {
      success({ coords: { latitude: -26.1929, longitude: 28.0305, accuracy: 10 } });
    });
    const mockCircle = { setRadius: jest.fn(), setStyle: jest.fn() };
    global.L.circle.mockReturnValue(mockCircle);
    global.requestAnimationFrame = jest.fn(cb => cb());
    renderHome();
    fireEvent.click(screen.getByAltText('Bell'));
  });

  test('handles quest marker click events', async () => {
    const mockQuests = [{
      id: 'quest1',
      name: 'Test Quest',
      location: { _latitude: -26.1935, _longitude: 28.0298 },
      creatorId: 'other-user'
    }];
    getAllQuests.mockResolvedValue(mockQuests);
    const mockMarker = { on: jest.fn(), addTo: jest.fn().mockReturnThis(), bindPopup: jest.fn().mockReturnThis() };
    global.L.marker.mockReturnValue(mockMarker);
    renderHome();
    await waitFor(() => expect(getAllQuests).toHaveBeenCalled());
    expect(mockMarker.on).toHaveBeenCalledWith('click', expect.any(Function));
  });

  test('handles quest popup content generation', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    const mockQuests = [{
      id: 'quest1',
      name: 'Test Quest',
      description: 'Test description',
      location: { _latitude: -26.1935, _longitude: 28.0298 },
      creatorId: 'other-user',
      imageUrl: 'test.jpg'
    }];
    getAllQuests.mockResolvedValue(mockQuests);
    renderHome();
    await waitFor(() => expect(getAllQuests).toHaveBeenCalled());
  });

  test('handles quest without description or image', async () => {
    const mockQuests = [{
      id: 'quest1',
      name: 'Test Quest',
      location: { _latitude: -26.1935, _longitude: 28.0298 },
      creatorId: 'other-user'
    }];
    getAllQuests.mockResolvedValue(mockQuests);
    renderHome();
    await waitFor(() => expect(getAllQuests).toHaveBeenCalled());
  });

  test('handles journey quest location matching', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    global.navigator.geolocation.getCurrentPosition.mockImplementation((success) => {
      success({ coords: { latitude: -26.1905275569984, longitude: 28.02991870656233, accuracy: 5 } });
    });
    renderHome();
    await waitFor(() => {
      if (window.handleAcceptJourneyQuest) {
        window.handleAcceptJourneyQuest('journey-knowledge-quest');
      }
    });
    fireEvent.click(screen.getByAltText('Bell'));
  });

  test('handles journey quest different locations', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    global.navigator.geolocation.getCurrentPosition.mockImplementation((success) => {
      success({ coords: { latitude: -26.1895187018387, longitude: 28.029333555477365, accuracy: 5 } });
    });
    renderHome();
    await waitFor(() => {
      if (window.handleAcceptJourneyQuest) {
        window.handleAcceptJourneyQuest('journey-knowledge-quest');
      }
    });
    fireEvent.click(screen.getByAltText('Bell'));
  });

  test('handles quest acceptance without authentication', async () => {
    useAuth.mockReturnValue({ currentUser: null });
    renderHome();
    await waitFor(() => {
      if (window.handleAcceptQuest) {
        window.handleAcceptQuest('quest1');
      }
    });
  });

  test('handles quest abandonment without authentication', async () => {
    useAuth.mockReturnValue({ currentUser: null });
    renderHome();
    await waitFor(() => {
      if (window.handleAbandonQuest) {
        window.handleAbandonQuest('quest1');
      }
    });
  });

  test('handles turn in quest without authentication', async () => {
    useAuth.mockReturnValue({ currentUser: null });
    renderHome();
    await waitFor(() => {
      if (window.handleTurnInQuest) {
        window.handleTurnInQuest('quest1');
      }
    });
  });

  test('handles journey quest without authentication', async () => {
    useAuth.mockReturnValue({ currentUser: null });
    renderHome();
    await waitFor(() => {
      if (window.handleAcceptJourneyQuest) {
        window.handleAcceptJourneyQuest('journey-knowledge-quest');
      }
    });
  });

  test('handles map cleanup on unmount', () => {
    const { unmount } = renderHome();
    unmount();
    expect(mockMapInstance.remove).toHaveBeenCalled();
  });

  test('handles quest data fetch error', async () => {
    getAllQuests.mockRejectedValue(new Error('Failed to fetch quests'));
    console.error = jest.fn();
    renderHome();
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
  });

  test('handles bell click with high accuracy GPS', async () => {
    global.navigator.geolocation.getCurrentPosition.mockImplementation((success) => {
      success({ coords: { latitude: -26.1929, longitude: 28.0305, accuracy: 5 } });
    });
    renderHome();
    fireEvent.click(screen.getByAltText('Bell'));
  });

  test('handles quest marker popup with all content', async () => {
    const mockQuests = [{
      id: 'quest1',
      name: 'Test Quest',
      description: 'A detailed description',
      location: { _latitude: -26.1935, _longitude: 28.0298 },
      creatorId: 'other-user',
      imageUrl: 'https://example.com/image.jpg'
    }];
    getAllQuests.mockResolvedValue(mockQuests);
    renderHome();
    await waitFor(() => expect(getAllQuests).toHaveBeenCalled());
  });

  test('handles profile picture display', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    getProfileData.mockResolvedValue({ Name: 'Test User', profilePicture: 'custom.jpg' });
    renderHome();
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  test('handles default profile picture', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    getProfileData.mockResolvedValue({ Name: 'Test User', profilePicture: null });
    renderHome();
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });
});
  test('handles tutorial hint close', () => {
    renderHome();
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    expect(screen.queryByText('×')).not.toBeInTheDocument();
  });

  test('handles quest creation success callback', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    renderHome();
    
    await waitFor(() => {
      if (window.handleQuestCreated) {
        window.handleQuestCreated();
      }
    });
  });

  test('handles quest completion success callback', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    renderHome();
    
    await waitFor(() => {
      if (window.handleQuestCompleted) {
        window.handleQuestCompleted();
      }
    });
  });

  test('handles map click during quest placement', () => {
    global.window.__questPlacing = true;
    renderHome();
    
    // Simulate map click event
    const mapContainer = document.querySelector('.home-container');
    if (mapContainer) {
      fireEvent.click(mapContainer);
    }
    
    global.window.__questPlacing = false;
  });

  test('handles quest with missing emoji', async () => {
    const mockQuests = [{
      id: 'quest1',
      name: 'Test Quest',
      location: { _latitude: -26.1935, _longitude: 28.0298 },
      creatorId: 'other-user'
    }];
    getAllQuests.mockResolvedValue(mockQuests);
    renderHome();
    await waitFor(() => expect(getAllQuests).toHaveBeenCalled());
  });

  test('handles quest with submissions', async () => {
    const mockQuests = [{
      id: 'quest1',
      name: 'Test Quest',
      location: { _latitude: -26.1935, _longitude: 28.0298 },
      creatorId: 'other-user',
      submissions: [{ userId: 'other-user' }]
    }];
    getAllQuests.mockResolvedValue(mockQuests);
    renderHome();
    await waitFor(() => expect(getAllQuests).toHaveBeenCalled());
  });

  test('handles journey quest riddle display edge cases', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    renderHome();
    
    await waitFor(() => {
      if (window.handleAcceptJourneyQuest) {
        window.handleAcceptJourneyQuest('journey-knowledge-quest');
      }
    });
  });

  test('handles bell pulse circle cleanup', async () => {
    global.navigator.geolocation.getCurrentPosition.mockImplementation((success) => {
      success({ coords: { latitude: -26.1929, longitude: 28.0305, accuracy: 10 } });
    });
    
    const mockCircle = { 
      setRadius: jest.fn(), 
      setStyle: jest.fn(),
      remove: jest.fn()
    };
    global.L.circle.mockReturnValue(mockCircle);
    global.window.__bellPulseCircle = mockCircle;
    
    renderHome();
    fireEvent.click(screen.getByAltText('Bell'));
    
    // Simulate animation completion
    global.requestAnimationFrame = jest.fn(cb => {
      for (let i = 0; i < 81; i++) cb();
    });
  });

  test('handles geolocation timeout error', async () => {
    global.navigator.geolocation.getCurrentPosition.mockImplementation((success, error) => {
      error({ code: 3, message: 'Timeout' });
    });

    renderHome();
    fireEvent.click(screen.getByAltText('Bell'));
    
    expect(global.navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
  });

  test('handles journey quest distance calculation fallback', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    global.navigator.geolocation.getCurrentPosition.mockImplementation((success) => {
      success({ coords: { latitude: -26.1905275569984, longitude: 28.02991870656233, accuracy: 10 } });
    });
    
    // Mock L.latLng to throw error, forcing fallback calculation
    global.L.latLng.mockImplementation(() => {
      throw new Error('Leaflet error');
    });
    
    renderHome();
    
    await waitFor(() => {
      if (window.handleAcceptJourneyQuest) {
        window.handleAcceptJourneyQuest('journey-knowledge-quest');
      }
    });
    
    fireEvent.click(screen.getByAltText('Bell'));
  });

  test('handles quest popup button updates', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    const mockQuests = [{
      id: 'quest1',
      name: 'Test Quest',
      location: { _latitude: -26.1935, _longitude: 28.0298 },
      creatorId: 'other-user'
    }];
    getAllQuests.mockResolvedValue(mockQuests);
    
    // Mock DOM elements
    const mockButton = { 
      textContent: 'Accept Quest',
      className: 'quest-popup-btn quest-accept-btn',
      onclick: null
    };
    document.getElementById = jest.fn(() => mockButton);
    
    renderHome();
    
    await waitFor(() => {
      if (window.handleAcceptQuest) {
        window.handleAcceptQuest('quest1');
      }
    });
  });

  test('handles component unmount cleanup', () => {
    const { unmount } = renderHome();
    unmount();
  });

  test('handles window resize events', () => {
    renderHome();
    fireEvent(window, new Event('resize'));
    fireEvent(window, new Event('orientationchange'));
  });

  test('handles leaflet availability check', () => {
    delete global.L;
    renderHome();
    
    // Simulate Leaflet becoming available
    global.L = {
      map: jest.fn(() => ({
        setView: jest.fn().mockReturnThis(),
        remove: jest.fn(),
        invalidateSize: jest.fn(),
        addLayer: jest.fn(),
        removeLayer: jest.fn(),
        eachLayer: jest.fn()
      })),
      tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
      marker: jest.fn(() => ({
        addTo: jest.fn().mockReturnThis(),
        bindPopup: jest.fn().mockReturnThis(),
        on: jest.fn()
      })),
      circle: jest.fn(() => ({
        addTo: jest.fn().mockReturnThis(),
        bindPopup: jest.fn().mockReturnThis(),
        on: jest.fn()
      })),
      control: { zoom: jest.fn(() => ({ addTo: jest.fn() })) },
      divIcon: jest.fn(),
      latLng: jest.fn(() => ({ distanceTo: jest.fn(() => 10) }))
    };
  });