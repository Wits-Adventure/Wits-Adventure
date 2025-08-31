import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import QuestManager from '../react_components/QuestManager';
import { closeQuestAndRemoveFromUsers } from "../firebase/general_quest_functions";

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn()
}));

jest.mock('../firebase/general_quest_functions', () => ({
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

  const mockNavigate = jest.fn();

  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    jest.clearAllMocks();
  });

  test('renders nothing when not open', () => {
    const { container } = render(
      <QuestManager quest={mockQuest} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders quest manager when open', () => {
    render(<QuestManager quest={mockQuest} isOpen={true} />);
    expect(screen.getByText('Test Quest')).toBeInTheDocument();
  });

  test('handles image navigation', () => {
    render(<QuestManager quest={mockQuest} isOpen={true} />);
    
    const nextButton = screen.getByLabelText('Next submission');
    const prevButton = screen.getByLabelText('Previous submission');
    
    fireEvent.click(nextButton);
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    
    fireEvent.click(prevButton);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  test('handles submission acceptance', async () => {
    const onAccept = jest.fn();
    render(
      <QuestManager 
        quest={mockQuest} 
        isOpen={true} 
        onAccept={onAccept}
      />
    );

    const acceptButton = screen.getByLabelText('Accept submission');
    fireEvent.click(acceptButton);

    expect(onAccept).toHaveBeenCalledWith(1, 'quest123');
  });

  test('handles submission rejection', async () => {
    const onReject = jest.fn();
    render(
      <QuestManager 
        quest={mockQuest} 
        isOpen={true} 
        onReject={onReject}
      />
    );

    const rejectButton = screen.getByLabelText('Reject submission');
    fireEvent.click(rejectButton);

    expect(onReject).toHaveBeenCalledWith(1, 'quest123');
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

  test('handles image load errors', () => {
    render(<QuestManager quest={mockQuest} isOpen={true} />);
    
    const image = screen.getByAltText('Submission by Adventure Seeker');
    fireEvent.error(image);
    
    expect(image.src).toContain('placeholder-quest-image.jpg');
  });

  test('displays no submissions message when submissions list is empty', () => {
    render(
      <QuestManager 
        quest={mockQuest} 
        isOpen={true} 
        submissions={[]} 
      />
    );
    
    expect(screen.getByText('No submissions yet')).toBeInTheDocument();
    expect(screen.getByText('Waiting for adventurers to complete this quest...')).toBeInTheDocument();
  });

  test('closes confirmation dialog when clicking outside', () => {
    render(<QuestManager quest={mockQuest} isOpen={true} />);
    
    fireEvent.click(screen.getByText('CLOSE QUEST'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('No, keep quest'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});