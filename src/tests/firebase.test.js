// __tests__/firebase.test.js
import { jest } from '@jest/globals';

// Mock Firebase modules
const mockAuth = {
  currentUser: null,
  signOut: jest.fn(),
};

const mockDb = {};
const mockStorage = {};

const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSendEmailVerification = jest.fn();
const mockSignInWithEmailAndPassword = jest.fn();
const mockDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockServerTimestamp = jest.fn();
const mockGetDoc = jest.fn();
const mockCollection = jest.fn();
const mockAddDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockRef = jest.fn();
const mockUploadBytes = jest.fn();
const mockGetDownloadURL = jest.fn();
const mockInitializeApp = jest.fn();
const mockGetAuth = jest.fn(() => mockAuth);
const mockGetFirestore = jest.fn(() => mockDb);
const mockGetStorage = jest.fn(() => mockStorage);

// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: mockInitializeApp,
}));

jest.mock('firebase/auth', () => ({
  getAuth: mockGetAuth,
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  sendEmailVerification: mockSendEmailVerification,
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: mockGetFirestore,
  doc: mockDoc,
  setDoc: mockSetDoc,
  serverTimestamp: mockServerTimestamp,
  getDoc: mockGetDoc,
  collection: mockCollection,
  addDoc: mockAddDoc,
  getDocs: mockGetDocs,
}));

