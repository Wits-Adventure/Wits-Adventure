import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import QuestManager from '../react_components/QuestManager';
import { approveSubmissionAndCloseQuest, fetchQuestSubmissions, removeQuestSubmission, closeQuestAndRemoveFromUsers } from "../firebase/general_quest_functions";

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn()
}));

jest.mock('../firebase/general_quest_functions', () => ({
  approveSubmissionAndCloseQuest: jest.fn(),
  fetchQuestSubmissions: jest.fn(),
  removeQuestSubmission: jest.fn(),
  closeQuestAndRemoveFromUsers: jest.fn()
}));

// Mock images
jest.mock('../media/quest-submission-1.jpg', () => 'quest1.jpg');
jest.mock('../media/quest-submission-2.jpg', () => 'quest2.jpg');
jest.mock('../media/quest-submission-3.jpg', () => 'quest3.jpg');

describe('QuestManager', () => {
  const mockQuest = {
    id: 'quest123',
    name: 'Test Quest'
  };

  const mockSubmissions = [
    {
      id: 'sub1',
      userId: 'user1',
      Name: 'Adventure Seeker',
      userName: 'Adventure Seeker',
      imageUrl: 'test-image.jpg',
      submittedAt: '2023-01-01',
      description: 'Test submission'
    },
    {
      id: 'sub2',
      userId: 'user2',
      Name: 'Quest Master',
      userName: 'Quest Master',
      imageUrl: 'test-image2.jpg',
      submittedAt: '2023-01-02'
    }
  ];

  const mockNavigate = jest.fn();

  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    fetchQuestSubmissions.mockResolvedValue(mockSubmissions);
    jest.clearAllMocks();
  });

  test('renders nothing when not open', () => {
    const { container } = render(
      <QuestManager quest={mockQuest} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders nothing when quest is null', () => {
    const { container } = render(
      <QuestManager quest={null} isOpen={true} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders quest manager when open', async () => {
    render(<QuestManager quest={mockQuest} isOpen={true} />);
    await waitFor(() => {
      expect(screen.getByText('Test Quest')).toBeInTheDocument();
    });
  });

  test('fetches submissions when opened', async () => {
    render(<QuestManager quest={mockQuest} isOpen={true} />);
    await waitFor(() => {
      expect(fetchQuestSubmissions).toHaveBeenCalledWith('quest123');
    });
  });

  test('handles image navigation', async () => {
    render(<QuestManager quest={mockQuest} isOpen={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });
    
    const nextButton = screen.getByLabelText('Next submission');
    const prevButton = screen.getByLabelText('Previous submission');
    
    fireEvent.click(nextButton);
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    
    fireEvent.click(prevButton);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  test('handles submission acceptance', async () => {
    const onClose = jest.fn();
    const onCloseQuest = jest.fn();
    render(
      <QuestManager 
        quest={mockQuest} 
        isOpen={true} 
        onClose={onClose}
        onCloseQuest={onCloseQuest}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Adventure Seeker')).toBeInTheDocument();
    });

    const acceptButton = screen.getByLabelText('Accept submission');
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(approveSubmissionAndCloseQuest).toHaveBeenCalledWith('quest123', 'user1');
      expect(onCloseQuest).toHaveBeenCalledWith('quest123');
      expect(onClose).toHaveBeenCalled();
    });
  });

  test('handles submission rejection', async () => {
    render(
      <QuestManager 
        quest={mockQuest} 
        isOpen={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Adventure Seeker')).toBeInTheDocument();
    });

    const rejectButton = screen.getByLabelText('Reject submission');
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(removeQuestSubmission).toHaveBeenCalledWith('quest123', 0);
    });
  });

  test('handles quest closure confirmation', async () => {
    const onClose = jest.fn();
    const onCloseQuest = jest.fn();

    render(
      <QuestManager 
        quest={mockQuest} 
        isOpen={true} 
        onClose={onClose}
        onCloseQuest={onCloseQuest}
      />
    );

    // Open confirmation dialog
    fireEvent.click(screen.getByText('CLOSE QUEST'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Confirm closure
    fireEvent.click(screen.getByText('Yes, close quest'));
    
    await waitFor(() => {
      expect(closeQuestAndRemoveFromUsers).toHaveBeenCalledWith('quest123');
      expect(onCloseQuest).toHaveBeenCalledWith('quest123');
      expect(onClose).toHaveBeenCalled();
    });
  });

  test('handles view on map navigation', () => {
    render(<QuestManager quest={mockQuest} isOpen={true} />);
    
    fireEvent.click(screen.getByText('View On Map'));
    
    expect(mockNavigate).toHaveBeenCalledWith('/', {
      state: { focusQuest: mockQuest }
    });
  });

  test('handles image load errors', async () => {
    render(<QuestManager quest={mockQuest} isOpen={true} />);
    
    await waitFor(() => {
      const image = screen.getByAltText('Submission by Adventure Seeker');
      fireEvent.error(image);
      expect(image.src).toContain('placeholder-quest-image.jpg');
    });
  });

  test('handles image load success', async () => {
    render(<QuestManager quest={mockQuest} isOpen={true} />);
    
    await waitFor(() => {
      const image = screen.getByAltText('Submission by Adventure Seeker');
      fireEvent.load(image);
      expect(image.style.opacity).toBe('1');
    });
  });

  test('displays no submissions message when submissions list is empty', async () => {
    fetchQuestSubmissions.mockResolvedValue([]);
    render(
      <QuestManager 
        quest={mockQuest} 
        isOpen={true}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('No submissions yet')).toBeInTheDocument();
      expect(screen.getByText('Waiting for adventurers to complete this quest...')).toBeInTheDocument();
    });
  });

  test('disables buttons when no submissions', async () => {
    fetchQuestSubmissions.mockResolvedValue([]);
    render(<QuestManager quest={mockQuest} isOpen={true} />);
    
    await waitFor(() => {
      const acceptButton = screen.getByLabelText('Accept submission');
      const rejectButton = screen.getByLabelText('Reject submission');
      
      expect(acceptButton).toBeDisabled();
      expect(rejectButton).toBeDisabled();
    });
  });

  test('closes confirmation dialog when clicking cancel', async () => {
    render(<QuestManager quest={mockQuest} isOpen={true} />);
    
    fireEvent.click(screen.getByText('CLOSE QUEST'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('No, keep quest'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('closes confirmation dialog when clicking backdrop', async () => {
    render(<QuestManager quest={mockQuest} isOpen={true} />);
    
    fireEvent.click(screen.getByText('CLOSE QUEST'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    const backdrop = document.querySelector('.confirm-dialog-backdrop');
    fireEvent.click(backdrop);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('displays submission details correctly', async () => {
    render(<QuestManager quest={mockQuest} isOpen={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Submitted by: Adventure Seeker')).toBeInTheDocument();
      expect(screen.getByText('Test submission')).toBeInTheDocument();
      expect(screen.getByText('1/1/2023')).toBeInTheDocument();
    });
  });

  test('handles submission without description', async () => {
    const submissionWithoutDesc = [{
      id: 'sub1',
      userId: 'user1',
      Name: 'Test User',
      userName: 'Test User',
      imageUrl: 'test.jpg',
      submittedAt: '2023-01-01'
    }];
    fetchQuestSubmissions.mockResolvedValue(submissionWithoutDesc);
    
    render(<QuestManager quest={mockQuest} isOpen={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Submitted by: Test User')).toBeInTheDocument();
      expect(screen.queryByText('Test submission')).not.toBeInTheDocument();
    });
  });

  test('closes modal when clicking overlay', () => {
    const onClose = jest.fn();
    render(<QuestManager quest={mockQuest} isOpen={true} onClose={onClose} />);
    
    const overlay = document.querySelector('.quest-manager-overlay');
    fireEvent.click(overlay);
    
    expect(onClose).toHaveBeenCalled();
  });

  test('prevents modal close when clicking inside modal', () => {
    const onClose = jest.fn();
    render(<QuestManager quest={mockQuest} isOpen={true} onClose={onClose} />);
    
    const modal = document.querySelector('.quest-manager-modal');
    fireEvent.click(modal);
    
    expect(onClose).not.toHaveBeenCalled();
  });

  test('resets state when modal closes', async () => {
    const { rerender } = render(<QuestManager quest={mockQuest} isOpen={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Adventure Seeker')).toBeInTheDocument();
    });
    
    rerender(<QuestManager quest={mockQuest} isOpen={false} />);
    
    expect(screen.queryByText('Adventure Seeker')).not.toBeInTheDocument();
  });

  test('handles quest without id', () => {
    const questWithoutId = { name: 'Test Quest' };
    render(<QuestManager quest={questWithoutId} isOpen={true} />);
    
    expect(fetchQuestSubmissions).not.toHaveBeenCalled();
  });

  test('handles accept with no current submission', async () => {
    fetchQuestSubmissions.mockResolvedValue([]);
    const onClose = jest.fn();
    render(<QuestManager quest={mockQuest} isOpen={true} onClose={onClose} />);
    
    await waitFor(() => {
      const acceptButton = screen.getByLabelText('Accept submission');
      fireEvent.click(acceptButton);
      expect(approveSubmissionAndCloseQuest).not.toHaveBeenCalled();
    });
  });

  test('handles reject with no current submission', async () => {
    fetchQuestSubmissions.mockResolvedValue([]);
    render(<QuestManager quest={mockQuest} isOpen={true} />);
    
    await waitFor(() => {
      const rejectButton = screen.getByLabelText('Reject submission');
      fireEvent.click(rejectButton);
      expect(removeQuestSubmission).not.toHaveBeenCalled();
    });
  });

  test('handles missing submittedAt date', async () => {
    const submissionWithoutDate = [{
      id: 'sub1',
      userId: 'user1',
      Name: 'Test User',
      userName: 'Test User',
      imageUrl: 'test.jpg'
    }];
    fetchQuestSubmissions.mockResolvedValue(submissionWithoutDate);
    
    render(<QuestManager quest={mockQuest} isOpen={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Unknown date')).toBeInTheDocument();
    });
  });

  test('handles quest with location for view on map', () => {
    const questWithLocation = {
      ...mockQuest,
      location: { _latitude: -26.1935, _longitude: 28.0298 }
    };
    render(<QuestManager quest={questWithLocation} isOpen={true} />);
    
    fireEvent.click(screen.getByText('View On Map'));
    
    expect(mockNavigate).toHaveBeenCalledWith('/', {
      state: {
        focusQuest: {
          ...questWithLocation,
          location: { latitude: -26.1935, longitude: 28.0298 }
        }
      }
    });
  });

  test('handles quest with standard location format', () => {
    const questWithStandardLocation = {
      ...mockQuest,
      location: { latitude: -26.1935, longitude: 28.0298 }
    };
    render(<QuestManager quest={questWithStandardLocation} isOpen={true} />);
    
    fireEvent.click(screen.getByText('View On Map'));
    
    expect(mockNavigate).toHaveBeenCalledWith('/', {
      state: {
        focusQuest: questWithStandardLocation
      }
    });
  });

  test('handles quest with no location', () => {
    const questWithoutLocation = {
      ...mockQuest,
      location: null
    };
    render(<QuestManager quest={questWithoutLocation} isOpen={true} />);
    
    fireEvent.click(screen.getByText('View On Map'));
    
    expect(mockNavigate).toHaveBeenCalledWith('/', {
      state: {
        focusQuest: {
          ...questWithoutLocation,
          location: null
        }
      }
    });
  });

  test('clamps current image index when submissions change', async () => {
    const { rerender } = render(<QuestManager quest={mockQuest} isOpen={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });
    
    // Navigate to second image
    fireEvent.click(screen.getByLabelText('Next submission'));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    
    // Change submissions to single item
    fetchQuestSubmissions.mockResolvedValue([mockSubmissions[0]]);
    rerender(<QuestManager quest={mockQuest} isOpen={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('1 / 1')).toBeInTheDocument();
    });
  });

  test('resets state when modal closes and reopens', async () => {
    const { rerender } = render(<QuestManager quest={mockQuest} isOpen={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Adventure Seeker')).toBeInTheDocument();
    });
    
    // Close modal
    rerender(<QuestManager quest={mockQuest} isOpen={false} />);
    
    // Reopen modal
    rerender(<QuestManager quest={mockQuest} isOpen={true} />);
    
    await waitFor(() => {
      expect(fetchQuestSubmissions).toHaveBeenCalledTimes(2);
    });
  });

  test('shows image placeholder when image fails to load', async () => {
    render(<QuestManager quest={mockQuest} isOpen={true} />);
    
    await waitFor(() => {
      const image = screen.getByAltText('Submission by Adventure Seeker');
      fireEvent.error(image);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Image not available')).toBeInTheDocument();
    });
  });

  test('handles navigation with no submissions', async () => {
    fetchQuestSubmissions.mockResolvedValue([]);
    render(<QuestManager quest={mockQuest} isOpen={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('No submissions yet')).toBeInTheDocument();
    });
  });
});