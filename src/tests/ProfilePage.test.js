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
jest.mock('../media/cardcustomization.png', () => 'cardcustomization.png');
jest.mock('../media/backgroundcustomization.png', () => 'backgroundcustomization.png');
jest.mock('../media/Borders1.png', () => 'border1.png');
jest.mock('../media/Borders2.png', () => 'border2.png');
jest.mock('../media/Borders3.png', () => 'border3.png');
jest.mock('../media/Borders4.png', () => 'border4.png');
jest.mock('../media/Borders5.png', () => 'border5.png');
jest.mock('../media/Borders6.png', () => 'border6.png');

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
    CompletedQuests: [{ creatorID: 'other' }, { creatorID: 'other' }],
    acceptedQuests: [{ creatorID: 'other' }],
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
    document.documentElement.style.setProperty = jest.fn();
    document.body.style = {};
    global.FileReader = class {
      readAsDataURL() {
        this.onload({ target: { result: 'data:image/jpeg;base64,test' } });
      }
    };
  });

  const renderProfilePage = () => {
    return render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );
  };

  test('renders loading state initially', () => {
    getProfileData.mockImplementation(() => new Promise(() => {}));
    renderProfilePage();
    expect(screen.getByAltText('Loading...')).toBeInTheDocument();
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

  test('handles inventory item clicks for locked items', async () => {
    renderProfilePage();

    await waitFor(() => {
      const inventoryItem = screen.getByTitle('Card Customization');
      fireEvent.click(inventoryItem);
      expect(screen.getByText('Card Customization Pack')).toBeInTheDocument();
    });
  });

  test('handles purchase confirmation', async () => {
    renderProfilePage();

    await waitFor(() => {
      fireEvent.click(screen.getByTitle('Card Customization'));
      fireEvent.click(screen.getByText('Yes'));
      expect(screen.queryByText('Card Customization Pack')).not.toBeInTheDocument();
    });
  });

  test('handles background color picker', async () => {
    renderProfilePage();

    await waitFor(() => {
      fireEvent.click(screen.getByTitle('Background Customization'));
      fireEvent.click(screen.getByText('Yes'));
      fireEvent.click(screen.getByTitle('Background Customization'));
      expect(screen.getByText('Background Color')).toBeInTheDocument();
    });
  });

  test('handles card color picker', async () => {
    renderProfilePage();

    await waitFor(() => {
      fireEvent.click(screen.getByTitle('Card Customization'));
      fireEvent.click(screen.getByText('Yes'));
      fireEvent.click(screen.getByTitle('Card Customization'));
      expect(screen.getByText('Card Color')).toBeInTheDocument();
    });
  });

  test('handles border selection', async () => {
    renderProfilePage();

    await waitFor(() => {
      fireEvent.click(screen.getByTitle('Border 1'));
      fireEvent.click(screen.getByText('Yes'));
    });
  });

  test('handles color picker changes', async () => {
    renderProfilePage();

    await waitFor(() => {
      fireEvent.click(screen.getByTitle('Background Customization'));
      fireEvent.click(screen.getByText('Yes'));
      fireEvent.click(screen.getByTitle('Background Customization'));
      
      const colorInput = screen.getByLabelText('Background color picker');
      fireEvent.change(colorInput, { target: { value: '#ff0000' } });
      
      const hexInput = screen.getByLabelText('Hex color');
      fireEvent.change(hexInput, { target: { value: '#00ff00' } });
    });
  });

  test('handles quest close', async () => {
    renderProfilePage();

    await waitFor(() => {
      const questManager = screen.getByTestId('quest-manager');
      expect(questManager).toBeInTheDocument();
    });
  });

  test('handles file input error', async () => {
    renderProfilePage();

    await waitFor(() => {
      fireEvent.click(screen.getByAltText('Edit profile'));
      fireEvent.click(screen.getByText('Remove'));
    });
  });

  test('handles keyboard navigation', async () => {
    renderProfilePage();

    await waitFor(() => {
      const inventoryItem = screen.getByTitle('Card Customization');
      fireEvent.keyDown(inventoryItem, { key: 'Enter' });
      expect(screen.getByText('Card Customization Pack')).toBeInTheDocument();
    });
  });

  test('handles quest with different location formats', async () => {
    const questWithLatLng = {
      id: 'quest2',
      name: 'Quest 2',
      creatorId: 'test123',
      location: { latitude: -26.1935, longitude: 28.0298 }
    };
    getAllQuests.mockResolvedValue([questWithLatLng]);
    
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('Quest 2')).toBeInTheDocument();
    });
  });

  test('handles quest without location', async () => {
    const questNoLocation = {
      id: 'quest3',
      name: 'Quest 3',
      creatorId: 'test123'
    };
    getAllQuests.mockResolvedValue([questNoLocation]);
    
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('Quest 3')).toBeInTheDocument();
    });
  });

  test('handles pastelizeHSL with invalid input', async () => {
    const questInvalidColor = {
      id: 'quest4',
      name: 'Quest 4',
      creatorId: 'test123',
      color: 'invalid-color'
    };
    getAllQuests.mockResolvedValue([questInvalidColor]);
    
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('Quest 4')).toBeInTheDocument();
    });
  });

  test('handles modal overlay clicks', async () => {
    renderProfilePage();

    await waitFor(() => {
      fireEvent.click(screen.getByTitle('Card Customization'));
      const overlay = screen.getByText('Card Customization Pack').closest('.bg-picker-overlay');
      fireEvent.click(overlay);
      expect(screen.queryByText('Card Customization Pack')).not.toBeInTheDocument();
    });
  });

  test('handles color picker cancel', async () => {
    renderProfilePage();

    await waitFor(() => {
      fireEvent.click(screen.getByTitle('Background Customization'));
      fireEvent.click(screen.getByText('Yes'));
      fireEvent.click(screen.getByTitle('Background Customization'));
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByText('Background Color')).not.toBeInTheDocument();
    });
  });

  test('handles drag events', async () => {
    renderProfilePage();

    await waitFor(() => {
      fireEvent.click(screen.getByAltText('Edit profile'));
    });

    const dropArea = screen.getByRole('button', { name: /select or drop profile image/i });
    
    fireEvent.dragEnter(dropArea);
    fireEvent.dragLeave(dropArea);
  });

  test('handles quest manager actions', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    renderProfilePage();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Test Quest'));
    });

    consoleSpy.mockRestore();
  });

  test('handles user with missing profile picture', async () => {
    const userNoProfilePic = { ...mockUser, profilePicture: null };
    getProfileData.mockResolvedValue(userNoProfilePic);
    
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  test('handles border toggle', async () => {
    renderProfilePage();

    await waitFor(() => {
      fireEvent.click(screen.getByTitle('Border 1'));
      fireEvent.click(screen.getByText('Yes'));
      fireEvent.click(screen.getByTitle('Border 1'));
    });
  });

  test('handles invalid hex color input', async () => {
    renderProfilePage();

    await waitFor(() => {
      fireEvent.click(screen.getByTitle('Background Customization'));
      fireEvent.click(screen.getByText('Yes'));
      fireEvent.click(screen.getByTitle('Background Customization'));
      
      const hexInput = screen.getByLabelText('Hex color');
      fireEvent.change(hexInput, { target: { value: 'invalid' } });
    });
  });

  test('handles purchase with no item', async () => {
    renderProfilePage();

    await waitFor(() => {
      fireEvent.click(screen.getByTitle('Card Customization'));
      const modal = screen.getByText('Card Customization Pack').closest('.bg-picker-modal');
      fireEvent.click(modal);
    });
  });

  test('handles loading state with gif', () => {
    getProfileData.mockImplementation(() => new Promise(() => {}));
    renderProfilePage();
    
    expect(screen.getByAltText('Loading...')).toBeInTheDocument();
  });
});