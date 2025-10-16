import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from '../react_components/ProfilePage';

// Mock Firebase functions
jest.mock('../firebase/profile_functions', () => ({
  getProfileData: jest.fn(),
  updateProfileData: jest.fn(),
  getUserInventoryItems: jest.fn(),
  unlockInventoryItem: jest.fn(),
  setCustomisation: jest.fn(),
  getCustomisation: jest.fn()
}));

jest.mock('../firebase/general_quest_functions', () => ({
  getAllQuests: jest.fn()
}));

// Mock QuestManager
jest.mock('../react_components/QuestManager', () => {
  return function MockQuestManager({ isOpen }) {
    return isOpen ? <div data-testid="quest-manager">Quest Manager</div> : null;
  };
});

// Mock assets
jest.mock('../css/ProfilePage.css', () => ({}));
jest.mock('../assets/profile.jpg', () => 'profile.jpg');
jest.mock('../assets/edit_icon.png', () => 'edit.png');
jest.mock('../media/cardcustomization.png', () => 'card.png');
jest.mock('../media/backgroundcustomization.png', () => 'bg.png');
jest.mock('../media/Borders1.png', () => 'border1.png');
jest.mock('../media/Borders2.png', () => 'border2.png');
jest.mock('../media/Borders3.png', () => 'border3.png');
jest.mock('../media/Borders4.png', () => 'border4.png');
jest.mock('../media/Borders5.png', () => 'border5.png');
jest.mock('../media/Borders6.png', () => 'border6.png');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

import { getProfileData, getUserInventoryItems, unlockInventoryItem, setCustomisation, getCustomisation } from '../firebase/profile_functions';
import { getAllQuests } from '../firebase/general_quest_functions';

