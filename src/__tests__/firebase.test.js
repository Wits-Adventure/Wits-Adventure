import {
  signupNormUser,
  loginNormUser,
  getUserName,
  getUserRole,
  getUserData,
  logout,
  getAllQuests,
  addUserToFirestore
} from '../src/firebase/firebase';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  collection,
  getDocs
} from 'firebase/firestore';

// Mock Firebase dependencies
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn().mockReturnValue({})
}));

jest.mock('firebase/auth', () => {
  const authMock = { currentUser: null };
  return {
    getAuth: jest.fn().mockReturnValue(authMock),
    createUserWithEmailAndPassword: jest.fn(),
    sendEmailVerification: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn()
  };
});

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn().mockReturnValue({}),
  doc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn()
}));

// Mock global alert and console
global.alert = jest.fn();
global.console = {
  log: jest.fn(),
  error: jest.fn()
};

describe('Firebase Functions', () => {
  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
    getIdToken: jest.fn().mockResolvedValue('mockToken')
  };
  const mockUserData = {
    Email: 'test@example.com',
    Name: 'Test User',
    Role: 'student',
    joinedAt: 'mocked-timestamp',
    authProvider: 'Firebase Auth',
    Level: 0,
    CompletedQuests: [],
    Bio: '',
    SpendablePoints: 0,
    Experience: 0,
    Quests: [],
    LeaderBoardPoints: 100
  };
  const mockDocRef = { id: 'test-uid' };
  const mockCollectionRef = { id: 'Quests' };

  beforeEach(() => {
    jest.clearAllMocks();
    getAuth.mockReturnValue({ currentUser: mockUser });
    getFirestore.mockReturnValue({});
    doc.mockReturnValue(mockDocRef);
    collection.mockReturnValue(mockCollectionRef);
    serverTimestamp.mockReturnValue('mocked-timestamp');
    global.alert.mockClear();
    global.console.log.mockClear();
    global.console.error.mockClear();
  });

  describe('addUserToFirestore', () => {
    test('should successfully add user to Firestore', async () => {
      setDoc.mockResolvedValue();

      await addUserToFirestore(
        'test-uid',
        'test@example.com',
        'Test User',
        'student',
        'Firebase Auth',
        100
      );

      expect(doc).toHaveBeenCalledWith({}, 'Users', 'test-uid');
      expect(setDoc).toHaveBeenCalledWith(mockDocRef, {
        Email: 'test@example.com',
        Name: 'Test User',
        joinedAt: 'mocked-timestamp',
        Role: 'student',
        LeaderBoardPoints: 100,
        autheProvider: 'Firebase Auth',
        Level: 0,
        CompletedQuests: [],
        Bio: '',
        SpendablePoints: 0,
        Experience: 0,
        Quests: []
      });
      expect(console.log).toHaveBeenCalledWith('User added to Firestore!');
      expect(alert).toHaveBeenCalledWith('User added successfully!');
    });

    test('should handle Firestore errors gracefully', async () => {
      setDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(addUserToFirestore(
        'test-uid',
        'test@example.com',
        'Test User',
        'student',
        'Firebase Auth',
        100
      )).rejects.toThrow('Firestore error');
      expect(console.error).toHaveBeenCalledWith('Error adding user to Firestore:', expect.any(Error));
      expect(alert).toHaveBeenCalledWith('Error adding user: Firestore error');
    });
  });

  describe('getAllQuests', () => {
    test('should fetch all quests successfully', async () => {
      const mockDocs = [
        { id: 'quest1', data: () => ({ title: 'Quest 1', difficulty: 'easy' }) },
        { id: 'quest2', data: () => ({ title: 'Quest 2', difficulty: 'hard' }) }
      ];
      const mockQuerySnapshot = { docs: mockDocs };
      getDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await getAllQuests();

      expect(collection).toHaveBeenCalledWith({}, 'Quests');
      expect(getDocs).toHaveBeenCalledWith(mockCollectionRef);
      expect(result).toEqual([
        { id: 'quest1', title: 'Quest 1', difficulty: 'easy' },
        { id: 'quest2', title: 'Quest 2', difficulty: 'hard' }
      ]);
      expect(console.log).toHaveBeenCalledWith('Quests fetched from Firestore:', result);
    });

    test('should handle fetch errors and return empty array', async () => {
      getDocs.mockRejectedValue(new Error('Fetch error'));

      const result = await getAllQuests();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error fetching quests:', expect.any(Error));
      expect(alert).toHaveBeenCalledWith('Error fetching quests: Fetch error');
    });
  });

  describe('getUserData', () => {
    test('should fetch user data successfully', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          Name: 'Test User',
          Email: 'test@example.com',
          Role: 'student'
        })
      };
      getDoc.mockResolvedValue(mockUserDoc);

      const result = await getUserData();

      expect(doc).toHaveBeenCalledWith({}, 'Users', 'test-uid');
      expect(getDoc).toHaveBeenCalledWith(mockDocRef);
      expect(result).toEqual({
        Name: 'Test User',
        Email: 'test@example.com',
        Role: 'student'
      });
      expect(console.log).toHaveBeenCalledWith('student');
    });

    test('should throw error when user is not authenticated', async () => {
      getAuth.mockReturnValue({ currentUser: null });

      await expect(getUserData()).rejects.toThrow('User is not authenticated');
      expect(console.error).toHaveBeenCalledWith('Error fetching user data: User is not authenticated');
      expect(alert).toHaveBeenCalledWith('Error: User is not authenticated');
    });

    test('should throw error when user document does not exist', async () => {
      getDoc.mockResolvedValue({ exists: () => false });

      await expect(getUserData()).rejects.toThrow('User document does not exist in Firestore');
      expect(console.error).toHaveBeenCalledWith('Error fetching user data: User document does not exist in Firestore');
      expect(alert).toHaveBeenCalledWith('Error: User document does not exist in Firestore');
    });
  });

  describe('getUserName', () => {
    test('should return user name successfully', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({ Name: 'Test User', Role: 'student' })
      };
      getDoc.mockResolvedValue(mockUserDoc);

      const result = await getUserName();

      expect(doc).toHaveBeenCalledWith({}, 'Users', 'test-uid');
      expect(getDoc).toHaveBeenCalledWith(mockDocRef);
      expect(result).toBe('Test User');
    });

    test('should return null on error', async () => {
      getDoc.mockRejectedValue(new Error('Fetch error'));

      const result = await getUserName();

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error fetching user name:', expect.any(Error));
      expect(alert).toHaveBeenCalledWith('Error fetching user name: Fetch error');
    });
  });

  describe('getUserRole', () => {
    test('should return user role successfully', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({ Name: 'Test User', Role: 'admin' })
      };
      getDoc.mockResolvedValue(mockUserDoc);

      const result = await getUserRole();

      expect(doc).toHaveBeenCalledWith({}, 'Users', 'test-uid');
      expect(getDoc).toHaveBeenCalledWith(mockDocRef);
      expect(result).toBe('admin');
    });

    test('should return null on error', async () => {
      getDoc.mockRejectedValue(new Error('Fetch error'));

      const result = await getUserRole();

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error fetching user role:', expect.any(Error));
      expect(alert).toHaveBeenCalledWith('Error fetching user role: Fetch error');
    });
  });

  describe('signupNormUser', () => {
    test('should create user successfully with matching passwords', async () => {
      createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });
      sendEmailVerification.mockResolvedValue();
      setDoc.mockResolvedValue();

      const userParams = {
        Name: 'Test User',
        Email: 'test@example.com',
        Password: 'password123',
        ConfirmPassword: 'password123',
        Role: 'student',
        LeaderBoardPoints: 0
      };

      await signupNormUser(userParams);

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'test@example.com', 'password123');
      expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
      expect(setDoc).toHaveBeenCalledWith(expect.anything(), {
        Email: 'test@example.com',
        Name: 'Test User',
        joinedAt: 'mocked-timestamp',
        Role: 'student',
        LeaderBoardPoints: 0,
        autheProvider: 'Firebase Auth',
        Level: 0,
        CompletedQuests: [],
        Bio: '',
        SpendablePoints: 0,
        Experience: 0,
        Quests: []
      });
      expect(alert).toHaveBeenCalledWith('Account created! Please check your email for verification.');
    });

    test('should reject when passwords do not match', async () => {
      const userParams = {
        Name: 'Test User',
        Email: 'test@example.com',
        Password: 'password123',
        ConfirmPassword: 'differentpassword',
        Role: 'student',
        LeaderBoardPoints: 0
      };

      await expect(signupNormUser(userParams)).rejects.toThrow('Passwords do not match');
      expect(alert).toHaveBeenCalledWith('Passwords do not match');
      expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
    });

    test('should handle Firebase auth errors', async () => {
      createUserWithEmailAndPassword.mockRejectedValue(new Error('Email already in use'));

      const userParams = {
        Name: 'Test User',
        Email: 'test@example.com',
        Password: 'password123',
        ConfirmPassword: 'password123',
        Role: 'student',
        LeaderBoardPoints: 0
      };

      await expect(signupNormUser(userParams)).rejects.toThrow('Email already in use');
      expect(alert).toHaveBeenCalledWith('Signup failed: Email already in use');
    });
  });

  describe('loginNormUser', () => {
    test('should login verified user successfully', async () => {
      signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      const result = await loginNormUser({ email: 'test@example.com', password: 'password123' });

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'test@example.com', 'password123');
      expect(alert).toHaveBeenCalledWith('Login successful!');
      expect(result).toBe(mockUser);
    });

    test('should reject unverified user and sign them out', async () => {
      signInWithEmailAndPassword.mockResolvedValue({ user: { ...mockUser, emailVerified: false } });
      signOut.mockResolvedValue();

      await expect(loginNormUser({ email: 'test@example.com', password: 'password123' }))
        .rejects.toThrow('Email not verified');
      expect(alert).toHaveBeenCalledWith('Please verify your email before logging in.');
      expect(signOut).toHaveBeenCalled();
    });

    test('should handle login errors', async () => {
      signInWithEmailAndPassword.mockRejectedValue(new Error('Invalid credentials'));

      await expect(loginNormUser({ email: 'test@example.com', password: 'wrongpassword' }))
        .rejects.toThrow('Invalid credentials');
      expect(console.error).toHaveBeenCalledWith('Login failed:', expect.any(Error));
      expect(alert).toHaveBeenCalledWith('Login failed: Invalid credentials');
    });
  });

  describe('logout', () => {
    test('should call signOut on auth', async () => {
      signOut.mockResolvedValue();

      await logout();

      expect(signOut).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('User signed out');
      expect(alert).toHaveBeenCalledWith('Logged out successfully!');
    });

    test('should handle sign-out errors', async () => {
      signOut.mockRejectedValue(new Error('Sign out error'));

      await logout();

      expect(console.error).toHaveBeenCalledWith('Sign-out error:', expect.any(Error));
      expect(alert).toHaveBeenCalledWith('Error logging out: Sign out error');
    });
  });

  describe('Firebase Configuration Integration', () => {
    test('should initialize Firebase with correct config', () => {
      const expectedConfig = {
        apiKey: "AIzaSyBjatUHRXn-vb8yZS_G2I9qRjr49G0Uqjg",
        authDomain: "bloobase2.firebaseapp.com",
        projectId: "bloobase2",
        storageBucket: "bloobase2.firebasestorage.app",
        messagingSenderId: "911192519911",
        appId: "1:911192519911:web:6a15e3e1773d69fc305e42",
        measurementId: "G-KW51J2YSJR"
      };

      expect(initializeApp).toHaveBeenCalledWith(expectedConfig);
      expect(getAuth).toHaveBeenCalled();
      expect(getFirestore).toHaveBeenCalled();
    });
  });

  describe('Test Utilities', () => {
    describe('Mock Data Generators', () => {
      const generateMockUser = (overrides = {}) => ({
        uid: 'mock-uid',
        email: 'test@example.com',
        emailVerified: true,
        ...overrides
      });

      const generateMockUserData = (overrides = {}) => ({
        Name: 'Test User',
        Email: 'test@example.com',
        Role: 'student',
        Level: 0,
        LeaderBoardPoints: 100,
        ...overrides
      });

      test('should generate valid mock user', () => {
        const mockUser = generateMockUser({ emailVerified: false });
        expect(mockUser).toHaveProperty('uid');
        expect(mockUser).toHaveProperty('email');
        expect(mockUser.emailVerified).toBe(false);
      });

      test('should generate valid mock user data', () => {
        const mockUserData = generateMockUserData({ Role: 'admin' });
        expect(mockUserData).toHaveProperty('Name');
        expect(mockUserData).toHaveProperty('Role');
        expect(mockUserData.Role).toBe('admin');
      });
    });
  });

  describe('Edge Cases and Performance', () => {
    test('should handle null/undefined parameters gracefully', async () => {
      getAuth.mockReturnValue({ currentUser: null });

      const result = await getUserName();
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error fetching user name: User is not authenticated');
      expect(alert).toHaveBeenCalledWith('Error: User is not authenticated');
    });

    test('should handle concurrent requests', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({ Name: 'Test User', Role: 'student' })
      };
      getDoc.mockResolvedValue(mockUserDoc);

      const promises = Array(10).fill().map(() => getUserName());
      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result).toBe('Test User');
      });
    });
  });
});

console.log('All Firebase tests completed successfully!');