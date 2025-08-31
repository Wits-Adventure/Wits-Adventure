import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../react_components/protectedRoute';
import { useAuth } from '../context/AuthContext';
import { getUserData } from '../firebase/firebase';

// Mock the AuthContext hook
jest.mock('../context/AuthContext', () => ({
    useAuth: jest.fn()
}));

// Mock the Firebase function
jest.mock('../firebase/firebase', () => ({
    getUserData: jest.fn()
}));

// Test component to act as a child of ProtectedRoute
const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;

describe('ProtectedRoute', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.error = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should show loading state initially', async () => {
        useAuth.mockReturnValue({ currentUser: { uid: 'test-uid' } });
        getUserData.mockImplementation(() => new Promise((resolve) => {
            setTimeout(() => resolve({ Role: 'user' }), 100);
        }));

        render(
            <MemoryRouter>
                <ProtectedRoute>
                    <TestComponent />
                </ProtectedRoute>
            </MemoryRouter>
        );

        expect(screen.getByText('Loading...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });
    });

    it('should redirect to login when user is not authenticated', async () => {
        useAuth.mockReturnValue({ currentUser: null });

        render(
            <MemoryRouter>
                <ProtectedRoute>
                    <TestComponent />
                </ProtectedRoute>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
        });
    });

    it('should render children when user is authenticated without role requirement', async () => {
        useAuth.mockReturnValue({ currentUser: { uid: 'test-uid' } });
        getUserData.mockResolvedValue({ Role: 'user' });

        render(
            <MemoryRouter>
                <ProtectedRoute>
                    <TestComponent />
                </ProtectedRoute>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
    });

    it('should handle non-existing user data', async () => {
        useAuth.mockReturnValue({ currentUser: { uid: 'test-uid' } });
        getUserData.mockResolvedValue(null);

        render(
            <MemoryRouter>
                <ProtectedRoute requiredRole="admin">
                    <TestComponent />
                </ProtectedRoute>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/unauthorized');
        });
    });

    it('should handle getUserData error with specific error message', async () => {
        useAuth.mockReturnValue({ currentUser: { uid: 'test-uid' } });
        const testError = new Error('User document does not exist in Firestore');
        getUserData.mockRejectedValue(testError);

        render(
            <MemoryRouter>
                <ProtectedRoute requiredRole="admin">
                    <TestComponent />
                </ProtectedRoute>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith('Failed to fetch user role:', testError);
            expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/unauthorized');
        });
    });

    it('should handle role mismatch', async () => {
        useAuth.mockReturnValue({ currentUser: { uid: 'test-uid' } });
        getUserData.mockResolvedValue({ Role: 'student' });

        render(
            <MemoryRouter>
                <ProtectedRoute requiredRole="admin">
                    <TestComponent />
                </ProtectedRoute>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/unauthorized');
        });
    });
});