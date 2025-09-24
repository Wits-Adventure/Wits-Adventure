// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  })
);

// Mock Firebase functions
jest.mock('../firebase/profile_functions');
jest.mock('../firebase/general_quest_functions');
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(),
  increment: jest.fn()
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock CSS and images
jest.mock('../css/ProfilePage.css', () => ({}));
jest.mock('../assets/profile.jpg', () => 'profile.jpg');
jest.mock('../assets/edit_icon.png', () => 'edit.png');

// Mock QuestManager
jest.mock('../react_components/QuestManager', () => {
  return function MockQuestManager({ isOpen, quest, onClose }) {
    return isOpen ? <div data-testid="quest-manager">Quest Manager</div> : null;
  };
});

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
  getAuth: jest.fn(() => ({})),
  createUserWithEmailAndPassword: jest.fn(),
  sendEmailVerification: jest.fn(),
  signInWithEmailAndPassword: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  increment: jest.fn()
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn()
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from '../react_components/ProfilePage';
import { getProfileData, updateProfileData } from '../firebase/profile_functions';
import { getAllQuests } from '../firebase/general_quest_functions';


describe('ProfilePage', () => {
  const mockUser = {
    uid: 'test123',
    Name: 'John Doe',
    Bio: 'Test bio',
    LeaderBoardPoints: 100,
    CompletedQuests: ['quest1', 'quest2'],
    acceptedQuests: ['quest3'],
    Level: 5,
    Experience: 250,
    SpendablePoints: 50,
    profilePicture: 'test.jpg'
  };

  const mockQuests = [
    {
      id: 'quest1',
      name: 'Test Quest',
      creatorId: 'test123',
      emoji: '🗺️',
      color: 'hsl(0 80% 40%)',
      location: { _latitude: -26.1935, _longitude: 28.0298 }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    getProfileData.mockResolvedValue(mockUser);
    getAllQuests.mockResolvedValue(mockQuests);
  });

  const renderProfilePage = () => {
    return render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );
  };

  test('renders loading state initially', () => {
    renderProfilePage();
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

  test('displays user profile data', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Test bio')).toBeInTheDocument();
      expect(screen.getByText('250')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  test('displays created quests', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('Test Quest')).toBeInTheDocument();
      expect(screen.getByText('🗺️')).toBeInTheDocument();
    });
  });

  test('opens edit modal when edit button clicked', async () => {
    renderProfilePage();

    await waitFor(() => {
      fireEvent.click(screen.getByAltText('Edit profile'));
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });
  });

  test('handles profile edit and save', async () => {
    updateProfileData.mockResolvedValue();
    renderProfilePage();

    await waitFor(() => {
      fireEvent.click(screen.getByAltText('Edit profile'));
    });

    fireEvent.change(screen.getByDisplayValue('John Doe'), {
      target: { value: 'Jane Doe' }
    });
    fireEvent.change(screen.getByDisplayValue('Test bio'), {
      target: { value: 'Updated bio' }
    });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(updateProfileData).toHaveBeenCalledWith({
        uid: 'test123',
        Name: 'Jane Doe',
        Bio: 'Updated bio',
        ProfilePictureUrl: 'test.jpg'
      });
    });
  });

  test('handles edit cancel', async () => {
    renderProfilePage();

    await waitFor(() => {
      fireEvent.click(screen.getByAltText('Edit profile'));
    });

    fireEvent.change(screen.getByDisplayValue('John Doe'), {
      target: { value: 'Changed Name' }
    });

    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
  });

  test('handles profile picture change', async () => {
    renderProfilePage();

    await waitFor(() => {
      fireEvent.click(screen.getByAltText('Edit profile'));
    });

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button', { name: /select or drop profile image/i });
    
    Object.defineProperty(input.querySelector('input'), 'files', {
      value: [file],
      writable: false
    });

    fireEvent.change(input.querySelector('input'));
  });

  test('handles remove profile image', async () => {
    renderProfilePage();

    await waitFor(() => {
      fireEvent.click(screen.getByAltText('Edit profile'));
    });

    fireEvent.click(screen.getByText('Remove'));
    
    // Should reset to default image
    expect(screen.getByAltText('Profile preview')).toHaveAttribute('src', '/default.jpg');
  });

  test('opens quest manager when quest clicked', async () => {
    renderProfilePage();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Test Quest'));
      expect(screen.getByTestId('quest-manager')).toBeInTheDocument();
    });
  });

  test('handles back home navigation', async () => {
    renderProfilePage();

    await waitFor(() => {
      fireEvent.click(screen.getByLabelText('Back to home'));
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('handles profile data fetch error', async () => {
    getProfileData.mockRejectedValue(new Error('Failed to fetch'));
    console.error = jest.fn();

    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText(/Error:.*Please try again later/)).toBeInTheDocument();
    });
  });

  test('handles update profile error', async () => {
    updateProfileData.mockRejectedValue(new Error('Update failed'));
    window.alert = jest.fn();

    renderProfilePage();

    await waitFor(() => {
      fireEvent.click(screen.getByAltText('Edit profile'));
    });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to update profile. Please try again.');
    });
  });

  test('displays placeholder when no quests created', async () => {
    getAllQuests.mockResolvedValue([]);
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText("You haven't created any quests yet.")).toBeInTheDocument();
    });
  });

  test('handles drag and drop for profile picture', async () => {
    renderProfilePage();

    await waitFor(() => {
      fireEvent.click(screen.getByAltText('Edit profile'));
    });

    const dropArea = screen.getByRole('button', { name: /select or drop profile image/i });
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    fireEvent.dragOver(dropArea);
    fireEvent.drop(dropArea, {
      dataTransfer: { files: [file] }
    });
  });
});