describe('ProfilePage', () => {
  const mockUser = {
    uid: 'test123',
    Name: 'John Doe',
    Bio: 'Test bio',
    LeaderBoardPoints: 100,
    CompletedQuests: [],
    acceptedQuests: [],
    Level: 5,
    Experience: 250,
    SpendablePoints: 50,
    profilePicture: 'test.jpg'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getProfileData.mockResolvedValue(mockUser);
    getAllQuests.mockResolvedValue([]);
    getUserInventoryItems.mockResolvedValue({});
    getCustomisation.mockResolvedValue({});
    document.documentElement.style.setProperty = jest.fn();
    document.body.style = {};
  });

  const renderProfilePage = () => {
    return render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );
  };

  test('renders loading state', () => {
    getProfileData.mockImplementation(() => new Promise(() => {}));
    renderProfilePage();
    expect(screen.getByAltText('Loading...')).toBeInTheDocument();
  });

  test('displays user profile data', async () => {
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText('Test bio')).toBeInTheDocument();
  });

  test('opens edit modal', async () => {
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });
    fireEvent.click(screen.getByAltText('Edit profile'));
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });
  });

  test('handles back navigation', async () => {
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });
    fireEvent.click(screen.getByLabelText('Back to home'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('handles error state', async () => {
    getProfileData.mockRejectedValue(new Error('Failed'));
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  test('handles inventory item clicks', async () => {
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });
    fireEvent.click(screen.getByTitle('Card Customization'));
    expect(screen.getByText('Card Customization Pack')).toBeInTheDocument();
  });

  test('handles purchase confirmation', async () => {
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });
    fireEvent.click(screen.getByTitle('Card Customization'));
    fireEvent.click(screen.getByText('Yes'));
  });

  test('handles color picker interactions', async () => {
    getUserInventoryItems.mockResolvedValue({ 'background-customization': true });
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });
    fireEvent.click(screen.getByTitle('Background Customization'));
    await waitFor(() => {
      expect(screen.getByText('Background Color')).toBeInTheDocument();
    });
    const colorInput = screen.getByLabelText('Background color picker');
    fireEvent.change(colorInput, { target: { value: '#ff0000' } });
    fireEvent.click(screen.getByText('Done'));
  });

  test('handles border selection', async () => {
    getUserInventoryItems.mockResolvedValue({ 'border-1': true });
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });
    fireEvent.click(screen.getByTitle('Border 1'));
  });

  test('handles profile picture upload', async () => {
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });
    fireEvent.click(screen.getByAltText('Edit profile'));
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const dropArea = screen.getByRole('button', { name: /select or drop profile image/i });
    fireEvent.drop(dropArea, { dataTransfer: { files: [file] } });
  });

  test('handles quest creation display', async () => {
    const mockQuests = [{
      id: 'quest1',
      name: 'Test Quest',
      creatorId: 'test123',
      emoji: '🗺️'
    }];
    getAllQuests.mockResolvedValue(mockQuests);
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('Test Quest')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Test Quest'));
    expect(screen.getByTestId('quest-manager')).toBeInTheDocument();
  });

  test('handles keyboard interactions', async () => {
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });
    const inventoryItem = screen.getByTitle('Card Customization');
    fireEvent.keyDown(inventoryItem, { key: 'Enter' });
    expect(screen.getByText('Card Customization Pack')).toBeInTheDocument();
  });

  test('handles modal overlays', async () => {
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });
    fireEvent.click(screen.getByTitle('Card Customization'));
    const overlay = screen.getByText('Card Customization Pack').closest('.bg-picker-overlay');
    fireEvent.click(overlay);
    expect(screen.queryByText('Card Customization Pack')).not.toBeInTheDocument();
  });

  test('handles insufficient points purchase', async () => {
    const poorUser = { ...mockUser, SpendablePoints: 10 };
    getProfileData.mockResolvedValue(poorUser);
    window.alert = jest.fn();
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });
    fireEvent.click(screen.getByTitle('Card Customization'));
    fireEvent.click(screen.getByText('Yes'));
    expect(window.alert).toHaveBeenCalledWith('You do not have enough points to purchase this item.');
  });

  test('handles unlock item error', async () => {
    unlockInventoryItem.mockRejectedValue(new Error('Unlock failed'));
    window.alert = jest.fn();
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });
    fireEvent.click(screen.getByTitle('Card Customization'));
    fireEvent.click(screen.getByText('Yes'));
    expect(window.alert).toHaveBeenCalledWith('Unlock failed');
  });

  test('handles card color picker', async () => {
    getUserInventoryItems.mockResolvedValue({ 'card-customization': true });
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });
    fireEvent.click(screen.getByTitle('Card Customization'));
    await waitFor(() => {
      expect(screen.getByText('Card Color')).toBeInTheDocument();
    });
    const colorInput = screen.getByLabelText('Card color picker');
    fireEvent.change(colorInput, { target: { value: '#123456' } });
    fireEvent.click(screen.getByText('Done'));
  });

  test('handles hex input validation', async () => {
    getUserInventoryItems.mockResolvedValue({ 'background-customization': true });
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });
    fireEvent.click(screen.getByTitle('Background Customization'));
    await waitFor(() => {
      expect(screen.getByText('Background Color')).toBeInTheDocument();
    });
    const hexInput = screen.getByLabelText('Hex color');
    fireEvent.change(hexInput, { target: { value: 'ff0000' } });
    fireEvent.change(hexInput, { target: { value: '#invalid' } });
  });

  test('handles color picker cancel', async () => {
    getUserInventoryItems.mockResolvedValue({ 'background-customization': true });
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });
    fireEvent.click(screen.getByTitle('Background Customization'));
    await waitFor(() => {
      expect(screen.getByText('Background Color')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Background Color')).not.toBeInTheDocument();
  });

  test('handles profile edit save error', async () => {
    updateProfileData.mockRejectedValue(new Error('Save failed'));
    window.alert = jest.fn();
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });
    fireEvent.click(screen.getByAltText('Edit profile'));
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to update profile. Please try again.');
    });
  });

  test('handles edit cancel', async () => {
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });
    fireEvent.click(screen.getByAltText('Edit profile'));
    fireEvent.change(screen.getByDisplayValue('John Doe'), { target: { value: 'Changed' } });
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
  });

  test('handles remove profile image', async () => {
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });
    fireEvent.click(screen.getByAltText('Edit profile'));
    fireEvent.click(screen.getByText('Remove'));
    expect(screen.getByAltText('Profile preview')).toHaveAttribute('src', '/default.jpg');
  });

  test('handles drag events', async () => {
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });
    fireEvent.click(screen.getByAltText('Edit profile'));
    const dropArea = screen.getByRole('button', { name: /select or drop profile image/i });
    fireEvent.dragOver(dropArea);
    fireEvent.dragLeave(dropArea);
  });
});