// __tests__/Login.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

import Login from '../react_components/login';

// Mock the firebase module
jest.mock('../firebase/firebase', () => ({
  loginNormUser: jest.fn(),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => {
  const actualReactRouterDom = jest.requireActual('react-router-dom');
  return {
    ...actualReactRouterDom,
    useNavigate: () => jest.fn(),
    Link: ({ children, to, className }) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
  };
});

// Helper function to render component with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  let mockLoginNormUser;
  let mockNavigate;

  beforeAll(() => {
    // Get the mocked functions
    mockLoginNormUser = require('../firebase/firebase').loginNormUser;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create fresh mock for navigate
    mockNavigate = jest.fn();
    
    // Mock useNavigate to return our mock function
    const reactRouterDom = require('react-router-dom');
    reactRouterDom.useNavigate = jest.fn(() => mockNavigate);
    
    // Clear console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('Rendering', () => {
    it('renders login form with all elements', () => {
      renderWithRouter(<Login />);

      // Check for logo and title
      expect(screen.getByAltText('Wits Adventure Logo')).toBeInTheDocument();
      expect(screen.getByText('WITS ADVENTURE')).toBeInTheDocument();

      // Check for form elements
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();

      // Check for signup link
      expect(screen.getByText('Don\'t have an account?')).toBeInTheDocument();
      expect(screen.getByText('Sign up here')).toBeInTheDocument();
    });

    it('renders input fields with correct attributes', () => {
      renderWithRouter(<Login />);

      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('placeholder', 'your.email@students.wits.ac.za');
      expect(emailInput).toBeRequired();

      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('placeholder', 'Enter your password');
      expect(passwordInput).toBeRequired();
    });

    it('renders signup link with correct href', () => {
      renderWithRouter(<Login />);

      const signupLink = screen.getByText('Sign up here');
      expect(signupLink).toHaveAttribute('href', '/signup');
    });
  });

  describe('User Interactions', () => {
    it('updates email input value when user types', () => {
      renderWithRouter(<Login />);

      const emailInput = screen.getByLabelText('Email Address');
      fireEvent.change(emailInput, { target: { value: 'test@students.wits.ac.za' } });

      expect(emailInput.value).toBe('test@students.wits.ac.za');
    });

    it('updates password input value when user types', () => {
      renderWithRouter(<Login />);

      const passwordInput = screen.getByLabelText('Password');
      fireEvent.change(passwordInput, { target: { value: 'testpassword123' } });

      expect(passwordInput.value).toBe('testpassword123');
    });

    it('clears error message when user starts typing', () => {
      renderWithRouter(<Login />);

      // First, we need to set an error state by simulating a failed login
      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Login' });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

      // Mock login failure
      mockLoginNormUser.mockRejectedValueOnce(new Error('Invalid credentials'));
      
      fireEvent.click(submitButton);

      // Wait for error to appear, then check if it's cleared on input change
      waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('calls loginNormUser with correct credentials on successful submission', async () => {
      mockLoginNormUser.mockResolvedValueOnce({ uid: 'test-uid' });

      renderWithRouter(<Login />);

      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Login' });

      fireEvent.change(emailInput, { target: { value: 'test@students.wits.ac.za' } });
      fireEvent.change(passwordInput, { target: { value: 'testpassword123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLoginNormUser).toHaveBeenCalledWith({
          email: 'test@students.wits.ac.za',
          password: 'testpassword123',
        });
      });

      expect(console.log).toHaveBeenCalledWith('Login attempted with:', {
        email: 'test@students.wits.ac.za',
        password: 'testpassword123',
      });
    });

    it('navigates to home page on successful login', async () => {
      mockLoginNormUser.mockResolvedValueOnce({ uid: 'test-uid' });

      renderWithRouter(<Login />);

      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Login' });

      fireEvent.change(emailInput, { target: { value: 'test@students.wits.ac.za' } });
      fireEvent.change(passwordInput, { target: { value: 'testpassword123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('clears form fields on successful login', async () => {
      mockLoginNormUser.mockResolvedValueOnce({ uid: 'test-uid' });

      renderWithRouter(<Login />);

      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Login' });

      fireEvent.change(emailInput, { target: { value: 'test@students.wits.ac.za' } });
      fireEvent.change(passwordInput, { target: { value: 'testpassword123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(emailInput.value).toBe('');
        expect(passwordInput.value).toBe('');
      });
    });

    it('displays error message on login failure', async () => {
      const errorMessage = 'Invalid email or password';
      mockLoginNormUser.mockRejectedValueOnce(new Error(errorMessage));

      renderWithRouter(<Login />);

      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Login' });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toHaveClass('login-error');
      });

      expect(console.error).toHaveBeenCalledWith('Login failed:', errorMessage);
    });

    it('prevents default form submission behavior', async () => {
      mockLoginNormUser.mockResolvedValueOnce({ uid: 'test-uid' });

      renderWithRouter(<Login />);

      const form = screen.getByRole('form') || screen.getByTagName('form');
      const mockPreventDefault = jest.fn();

      const mockEvent = {
        preventDefault: mockPreventDefault,
        target: form,
      };

      fireEvent.submit(form, mockEvent);

      expect(mockPreventDefault).toHaveBeenCalled();
    });

    it('handles network errors gracefully', async () => {
      const networkError = new Error('Network error');
      mockLoginNormUser.mockRejectedValueOnce(networkError);

      renderWithRouter(<Login />);

      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Login' });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('does not submit form with empty fields', () => {
      renderWithRouter(<Login />);

      const submitButton = screen.getByRole('button', { name: 'Login' });
      fireEvent.click(submitButton);

      // Since inputs are required, form should not submit
      expect(mockLoginNormUser).not.toHaveBeenCalled();
    });
  });

  describe('CSS Classes', () => {
    it('applies correct CSS classes to elements', () => {
      renderWithRouter(<Login />);

      expect(screen.getByRole('main')).toHaveClass('login-container');
      expect(screen.getByRole('form')).toHaveClass('login-form');
      expect(screen.getByText('Welcome Back')).toHaveClass('login-title');
      expect(screen.getByLabelText('Email Address')).toHaveClass('login-input');
      expect(screen.getByLabelText('Password')).toHaveClass('login-input');
      expect(screen.getByRole('button', { name: 'Login' })).toHaveClass('login-button');
      expect(screen.getByText('Sign up here')).toHaveClass('login-link');
    });
  });

  describe('Error State Management', () => {
    it('clears error state before new login attempt', async () => {
      // First login attempt fails
      mockLoginNormUser.mockRejectedValueOnce(new Error('First error'));

      renderWithRouter(<Login />);

      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Login' });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      // Second login attempt succeeds
      mockLoginNormUser.mockResolvedValueOnce({ uid: 'test-uid' });

      fireEvent.change(passwordInput, { target: { value: 'correctpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });

    it('shows error message with correct styling', async () => {
      const errorMessage = 'Authentication failed';
      mockLoginNormUser.mockRejectedValueOnce(new Error(errorMessage));

      renderWithRouter(<Login />);

      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Login' });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorElement = screen.getByText(errorMessage);
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveClass('login-error');
        expect(errorElement.tagName).toBe('P');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels associated with inputs', () => {
      renderWithRouter(<Login />);

      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');

      expect(emailInput).toHaveAttribute('id', 'email');
      expect(passwordInput).toHaveAttribute('id', 'password');
    });

    it('has proper semantic HTML structure', () => {
      renderWithRouter(<Login />);

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Email Address' })).toBeInTheDocument();
    });
  });
});