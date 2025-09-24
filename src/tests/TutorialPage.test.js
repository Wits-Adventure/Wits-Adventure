import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TutorialPage from '../react_components/TutorialPage';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock CSS
jest.mock('../css//TutorialPage.css', () => ({}));

// Mock images
jest.mock('../media/LoactionQuest.jpg', () => 'location-quest.jpg');
jest.mock('../media/bg.jpg', () => 'bg.jpg');
jest.mock('../media/CreateQuest.png', () => 'create-quest.png');
jest.mock('../media/crowned.png', () => 'crowned.png');
jest.mock('../media/jourrney_0.png', () => 'journey.png');
jest.mock('../media/belltut.png', () => 'bell.png');

describe('TutorialPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderTutorialPage = () => {
    return render(
      <BrowserRouter>
        <TutorialPage />
      </BrowserRouter>
    );
  };

  test('renders without crashing', () => {
    renderTutorialPage();
    expect(screen.getByText('Location Quests')).toBeInTheDocument();
  });

  test('displays location quest information', () => {
    renderTutorialPage();
    expect(screen.getByText('Location Quests')).toBeInTheDocument();
    expect(screen.getByText(/Location Quests will take you an adventure/)).toBeInTheDocument();
  });

  test('displays journey quest information', () => {
    renderTutorialPage();
    expect(screen.getByText('Journey Quests')).toBeInTheDocument();
    expect(screen.getByText(/Journey Quests are special events/)).toBeInTheDocument();
  });

  test('displays quest management information', () => {
    renderTutorialPage();
    expect(screen.getByText(/Upload submissions to quests/)).toBeInTheDocument();
    expect(screen.getByText(/On your profile you'll find/)).toBeInTheDocument();
  });

  test('displays journey quest details', () => {
    renderTutorialPage();
    expect(screen.getByText(/Journey quests are uniquely denoted/)).toBeInTheDocument();
    expect(screen.getByText(/Journey Quests can be completed by multiple/)).toBeInTheDocument();
  });

  test('displays bell instruction', () => {
    renderTutorialPage();
    expect(screen.getByText(/Upon reaching the next location/)).toBeInTheDocument();
    expect(screen.getByText(/NOTE || A single journey quest/)).toBeInTheDocument();
  });

  test('renders all images', () => {
    renderTutorialPage();
    expect(screen.getByAltText('Location Quest')).toBeInTheDocument();
    expect(screen.getByAltText('Create Quest')).toBeInTheDocument();
    expect(screen.getByAltText('Journey Quest')).toBeInTheDocument();
    expect(screen.getByAltText('journey')).toBeInTheDocument();
    expect(screen.getByAltText('bell')).toBeInTheDocument();
    expect(screen.getByAltText('Back')).toBeInTheDocument();
  });

  test('handles back home button click with navigate', () => {
    renderTutorialPage();
    const backButton = screen.getByLabelText('Back to home');
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('handles back home button click without navigate', () => {
    // Mock window.location
    delete window.location;
    window.location = { href: '' };
    
    // Mock navigate to be null
    jest.mocked(require('react-router-dom').useNavigate).mockReturnValue(null);
    
    renderTutorialPage();
    const backButton = screen.getByLabelText('Back to home');
    fireEvent.click(backButton);
    
    expect(window.location.href).toBe('/');
  });

  test('applies background styles', () => {
    renderTutorialPage();
    const styleElement = document.querySelector('style');
    expect(styleElement).toBeInTheDocument();
    expect(styleElement.innerHTML).toContain('overflow-y: auto');
  });
});