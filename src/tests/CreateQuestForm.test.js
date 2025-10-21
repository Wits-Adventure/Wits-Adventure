import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreateQuestForm from '../react_components/CreateQuestForm';

// Mock dependencies
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'test-uid' } })
}));

jest.mock('../firebase/firebase', () => ({
  getUserData: jest.fn(() => Promise.resolve({ Name: 'TestUser' }))
}));

jest.mock('../firebase/general_quest_functions', () => ({
  saveQuestToFirestore: jest.fn(() => Promise.resolve())
}));

// Mock Leaflet
global.L = {
  divIcon: jest.fn(() => ({})),
  marker: jest.fn(() => ({
    addTo: jest.fn(() => ({})),
    setLatLng: jest.fn(),
    bindPopup: jest.fn()
  })),
  circle: jest.fn(() => ({
    bindPopup: jest.fn(),
    addTo: jest.fn(() => ({})),
    _emoji: '',
    _emojiMarker: null
  })),
  latLng: jest.fn((lat, lng) => ({ lat, lng }))
};

// Mock window.L
window.L = global.L;

// Mock FileReader
global.FileReader = class {
  readAsDataURL() {
    this.onload({ target: { result: 'data:image/png;base64,test' } });
  }
};

const mockProps = {
  isOpen: true,
  onClose: jest.fn(),
  mapInstanceRef: {
    current: {
      getCenter: () => ({ lat: 0, lng: 0 }),
      getContainer: () => ({
        classList: {
          add: jest.fn(),
          remove: jest.fn()
        }
      }),
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn(),
      removeLayer: jest.fn()
    }
  },
  questCirclesRef: { current: [] }
};

