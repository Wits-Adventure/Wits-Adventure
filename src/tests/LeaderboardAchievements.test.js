import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LeaderboardAchievements from '../react_components/LeaderboardAchievements';

// 1. Mock the entire Firebase SDK before any other imports
// This is the key change to prevent the 'fetch is not defined' error.
jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn(),
    collection: jest.fn(),
    getDocs: jest.fn(() => ({
        docs: [], // Default mock implementation
    })),
}));

// Mock the Firebase App and Auth to prevent their code from running
jest.mock('firebase/app', () => ({
    initializeApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    sendEmailVerification: jest.fn(),
}));

// Mock Firebase functions that might use fetch internally
jest.mock('../firebase/firebase', () => ({
    // Mock any functions you use from your own firebase.js file
    // For example, if you have a function called fetchUsers:
    fetchUsers: jest.fn(),
}));

describe('LeaderboardAchievements', () => {
    const mockPlayers = [
        { name: 'Player 1', score: 1000, avatar: '/avatar1.png' },
        { name: 'Player 2', score: 800, avatar: '/avatar2.png' },
        { name: 'Player 3', score: 600, avatar: '/avatar3.png' },
        { name: 'Player 4', score: 400, avatar: '/avatar4.png' },
    ];

    const mockAchievements = [
        {
            title: 'First Quest',
            description: 'Complete your first quest',
            current: 1,
            goal: 1,
            reward: 100,
        },
        {
            title: 'Explorer',
            description: 'Visit 5 locations',
            current: 3,
            goal: 5,
            reward: 200,
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        // You can now mock `getDocs` within each test if needed
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders leaderboard tab by default', async () => {
        // Mock getDocs specifically for this test
        require('firebase/firestore').getDocs.mockResolvedValueOnce({
            docs: mockPlayers.map(player => ({ data: () => player })),
        });

        render(<LeaderboardAchievements />);

        expect(screen.getByText('Leaderboard')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText('Player 1')).toBeInTheDocument();
        });
    });

    test('switches to achievements tab when clicked', async () => {
        // Mock getDocs for both player and achievement data fetches
        require('firebase/firestore').getDocs
            .mockResolvedValueOnce({
                docs: mockPlayers.map(player => ({ data: () => player })),
            })
            .mockResolvedValueOnce({
                docs: mockAchievements.map(achievement => ({ data: () => achievement })),
            });

        render(<LeaderboardAchievements />);

        const achievementsButton = screen.getByText('Achievement');
        fireEvent.click(achievementsButton);

        await waitFor(() => {
            expect(screen.getByText('First Quest')).toBeInTheDocument();
            expect(screen.getByText('Explorer')).toBeInTheDocument();
        });
    });

    test('displays top 3 players in podium', async () => {
        // Mock getDocs for this test
        require('firebase/firestore').getDocs.mockResolvedValueOnce({
            docs: mockPlayers.map(player => ({ data: () => player })),
        });

        render(<LeaderboardAchievements />);

        await waitFor(() => {
            const players = screen.getAllByRole('heading', { level: 3 });
            expect(players[0]).toHaveTextContent('Player 1');
            expect(players[1]).toHaveTextContent('Player 2');
            expect(players[2]).toHaveTextContent('Player 3');
        });
    });

    test('displays remaining players in list', async () => {
        // Mock getDocs for this test
        require('firebase/firestore').getDocs.mockResolvedValueOnce({
            docs: mockPlayers.map(player => ({ data: () => player })),
        });

        render(<LeaderboardAchievements />);

        await waitFor(() => {
            expect(screen.getByText('4')).toBeInTheDocument(); // Rank number
            expect(screen.getByText('Player 4')).toBeInTheDocument();
        });
    });

    test('displays achievement progress correctly', async () => {
        // Mock getDocs for both player and achievement data fetches
        require('firebase/firestore').getDocs
            .mockResolvedValueOnce({
                docs: mockPlayers.map(player => ({ data: () => player })),
            })
            .mockResolvedValueOnce({
                docs: mockAchievements.map(achievement => ({ data: () => achievement })),
            });

        render(<LeaderboardAchievements />);

        fireEvent.click(screen.getByText('Achievement'));

        await waitFor(() => {
            const progressBars = screen.getAllByRole('generic', { name: '' })
                .filter(element => element.className === 'progress-fill');

            expect(progressBars[0]).toHaveStyle({ width: '100%' }); // First Quest (1/1)
            expect(progressBars[1]).toHaveStyle({ width: '60%' });  // Explorer (3/5)
        });
    });

    test('handles Firebase errors gracefully', async () => {
        console.error = jest.fn(); // Mock console.error
        require('firebase/firestore').getDocs.mockRejectedValue(new Error('Firebase error'));

        render(<LeaderboardAchievements />);

        await waitFor(() => {
            expect(console.error).toHaveBeenCalled();
            expect(screen.queryByText('Player 1')).not.toBeInTheDocument(); // Ensure no players are rendered
        });
    });
});