jest.mock('firebase/storage', () => ({
  getStorage: mockGetStorage,
  ref: mockRef,
  uploadBytes: mockUploadBytes,
  getDownloadURL: mockGetDownloadURL,
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock window.alert
global.alert = jest.fn();

describe('Firebase Module', () => {
  let firebaseModule;
  
  beforeAll(async () => {
    // Import the module after mocks are set up
    firebaseModule = await import('../firebase/firebase.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.currentUser = null;
    global.fetch.mockClear();
    global.alert.mockClear();
  });

  describe('apiRequest', () => {
    it('should make GET request without auth token', async () => {
      const mockResponse = { success: true };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await firebaseModule.apiRequest('/test');

      expect(fetch).toHaveBeenCalledWith(
        'https://waapi-fwhbdfesd7hqdaef.southafricanorth-01.azurewebsites.net/test',
        {
          method: 'GET',
          headers: {},
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include auth token when user is authenticated', async () => {
      const mockToken = 'mock-token';
      const mockUser = {
        getIdToken: jest.fn().mockResolvedValue(mockToken),
      };
      mockAuth.currentUser = mockUser;

      const mockResponse = { success: true };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await firebaseModule.apiRequest('/test');

      expect(fetch).toHaveBeenCalledWith(
        'https://waapi-fwhbdfesd7hqdaef.southafricanorth-01.azurewebsites.net/test',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });

    it('should handle POST request with JSON body', async () => {
      const requestBody = { name: 'test' };
      const mockResponse = { success: true };
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await firebaseModule.apiRequest('/test', 'POST', requestBody);

      expect(fetch).toHaveBeenCalledWith(
        'https://waapi-fwhbdfesd7hqdaef.southafricanorth-01.azurewebsites.net/test',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );
    });

    it('should handle FormData requests', async () => {
      const formData = new FormData();
      const mockResponse = { success: true };
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await firebaseModule.apiRequest('/test', 'POST', formData, true);

      expect(fetch).toHaveBeenCalledWith(
        'https://waapi-fwhbdfesd7hqdaef.southafricanorth-01.azurewebsites.net/test',
        {
          method: 'POST',
          headers: {},
          body: formData,
        }
      );
    });

    it('should throw error for failed requests', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' }),
      });

      await expect(firebaseModule.apiRequest('/test')).rejects.toThrow('Not found');
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await expect(firebaseModule.apiRequest('/test')).rejects.toThrow('Network error');
    });
  });

  describe('signupNormUser', () => {
    const validSignupData = {
      Name: 'Test User',
      Email: 'test@example.com',
      Password: 'password123',
      ConfirmPassword: 'password123',
      Role: 'student',
      LeaderBoardPoints: 0,
    };

    it('should create user successfully', async () => {
      const mockUser = { 
        uid: 'test-uid',
        emailVerified: false 
      };
      
      mockCreateUserWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });
      mockSendEmailVerification.mockResolvedValue();
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      mockSetDoc.mockResolvedValue();

      await firebaseModule.signupNormUser(validSignupData);

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        'test@example.com',
        'password123'
      );
      expect(mockSendEmailVerification).toHaveBeenCalledWith(mockUser);
      expect(global.alert).toHaveBeenCalledWith(
        'Account created! Please check your email for verification.'
      );
    });

    it('should reject if passwords do not match', async () => {
      const invalidData = {
        ...validSignupData,
        ConfirmPassword: 'different-password',
      };

      await expect(firebaseModule.signupNormUser(invalidData)).rejects.toThrow(
        'Passwords do not match'
      );
      expect(global.alert).toHaveBeenCalledWith('Passwords do not match');
    });

    it('should handle Firebase auth errors', async () => {
      const authError = new Error('Email already in use');
      mockCreateUserWithEmailAndPassword.mockRejectedValue(authError);

      await expect(firebaseModule.signupNormUser(validSignupData)).rejects.toThrow(
        'Email already in use'
      );
      expect(global.alert).toHaveBeenCalledWith(
        'Signup failed: Email already in use'
      );
    });
  });

  describe('loginNormUser', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully when email is verified', async () => {
      const mockUser = {
        uid: 'test-uid',
        emailVerified: true,
      };
      
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });

      const result = await firebaseModule.loginNormUser(validLoginData);

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        'test@example.com',
        'password123'
      );
      expect(global.alert).toHaveBeenCalledWith('Login successful!');
      expect(result).toBe(mockUser);
    });

    it('should reject login for unverified email', async () => {
      const mockUser = {
        uid: 'test-uid',
        emailVerified: false,
      };
      
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });
      mockAuth.signOut = jest.fn().mockResolvedValue();

      await expect(firebaseModule.loginNormUser(validLoginData)).rejects.toThrow(
        'Email not verified'
      );
      
      expect(global.alert).toHaveBeenCalledWith(
        'Please verify your email before logging in.'
      );
      expect(mockAuth.signOut).toHaveBeenCalled();
    });

    it('should handle login errors', async () => {
      const authError = new Error('Invalid credentials');
      mockSignInWithEmailAndPassword.mockRejectedValue(authError);

      await expect(firebaseModule.loginNormUser(validLoginData)).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('getUserData', () => {
    it('should fetch user data successfully', async () => {
      const mockUser = {
        uid: 'test-uid',
        getIdToken: jest.fn().mockResolvedValue('mock-token'),
      };
      mockAuth.currentUser = mockUser;

      const mockUserData = {
        Name: 'Test User',
        Email: 'test@example.com',
        Role: 'student',
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUserData),
      });

      const result = await firebaseModule.getUserData();

      expect(result).toEqual(mockUserData);
      expect(fetch).toHaveBeenCalledWith(
        'https://waapi-fwhbdfesd7hqdaef.southafricanorth-01.azurewebsites.net/api/users/test-uid',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        })
      );
    });

    it('should throw error when user is not authenticated', async () => {
      mockAuth.currentUser = null;

      await expect(firebaseModule.getUserData()).rejects.toThrow(
        'User is not authenticated'
      );
    });
  });

  describe('getUserName', () => {
    it('should return user name', async () => {
      const mockUser = {
        uid: 'test-uid',
        getIdToken: jest.fn().mockResolvedValue('mock-token'),
      };
      mockAuth.currentUser = mockUser;

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ Name: 'Test User' }),
      });

      const result = await firebaseModule.getUserName();

      expect(result).toBe('Test User');
    });

    it('should return null on error', async () => {
      mockAuth.currentUser = null;

      const result = await firebaseModule.getUserName();

      expect(result).toBeNull();
    });
  });

  describe('getUserRole', () => {
    it('should return user role', async () => {
      const mockUser = {
        uid: 'test-uid',
        getIdToken: jest.fn().mockResolvedValue('mock-token'),
      };
      mockAuth.currentUser = mockUser;

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ Role: 'student' }),
      });

      const result = await firebaseModule.getUserRole();

      expect(result).toBe('student');
    });
  });

  describe('uploadImage', () => {
    it('should upload image successfully', async () => {
      const mockUser = {
        getIdToken: jest.fn().mockResolvedValue('mock-token'),
      };
      mockAuth.currentUser = mockUser;

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockImageUrl = 'https://example.com/image.jpg';

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ imageUrl: mockImageUrl }),
      });

      const result = await firebaseModule.uploadImage(mockFile);

      expect(result).toBe(mockImageUrl);
      expect(fetch).toHaveBeenCalledWith(
        'https://waapi-fwhbdfesd7hqdaef.southafricanorth-01.azurewebsites.net/api/upload/image',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        })
      );
    });

    it('should throw error when user is not authenticated', async () => {
      mockAuth.currentUser = null;
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await expect(firebaseModule.uploadImage(mockFile)).rejects.toThrow(
        'User is not authenticated. Cannot upload image.'
      );
    });
  });

  describe('logout', () => {
    it('should call auth.signOut', () => {
      firebaseModule.logout();
      expect(mockAuth.signOut).toHaveBeenCalled();
    });
  });
});