describe('CreateQuestForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset global variables
    window.__questPlacing = false;
  });

  test('renders form when open', async () => {
    render(<CreateQuestForm {...mockProps} />);
    await waitFor(() => {
      expect(screen.getByText('Create Quest')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter quest name')).toBeInTheDocument();
      expect(screen.getByText('Quest Image (Required)')).toBeInTheDocument();
      expect(screen.getByText('Quest Reward: 45 points')).toBeInTheDocument();
    });
  });

  test('does not render form when isOpen is false and not following', () => {
    render(<CreateQuestForm {...mockProps} isOpen={false} />);
    expect(screen.queryByText('Create Quest')).not.toBeInTheDocument();
  });

  test('updates quest name input', async () => {
    render(<CreateQuestForm {...mockProps} />);
    const input = screen.getByPlaceholderText('Enter quest name');
    fireEvent.change(input, { target: { value: 'Test Quest' } });
    expect(input).toHaveValue('Test Quest');
  });

  test('updates radius slider and displays correct value', async () => {
    render(<CreateQuestForm {...mockProps} />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '100' } });
    await waitFor(() => {
      expect(screen.getByText('100m')).toBeInTheDocument();
      expect(screen.getByText('Quest Reward: 100 points')).toBeInTheDocument();
    });
  });

  test('select location button disabled without image', async () => {
    render(<CreateQuestForm {...mockProps} />);
    await waitFor(() => {
      const button = screen.getByText('Select Location');
      expect(button).toBeDisabled();
    });
  });

  test('enables select location button after image upload', async () => {
    render(<CreateQuestForm {...mockProps} />);
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      const button = screen.getByText('Select Location');
      expect(button).not.toBeDisabled();
    });
  });

  test('handles cancel button click', async () => {
    render(<CreateQuestForm {...mockProps} />);
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    await waitFor(() => {
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  test('displays image preview after upload', async () => {
    render(<CreateQuestForm {...mockProps} />);
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByAltText('Quest Preview')).toBeInTheDocument();
    });
  });

  test('handles drag and drop image upload', async () => {
    render(<CreateQuestForm {...mockProps} />);
    const dropZone = screen.getByText(/Click to upload or drag image here/).closest('.cq-image-dropzone');
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    fireEvent.dragEnter(dropZone);
    await waitFor(() => {
      expect(dropZone).toHaveClass('drag-active');
    });

    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByAltText('Quest Preview')).toBeInTheDocument();
      expect(dropZone).not.toHaveClass('drag-active');
    });
  });

  test('starts following mode when select location is clicked with image', async () => {
    render(<CreateQuestForm {...mockProps} />);
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });

    fireEvent.change(fileInput);

    const selectButton = screen.getByText('Select Location');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText(/Click on the map to place the quest/)).toBeInTheDocument();
      expect(mockProps.mapInstanceRef.current.getContainer().classList.add).toHaveBeenCalledWith('quest-placing');
      expect(global.L.marker).toHaveBeenCalled();
    });
  });

  test('aborts following mode when abort button is clicked', async () => {
    render(<CreateQuestForm {...mockProps} />);
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });

    fireEvent.change(fileInput);

    const selectButton = screen.getByText('Select Location');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText(/Click on the map to place the quest/)).toBeInTheDocument();
    });

    const abortButton = screen.getByText('Abort');
    fireEvent.click(abortButton);

    await waitFor(() => {
      expect(mockProps.mapInstanceRef.current.removeLayer).toHaveBeenCalled();
      expect(mockProps.mapInstanceRef.current.getContainer().classList.remove).toHaveBeenCalledWith('quest-placing');
      expect(screen.queryByText(/Click on the map to place the quest/)).not.toBeInTheDocument();
    });
  });

  test('places quest on map click in following mode', async () => {
    const saveQuestToFirestore = require('../firebase/general_quest_functions').saveQuestToFirestore;
    render(<CreateQuestForm {...mockProps} />);
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      const selectButton = screen.getByText('Select Location');
      fireEvent.click(selectButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Click on the map to place the quest/)).toBeInTheDocument();
    });

    // Simulate map click
    const clickHandler = mockProps.mapInstanceRef.current.once.mock.calls.find(
      (call) => call[0] === 'click'
    )[1];
    clickHandler({ latlng: { lat: 1, lng: 1 } });

    await waitFor(() => {
      expect(global.L.circle).toHaveBeenCalled();
      expect(saveQuestToFirestore).toHaveBeenCalled();
    });
  });

  test('handles invalid image upload', async () => {
    window.alert = jest.fn();
    
    render(<CreateQuestForm {...mockProps} />);
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Please upload a valid image file.');
    });
  });

  test('fetches username on mount', async () => {
    const getUserData = require('../firebase/firebase').getUserData;
    render(<CreateQuestForm {...mockProps} />);
    await waitFor(() => {
      expect(getUserData).toHaveBeenCalled();
    });
  });

  test('handles emoji extraction from quest name', async () => {
    render(<CreateQuestForm {...mockProps} />);
    const input = screen.getByPlaceholderText('Enter quest name');
    fireEvent.change(input, { target: { value: '🗡️ Epic Quest' } });
    expect(input).toHaveValue('🗡️ Epic Quest');
  });

  test('shows following mode instructions', async () => {
    render(<CreateQuestForm {...mockProps} />);
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      const selectButton = screen.getByText('Select Location');
      fireEvent.click(selectButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/After pressing "Select Location"/)).toBeInTheDocument();
    });
  });
});
  test('handles description input changes', async () => {
    render(<CreateQuestForm {...mockProps} />);
    const textarea = screen.getByPlaceholderText('Briefly describe the quest...');
    fireEvent.change(textarea, { target: { value: 'Test description' } });
    expect(textarea).toHaveValue('Test description');
  });

  test('handles key propagation prevention', async () => {
    render(<CreateQuestForm {...mockProps} />);
    const input = screen.getByPlaceholderText('Enter quest name');
    const event = { stopPropagation: jest.fn() };
    fireEvent.keyDown(input, event);
    fireEvent.keyUp(input, event);
  });

  test('handles emoji extraction and quest placement', async () => {
    render(<CreateQuestForm {...mockProps} />);
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    const nameInput = screen.getByPlaceholderText('Enter quest name');
    fireEvent.change(nameInput, { target: { value: '🗡️ Epic Quest' } });

    await waitFor(() => {
      const selectButton = screen.getByText('Select Location');
      fireEvent.click(selectButton);
    });

    // Simulate map click with quest placement
    const clickHandler = mockProps.mapInstanceRef.current.once.mock.calls.find(
      (call) => call[0] === 'click'
    )[1];
    clickHandler({ latlng: { lat: 1, lng: 1 } });

    await waitFor(() => {
      expect(global.L.circle).toHaveBeenCalled();
    });
  });

  test('handles quest placement with description', async () => {
    render(<CreateQuestForm {...mockProps} />);
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    const descInput = screen.getByPlaceholderText('Briefly describe the quest...');
    fireEvent.change(descInput, { target: { value: 'A challenging quest' } });

    await waitFor(() => {
      const selectButton = screen.getByText('Select Location');
      fireEvent.click(selectButton);
    });

    const clickHandler = mockProps.mapInstanceRef.current.once.mock.calls.find(
      (call) => call[0] === 'click'
    )[1];
    clickHandler({ latlng: { lat: 1, lng: 1 } });
  });

  test('handles quest circles pointer events restoration', async () => {
    const mockCircle = {
      _path: { 
        style: { pointerEvents: 'auto' },
        dataset: {}
      },
      _emojiMarker: {
        _icon: {
          style: { pointerEvents: 'auto' },
          dataset: {}
        }
      }
    };
    
    const propsWithCircles = {
      ...mockProps,
      questCirclesRef: { current: [mockCircle] }
    };

    render(<CreateQuestForm {...propsWithCircles} />);
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      const selectButton = screen.getByText('Select Location');
      fireEvent.click(selectButton);
    });

    const abortButton = screen.getByText('Abort');
    fireEvent.click(abortButton);
  });

  test('handles quest placement without image preview', async () => {
    render(<CreateQuestForm {...mockProps} />);
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    
    // Mock FileReader to not set imagePreview
    global.FileReader = class {
      readAsDataURL() {
        // Don't call onload to simulate no preview
      }
    };
    
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      const selectButton = screen.getByText('Select Location');
      expect(selectButton).not.toBeDisabled();
    });
  });

  test('handles mousemove during following mode', async () => {
    render(<CreateQuestForm {...mockProps} />);
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      const selectButton = screen.getByText('Select Location');
      fireEvent.click(selectButton);
    });

    // Simulate mousemove event
    const moveHandler = mockProps.mapInstanceRef.current.on.mock.calls.find(
      (call) => call[0] === 'mousemove'
    )[1];
    moveHandler({ latlng: { lat: 2, lng: 2 } });
  });

  test('handles cleanup on unmount during following', async () => {
    const { unmount } = render(<CreateQuestForm {...mockProps} />);
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      const selectButton = screen.getByText('Select Location');
      fireEvent.click(selectButton);
    });

    unmount();
  });