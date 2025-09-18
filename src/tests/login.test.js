/**
 * @jest-environment jsdom
 */
jest.mock('../firebase/firebase');
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../react_components/login';
import { loginNormUser } from '../firebase/firebase';

const RouterWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders and handles successful login', async () => {
    loginNormUser.mockResolvedValue();
    
    render(
      <RouterWrapper>
        <Login />
      </RouterWrapper>
    );
    
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    
    fireEvent.change(emailInput, { target: { value: 'test@wits.ac.za' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    
    await waitFor(() => {
      expect(loginNormUser).toHaveBeenCalledWith({
        email: 'test@wits.ac.za',
        password: 'password123'
      });
      expect(mockNavigate).toHaveBeenCalledWith('/');
      // Only keep these if your component actually clears inputs
      // expect(emailInput.value).toBe('');
      // expect(passwordInput.value).toBe('');
    });
  });

  test('handles login error', async () => {
    loginNormUser.mockRejectedValue(new Error('Invalid credentials'));
    
    render(
      <RouterWrapper>
        <Login />
      </RouterWrapper>
    );
    
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'test@wits.ac.za' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrongpassword' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
