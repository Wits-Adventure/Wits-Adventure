import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CompleteQuestForm from '../react_components/CompleteQuestForm';

// Mock dependencies
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'test-uid' } })
}));

jest.mock('../firebase/firebase', () => ({
  getUserData: jest.fn(() => Promise.resolve({ Name: 'TestUser' }))
}));

jest.mock('../firebase/general_quest_functions', () => ({
  submitQuestAttempt: jest.fn(() => Promise.resolve()),
  fetchQuestSubmissions: jest.fn(() => Promise.resolve([])),
  removeSubmissionByUserId: jest.fn(() => Promise.resolve())
}));

// Mock FileReader for image uploads
global.FileReader = jest.fn().mockImplementation(() => ({
  onload: null,
  readAsDataURL: jest.fn(function () {
    this.onload({ target: { result: 'data:image/png;base64,test' } });
  })
}));

const mockQuest = {
  id: 'quest-123',
  name: 'Test Quest',
  creatorName: 'QuestCreator'
};

const mockProps = {
  isOpen: true,
  onClose: jest.fn(),
  quest: mockQuest,
  showToast: jest.fn(),
  onSubmission: jest.fn()
};

describe('CompleteQuestForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks
    require('../firebase/firebase').getUserData.mockResolvedValue({ Name: 'TestUser' });
    require('../firebase/general_quest_functions').fetchQuestSubmissions.mockResolvedValue([]);
  });

  test('does not render when isOpen is false', () => {
    render(<CompleteQuestForm {...mockProps} isOpen={false} />);
    expect(screen.queryByText(`Submit Proof for ${mockQuest.name}`)).not.toBeInTheDocument();
  });

  test('does not render when quest is null', () => {
    render(<CompleteQuestForm {...mockProps} quest={null} />);
    expect(screen.queryByText('Submit Proof for')).not.toBeInTheDocument();
  });

  test('renders form with quest details when open', async () => {
    render(<CompleteQuestForm {...mockProps} />);
    await waitFor(() => {
      expect(screen.getByText(`Submit Proof for ${mockQuest.name}`)).toBeInTheDocument();
      expect(screen.getByText(`Placed by ${mockQuest.creatorName}`)).toBeInTheDocument();
      expect(screen.getByText('Click or drag an image to upload')).toBeInTheDocument();
      expect(screen.getByText('Submit Quest')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  test('fetches username and submissions on mount', async () => {
    const getUserData = require('../firebase/firebase').getUserData;
    const fetchQuestSubmissions = require('../firebase/general_quest_functions').fetchQuestSubmissions;
    render(<CompleteQuestForm {...mockProps} />);
    await waitFor(() => {
      expect(getUserData).toHaveBeenCalled();
      expect(fetchQuestSubmissions).toHaveBeenCalledWith(mockQuest.id);
    });
  });

  test('displays previous submission image if exists', async () => {
    const fetchQuestSubmissions = require('../firebase/general_quest_functions').fetchQuestSubmissions;
    fetchQuestSubmissions.mockResolvedValueOnce([
      { userId: 'test-uid', imageUrl: 'data:image/png;base64,previous' }
    ]);
    render(<CompleteQuestForm {...mockProps} />);
    await waitFor(() => {
      expect(screen.getByAltText('Proof Preview')).toHaveAttribute('src', 'data:image/png;base64,previous');
    });
  });

  test('handles image upload', async () => {
    render(<CompleteQuestForm {...mockProps} />);
    const fileInput = screen.getByTestId('file-input', { hidden: true });
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByAltText('Proof Preview')).toHaveAttribute('src', 'data:image/png;base64,test');
      expect(screen.getByText('Remove image')).toBeInTheDocument();
    });
  });

  test('shows error for invalid image upload', async () => {
    render(<CompleteQuestForm {...mockProps} />);
    const fileInput = screen.getByTestId('file-input', { hidden: true });
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(mockProps.showToast).toHaveBeenCalledWith('Please upload a valid image.', 4000, 'proof');
      expect(screen.queryByAltText('Proof Preview')).not.toBeInTheDocument();
    });
  });

  test('clears image when clear button is clicked', async () => {
    render(<CompleteQuestForm {...mockProps} />);
    const fileInput = screen.getByTestId('file-input', { hidden: true });
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByAltText('Proof Preview')).toBeInTheDocument();
    });

    const clearButton = screen.getByText('Remove image');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.queryByAltText('Proof Preview')).not.toBeInTheDocument();
      expect(screen.getByText('Click or drag an image to upload')).toBeInTheDocument();
    });
  });

  test('submits new quest attempt with image', async () => {
    const submitQuestAttempt = require('../firebase/general_quest_functions').submitQuestAttempt;
    render(<CompleteQuestForm {...mockProps} />);
    const fileInput = screen.getByTestId('file-input', { hidden: true });
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });

    fireEvent.change(fileInput);

    const submitButton = screen.getByText('Submit Quest');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitQuestAttempt).toHaveBeenCalledWith(
        mockQuest.id,
        'test-uid',
        expect.any(File),
        'TestUser'
      );
      expect(mockProps.showToast).toHaveBeenCalledWith('Your image is under review.', 4000, 'proof');
      expect(mockProps.onSubmission).toHaveBeenCalledWith(mockQuest.id);
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  test('shows error when submitting without image', async () => {
    render(<CompleteQuestForm {...mockProps} />);
    const submitButton = screen.getByText('Submit Quest');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProps.showToast).toHaveBeenCalledWith('Please upload a proof image before submitting.', 4000, 'proof');
      expect(require('../firebase/general_quest_functions').submitQuestAttempt).not.toHaveBeenCalled();
    });
  });

  test('handles submission update with new image', async () => {
    const fetchQuestSubmissions = require('../firebase/general_quest_functions').fetchQuestSubmissions;
    const submitQuestAttempt = require('../firebase/general_quest_functions').submitQuestAttempt;
    fetchQuestSubmissions.mockResolvedValueOnce([
      { userId: 'test-uid', imageUrl: 'data:image/png;base64,previous' }
    ]);

    render(<CompleteQuestForm {...mockProps} />);
    await waitFor(() => {
      expect(screen.getByText('Update Submission')).toBeInTheDocument();
    });

    const fileInput = screen.getByTestId('file-input', { hidden: true });
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });

    fireEvent.change(fileInput);

    const submitButton = screen.getByText('Update Submission');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitQuestAttempt).toHaveBeenCalledWith(
        mockQuest.id,
        'test-uid',
        expect.any(File),
        'TestUser'
      );
      expect(mockProps.showToast).toHaveBeenCalledWith('Your image is under review.', 4000, 'proof');
      expect(mockProps.onSubmission).toHaveBeenCalledWith(mockQuest.id);
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  test('prevents submission update if image unchanged', async () => {
    const fetchQuestSubmissions = require('../firebase/general_quest_functions').fetchQuestSubmissions;
    fetchQuestSubmissions.mockResolvedValueOnce([
      { userId: 'test-uid', imageUrl: 'data:image/png;base64,previous' }
    ]);

    render(<CompleteQuestForm {...mockProps} />);
    await waitFor(() => {
      expect(screen.getByText('Update Submission')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Update Submission');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProps.showToast).toHaveBeenCalledWith('You have not changed your proof image.', 4000, 'proof');
      expect(require('../firebase/general_quest_functions').submitQuestAttempt).not.toHaveBeenCalled();
    });
  });

  test('deletes submission when submitting without image and has previous submission', async () => {
    const fetchQuestSubmissions = require('../firebase/general_quest_functions').fetchQuestSubmissions;
    const removeSubmissionByUserId = require('../firebase/general_quest_functions').removeSubmissionByUserId;
    fetchQuestSubmissions.mockResolvedValueOnce([
      { userId: 'test-uid', imageUrl: 'data:image/png;base64,previous' }
    ]);

    render(<CompleteQuestForm {...mockProps} />);
    await waitFor(() => {
      expect(screen.getByText('Update Submission')).toBeInTheDocument();
    });

    const clearButton = screen.getByText('Remove image');
    fireEvent.click(clearButton);

    const submitButton = screen.getByText('Update Submission');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(removeSubmissionByUserId).toHaveBeenCalledWith(mockQuest.id, 'test-uid');
      expect(mockProps.showToast).toHaveBeenCalledWith('Your previous submission has been deleted.', 4000, 'proof');
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  test('handles cancel button click', async () => {
    render(<CompleteQuestForm {...mockProps} />);
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    await waitFor(() => {
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  test('disables buttons while submitting', async () => {
    render(<CompleteQuestForm {...mockProps} />);
    const fileInput = screen.getByTestId('file-input', { hidden: true });
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });

    fireEvent.change(fileInput);

    const submitButton = screen.getByText('Submit Quest');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Cancel')).toBeDisabled();
    });
  });

  test('shows error when submitting without current user', async () => {
    const { useAuth } = require('../context/AuthContext');
    useAuth.mockReturnValue({ currentUser: null });

    render(<CompleteQuestForm {...mockProps} />);
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });

    fireEvent.change(fileInput);

    const submitButton = screen.getByText('Submit Quest');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProps.showToast).toHaveBeenCalledWith('You must be logged in to submit proof.', 4000, 'proof');
      expect(require('../firebase/general_quest_functions').submitQuestAttempt).not.toHaveBeenCalled();
    });
  });

  test('handles getUserData failure', async () => {
    const getUserData = require('../firebase/firebase').getUserData;
    getUserData.mockRejectedValue(new Error('Failed to fetch user data'));
    
    render(<CompleteQuestForm {...mockProps} />);
    
    await waitFor(() => {
      expect(getUserData).toHaveBeenCalled();
    });
  });

  test('handles fetchQuestSubmissions failure', async () => {
    const fetchQuestSubmissions = require('../firebase/general_quest_functions').fetchQuestSubmissions;
    fetchQuestSubmissions.mockRejectedValue(new Error('Failed to fetch submissions'));
    
    render(<CompleteQuestForm {...mockProps} />);
    
    await waitFor(() => {
      expect(fetchQuestSubmissions).toHaveBeenCalled();
    });
  });

  test('handles submission failure', async () => {
    const submitQuestAttempt = require('../firebase/general_quest_functions').submitQuestAttempt;
    submitQuestAttempt.mockRejectedValue(new Error('Submission failed'));
    
    render(<CompleteQuestForm {...mockProps} />);
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });

    fireEvent.change(fileInput);

    const submitButton = screen.getByText('Submit Quest');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProps.showToast).toHaveBeenCalledWith('Failed to submit your proof. Please try again.', 4000, 'proof');
    });
  });

  test('handles removeSubmissionByUserId failure', async () => {
    const fetchQuestSubmissions = require('../firebase/general_quest_functions').fetchQuestSubmissions;
    const removeSubmissionByUserId = require('../firebase/general_quest_functions').removeSubmissionByUserId;
    fetchQuestSubmissions.mockResolvedValueOnce([
      { userId: 'test-uid', imageUrl: 'data:image/png;base64,previous' }
    ]);
    removeSubmissionByUserId.mockRejectedValue(new Error('Delete failed'));

    render(<CompleteQuestForm {...mockProps} />);
    await waitFor(() => {
      expect(screen.getByText('Update Submission')).toBeInTheDocument();
    });

    const clearButton = screen.getByTitle('Remove image');
    fireEvent.click(clearButton);

    const submitButton = screen.getByText('Update Submission');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProps.showToast).toHaveBeenCalledWith('Failed to delete your previous submission.', 4000, 'proof');
    });
  });

  test('handles drag and drop events', async () => {
    render(<CompleteQuestForm {...mockProps} />);
    const dropzone = document.querySelector('.cq-image-dropzone');
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    fireEvent.dragEnter(dropzone);
    fireEvent.dragOver(dropzone, { preventDefault: jest.fn() });
    fireEvent.drop(dropzone, {
      preventDefault: jest.fn(),
      dataTransfer: { files: [file] }
    });

    await waitFor(() => {
      expect(screen.getByAltText('Proof Preview')).toBeInTheDocument();
    });
  });

  test('handles drag leave event', async () => {
    render(<CompleteQuestForm {...mockProps} />);
    const dropzone = document.querySelector('.cq-image-dropzone');

    fireEvent.dragEnter(dropzone);
    fireEvent.dragLeave(dropzone);

    expect(dropzone).not.toHaveClass('drag-over');
  });

  test('prevents default on drag over', async () => {
    render(<CompleteQuestForm {...mockProps} />);
    const dropzone = document.querySelector('.cq-image-dropzone');
    const preventDefault = jest.fn();

    fireEvent.dragOver(dropzone, { preventDefault });

    expect(preventDefault).toHaveBeenCalled();
  });

  test('handles invalid file type in drag and drop', async () => {
    render(<CompleteQuestForm {...mockProps} />);
    const dropzone = document.querySelector('.cq-image-dropzone');
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    fireEvent.drop(dropzone, {
      preventDefault: jest.fn(),
      dataTransfer: { files: [file] }
    });

    await waitFor(() => {
      expect(mockProps.showToast).toHaveBeenCalledWith('Please upload a valid image.', 4000, 'proof');
    });
  });

  test('handles quest prop change', async () => {
    const { rerender } = render(<CompleteQuestForm {...mockProps} />);
    
    const newQuest = { ...mockQuest, id: 'new-quest-id', name: 'New Quest' };
    rerender(<CompleteQuestForm {...mockProps} quest={newQuest} />);
    
    await waitFor(() => {
      expect(screen.getByText('Submit Proof for New Quest')).toBeInTheDocument();
    });
  });

  test('handles modal close and reopen', async () => {
    const { rerender } = render(<CompleteQuestForm {...mockProps} />);
    
    rerender(<CompleteQuestForm {...mockProps} isOpen={false} />);
    expect(screen.queryByText(`Submit Proof for ${mockQuest.name}`)).not.toBeInTheDocument();
    
    rerender(<CompleteQuestForm {...mockProps} isOpen={true} />);
    await waitFor(() => {
      expect(screen.getByText(`Submit Proof for ${mockQuest.name}`)).toBeInTheDocument();
    });
  });

  test('handles file input click', async () => {
    render(<CompleteQuestForm {...mockProps} />);
    const dropzone = document.querySelector('.cq-image-dropzone');
    const fileInput = document.querySelector('input[type="file"]');
    
    const clickSpy = jest.spyOn(fileInput, 'click');
    fireEvent.click(dropzone);
    
    expect(clickSpy).toHaveBeenCalled();
  });

  test('handles empty file list in drag and drop', async () => {
    render(<CompleteQuestForm {...mockProps} />);
    const dropzone = document.querySelector('.cq-image-dropzone');

    fireEvent.drop(dropzone, {
      preventDefault: jest.fn(),
      dataTransfer: { files: [] }
    });

    expect(screen.queryByAltText('Proof Preview')).not.toBeInTheDocument();
  });
});