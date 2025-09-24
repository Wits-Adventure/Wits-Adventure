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

// Mock CSS imports
jest.mock('../css/Home.css', () => ({}));

// Mock image imports
jest.mock('../media/LOGO_Alpha.png', () => 'logo.png');
jest.mock('../media/questbook_outline.png', () => 'questbook.png');
jest.mock('../assets/profile.jpg', () => 'profile.jpg');
jest.mock('../media/bell.png', () => 'bell.png');
jest.mock('../media/music.png', () => 'music.png');
jest.mock('../media/tutorial.png', () => 'tutorial.png');

// Mock CreateQuestForm and CompleteQuestForm
jest.mock('../react_components/CreateQuestForm', () => {
  return function MockCreateQuestForm({ isOpen, onClose }) {
    return isOpen ? <div data-testid="create-quest-form">Create Quest Form</div> : null;
  };
});
jest.mock('../react_components/CompleteQuestForm', () => {
  return function MockCompleteQuestForm({ isOpen, onClose }) {
    return isOpen ? <div data-testid="complete-quest-form">Complete Quest Form</div> : null;
  };
});

// Mock Leaflet
global.L = {
  map: jest.fn(() => ({
    setView: jest.fn().mockReturnThis(),
    remove: jest.fn(),
    invalidateSize: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn()
  })),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn()
  })),
  marker: jest.fn(() => ({
    addTo: jest.fn().mockReturnThis(),
    bindPopup: jest.fn().mockReturnThis(),
    openPopup: jest.fn()
  })),
  circle: jest.fn(() => ({
    addTo: jest.fn().mockReturnThis(),
    bindPopup: jest.fn().mockReturnThis(),
    setRadius: jest.fn(),
    setStyle: jest.fn()
  })),
  control: {
    zoom: jest.fn(() => ({
      addTo: jest.fn()
    }))
  },
  divIcon: jest.fn()
};



describe('Home Component', () => {
  const mockUser = {
    uid: 'testuid123',
    email: 'test@example.com'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    useAuth.mockReturnValue({ currentUser: null });
    getUserData.mockResolvedValue({ Name: 'Test User', Role: 'student' });
    getProfileData.mockResolvedValue({ Name: 'Test User', profilePicture: 'test.jpg' });
    getAllQuests.mockResolvedValue([]);
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

  test('shows login and signup buttons when user is not authenticated', () => {
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

  test('handles logout correctly', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    renderHome();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Logout'));
      expect(logout).toHaveBeenCalled();
    });
  });

  test('handles create quest button click', () => {
    renderHome();
    const createQuestBtn = screen.getByText('Create Quest');
    fireEvent.click(createQuestBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('shows questbook button', () => {
    renderHome();
    expect(screen.getByAltText('Questbook')).toBeInTheDocument();
  });

  test('shows bell icon and handles bell click', async () => {
    renderHome();
    const bellButton = screen.getByAltText('Bell');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(screen.getByText('The bell tolls')).toBeInTheDocument();
    });
  });

  test('handles quest acceptance', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    getAllQuests.mockResolvedValue([{
      id: 'quest1',
      name: 'Test Quest',
      location: { latitude: -26.1935, longitude: 28.0298 }
    }]);

    renderHome();
    
    // Wait for map to initialize and quests to load
    await waitFor(() => {
      window.handleAcceptQuest('quest1');
      expect(acceptQuest).toHaveBeenCalledWith('quest1', mockUser.uid);
    });
  });

  test('handles quest abandonment', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    getAllQuests.mockResolvedValue([{
      id: 'quest1',
      name: 'Test Quest',
      location: { latitude: -26.1935, longitude: 28.0298 }
    }]);

    renderHome();
    
    await waitFor(() => {
      window.handleAbandonQuest('quest1');
      expect(abandonQuest).toHaveBeenCalledWith('quest1', mockUser.uid);
    });
  });

  test('handles profile data fetch error', async () => {
    useAuth.mockReturnValue({ currentUser: mockUser });
    getProfileData.mockRejectedValue(new Error('Failed to fetch profile'));
    console.error = jest.fn();

    renderHome();

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
      expect(screen.getByText('User')).toBeInTheDocument();
    });
  });

  test('handles map initialization error', async () => {
    const originalMap = global.L.map;
    global.L.map = jest.fn(() => {
      throw new Error('Map initialization failed');
    });
    console.error = jest.fn();

    renderHome();

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Error initializing map:',
        expect.any(Error)
      );
    });
    
    global.L.map = originalMap;
  });
});