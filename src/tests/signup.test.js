// __tests__/signup.test.js

// Mock fetch BEFORE any imports that might use it
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    status: 200,
  })
);

// Mock Firebase modules before importing
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
  createUserWithEmailAndPassword: jest.fn(),
  sendEmailVerification: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

// Mock the firebase module
jest.mock('../firebase/firebase', () => ({
  signupNormUser: jest.fn(),
  apiRequest: jest.fn(),
}));

// Mock CSS and image imports
jest.mock('../css/Signup.css', () => ({}));
jest.mock('../media/LOGO_Alpha.png', () => 'logo.png');

// Mock react-router-dom
jest.mock('react-router-dom', () => {
  const actualReactRouterDom = jest.requireActual('react-router-dom');
  return {
    ...actualReactRouterDom,
    useNavigate: () => jest.fn(),
  };
});

// Now import React modules
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Signup from '../react_components/signup';

const renderSignup = () => {
  return render(
    <BrowserRouter>
      <Signup />
    </BrowserRouter>
  );
};

describe('Signup Component', () => {
  let mockSignupNormUser;
  let mockNavigate;

  beforeAll(() => {
    // Get the mocked functions
    mockSignupNormUser = require('../firebase/firebase').signupNormUser;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create fresh mock for navigate
    mockNavigate = jest.fn();
    
    // Mock useNavigate to return our mock function
    const reactRouterDom = require('react-router-dom');
    reactRouterDom.useNavigate = jest.fn(() => mockNavigate);
    
    // Reset fetch mock
    global.fetch.mockClear();
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
      status: 200,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders signup form with all elements', () => {
      renderSignup();
      
      expect(screen.getByText('Create an Account')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('your.email@students.wits.ac.za')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
    });

    it('renders all required form fields', () => {
      renderSignup();
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      const emailInput = screen.getByPlaceholderText('your.email@students.wits.ac.za');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
      
      expect(usernameInput).toBeRequired();
      expect(emailInput).toBeRequired();
      expect(passwordInput).toBeRequired();
      expect(confirmPasswordInput).toBeRequired();
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Validation', () => {
    it('validates Wits email format', async () => {
      renderSignup();
      
      fireEvent.change(screen.getByPlaceholderText('Enter your username'), { 
        target: { value: 'testuser' } 
      });
      fireEvent.change(screen.getByPlaceholderText('your.email@students.wits.ac.za'), { 
        target: { value: 'test@gmail.com' } 
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), { 
        target: { value: 'password123' } 
      });
      fireEvent.change(screen.getByPlaceholderText('Confirm your password'), { 
        target: { value: 'password123' } 
      });
      
      fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
      
      await waitFor(() => {
        expect(screen.getByText('Please use your Wits student email.')).toBeInTheDocument();
      });
      
      // Should not call signupNormUser for invalid email
      expect(mockSignupNormUser).not.toHaveBeenCalled();
    });

    it('validates password match', async () => {
      renderSignup();
      
      fireEvent.change(screen.getByPlaceholderText('Enter your username'), { 
        target: { value: 'testuser' } 
      });
      fireEvent.change(screen.getByPlaceholderText('your.email@students.wits.ac.za'), { 
        target: { value: 'test@students.wits.ac.za' } 
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), { 
        target: { value: 'password1' } 
      });
      fireEvent.change(screen.getByPlaceholderText('Confirm your password'), { 
        target: { value: 'password2' } 
      });
      
      fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
      
      await waitFor(() => {
        expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
      });
      
      // Should not call signupNormUser for mismatched passwords
      expect(mockSignupNormUser).not.toHaveBeenCalled();
    });

    it('accepts valid Wits email formats', async () => {
      const validEmails = [
        'test@students.wits.ac.za',
        'john.doe@students.wits.ac.za',
        'student123@students.wits.ac.za'
      ];

      for (const email of validEmails) {
        mockSignupNormUser.mockResolvedValueOnce();
        
        renderSignup();
        
        fireEvent.change(screen.getByPlaceholderText('Enter your username'), { 
          target: { value: 'testuser' } 
        });
        fireEvent.change(screen.getByPlaceholderText('your.email@students.wits.ac.za'), { 
          target: { value: email } 
        });
        fireEvent.change(screen.getByPlaceholderText('Enter your password'), { 
          target: { value: 'password123' } 
        });
        fireEvent.change(screen.getByPlaceholderText('Confirm your password'), { 
          target: { value: 'password123' } 
        });
        
        fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
        
        await waitFor(() => {
          expect(mockSignupNormUser).toHaveBeenCalled();
        });
        
        // Clean up for next iteration
        mockSignupNormUser.mockClear();
        screen.unmount?.();
      }
    });

    it('shows error for empty fields', async () => {
      renderSignup();
      
      fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
      
      // HTML5 validation should prevent submission
      expect(mockSignupNormUser).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('submits form successfully with valid data', async () => {
      mockSignupNormUser.mockResolvedValueOnce();
      
      renderSignup();
      
      fireEvent.change(screen.getByPlaceholderText('Enter your username'), { 
        target: { value: 'testuser' } 
      });
      fireEvent.change(screen.getByPlaceholderText('your.email@students.wits.ac.za'), { 
        target: { value: 'test@students.wits.ac.za' } 
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), { 
        target: { value: 'password123' } 
      });
      fireEvent.change(screen.getByPlaceholderText('Confirm your password'), { 
        target: { value: 'password123' } 
      });
      
      fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
      
      await waitFor(() => {
        expect(mockSignupNormUser).toHaveBeenCalledWith({
          Name: 'testuser',
          Email: 'test@students.wits.ac.za',
          Password: 'password123',
          ConfirmPassword: 'password123',
          Role: 'student',
          LeaderBoardPoints: 0,
        });
      });
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('handles signup error gracefully', async () => {
      const errorMessage = 'Email already exists';
      mockSignupNormUser.mockRejectedValueOnce(new Error(errorMessage));
      
      renderSignup();
      
      fireEvent.change(screen.getByPlaceholderText('Enter your username'), { 
        target: { value: 'testuser' } 
      });
      fireEvent.change(screen.getByPlaceholderText('your.email@students.wits.ac.za'), { 
        target: { value: 'test@students.wits.ac.za' } 
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), { 
        target: { value: 'password123' } 
      });
      fireEvent.change(screen.getByPlaceholderText('Confirm your password'), { 
        target: { value: 'password123' } 
      });
      
      fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
      
      // Should not navigate on error
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('disables submit button during submission', async () => {
      // Create a promise that we can control
      let resolveSignup;
      const signupPromise = new Promise((resolve) => {
        resolveSignup = resolve;
      });
      mockSignupNormUser.mockReturnValueOnce(signupPromise);
      
      renderSignup();
      
      fireEvent.change(screen.getByPlaceholderText('Enter your username'), { 
        target: { value: 'testuser' } 
      });
      fireEvent.change(screen.getByPlaceholderText('your.email@students.wits.ac.za'), { 
        target: { value: 'test@students.wits.ac.za' } 
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), { 
        target: { value: 'password123' } 
      });
      fireEvent.change(screen.getByPlaceholderText('Confirm your password'), { 
        target: { value: 'password123' } 
      });
      
      const submitButton = screen.getByRole('button', { name: 'Sign Up' });
      fireEvent.click(submitButton);
      
      // Button should be disabled during submission
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
      
      // Resolve the promise
      resolveSignup();
      
      // Button should be enabled again after submission
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('User Interactions', () => {
    it('updates input values when user types', () => {
      renderSignup();
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      const emailInput = screen.getByPlaceholderText('your.email@students.wits.ac.za');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
      
      fireEvent.change(usernameInput, { target: { value: 'newuser' } });
      fireEvent.change(emailInput, { target: { value: 'new@students.wits.ac.za' } });
      fireEvent.change(passwordInput, { target: { value: 'newpass' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'newpass' } });
      
      expect(usernameInput.value).toBe('newuser');
      expect(emailInput.value).toBe('new@students.wits.ac.za');
      expect(passwordInput.value).toBe('newpass');
      expect(confirmPasswordInput.value).toBe('newpass');
    });

    it('clears error messages when user starts typing', async () => {
      renderSignup();
      
      // First create an error
      fireEvent.change(screen.getByPlaceholderText('Enter your username'), { 
        target: { value: 'test' } 
      });
      fireEvent.change(screen.getByPlaceholderText('your.email@students.wits.ac.za'), { 
        target: { value: 'invalid@gmail.com' } 
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), { 
        target: { value: 'password' } 
      });
      fireEvent.change(screen.getByPlaceholderText('Confirm your password'), { 
        target: { value: 'password' } 
      });
      
      fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
      
      await waitFor(() => {
        expect(screen.getByText('Please use your Wits student email.')).toBeInTheDocument();
      });
      
      // Now type in a field to clear the error
      fireEvent.change(screen.getByPlaceholderText('your.email@students.wits.ac.za'), { 
        target: { value: 'valid@students.wits.ac.za' } 
      });
      
      // Error should be cleared
      expect(screen.queryByText('Please use your Wits student email.')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      mockSignupNormUser.mockRejectedValueOnce(new Error('Network error'));
      
      renderSignup();
      
      fireEvent.change(screen.getByPlaceholderText('Enter your username'), { 
        target: { value: 'testuser' } 
      });
      fireEvent.change(screen.getByPlaceholderText('your.email@students.wits.ac.za'), { 
        target: { value: 'test@students.wits.ac.za' } 
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), { 
        target: { value: 'password123' } 
      });
      fireEvent.change(screen.getByPlaceholderText('Confirm your password'), { 
        target: { value: 'password123' } 
      });
      
      fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('trims whitespace from inputs', async () => {
      mockSignupNormUser.mockResolvedValueOnce();
      
      renderSignup();
      
      fireEvent.change(screen.getByPlaceholderText('Enter your username'), { 
        target: { value: '  testuser  ' } 
      });
      fireEvent.change(screen.getByPlaceholderText('your.email@students.wits.ac.za'), { 
        target: { value: '  test@students.wits.ac.za  ' } 
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), { 
        target: { value: 'password123' } 
      });
      fireEvent.change(screen.getByPlaceholderText('Confirm your password'), { 
        target: { value: 'password123' } 
      });
      
      fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
      
      await waitFor(() => {
        expect(mockSignupNormUser).toHaveBeenCalledWith({
          Name: 'testuser',
          Email: 'test@students.wits.ac.za',
          Password: 'password123',
          ConfirmPassword: 'password123',
          Role: 'student',
          LeaderBoardPoints: 0,
        });
      });
    });
  });
});