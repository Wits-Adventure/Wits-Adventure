// firebase.test.js
import {
  signupNormUser,
  loginNormUser,
  addUserToFirestore,
  getUserName,
  getUserRole,
  getUserData,
  logout,
} from "../firebase/firebase";
import { auth } from "../firebase/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  setDoc,
  getDoc,
  doc,
} from "firebase/firestore";

// 🔹 Mock Firebase auth and firestore
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  sendEmailVerification: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  serverTimestamp: jest.fn(() => "mock-timestamp"),
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock("../firebase/firebase", () => {
  return {
    __esModule: true,
    ...jest.requireActual("../firebase/firebase"),
    auth: {
      currentUser: { uid: "mockUserId", emailVerified: true },
      signOut: jest.fn(),
    },
  };
});

beforeAll(() => {
  global.alert = jest.fn();
});


describe("Firebase Service Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addUserToFirestore", () => {
    it("should call setDoc with correct data", async () => {
      doc.mockReturnValue("mockDocRef");

      await addUserToFirestore("123", "test@example.com", "Alice", "user", "Firebase Auth", 50);

      expect(setDoc).toHaveBeenCalledWith("mockDocRef", expect.objectContaining({
        Email: "test@example.com",
        Name: "Alice",
        Role: "user",
        LeaderBoardPoints: 50,
        Level: 0,
      }));
    });
  });

  describe("getUserData", () => {
    it("should throw error if user not authenticated", async () => {
      // simulate no user
      require("../firebase/firebase").auth.currentUser = null;

      await expect(getUserData()).rejects.toThrow("User is not authenticated");
    });

    it("should return user data when doc exists", async () => {
      require("../firebase/firebase").auth.currentUser = { uid: "mockUserId" };
      doc.mockReturnValue("mockDocRef");
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ Name: "Alice", Role: "Admin" }),
      });

      const result = await getUserData();
      expect(result).toEqual({ Name: "Alice", Role: "Admin" });
    });
  });

  describe("getUserName & getUserRole", () => {
    it("should return Name", async () => {
      require("../firebase/firebase").auth.currentUser = { uid: "mockUserId" };
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ Name: "Alice", Role: "Admin" }),
      });

      const name = await getUserName();
      expect(name).toBe("Alice");
    });

    it("should return Role", async () => {
      require("../firebase/firebase").auth.currentUser = { uid: "mockUserId" };
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ Name: "Alice", Role: "Admin" }),
      });

      const role = await getUserRole();
      expect(role).toBe("Admin");
    });
  });

  describe("signupNormUser", () => {
    it("should reject if passwords do not match", async () => {
      await expect(signupNormUser({
        Name: "Test",
        Email: "test@example.com",
        Password: "123",
        ConfirmPassword: "456",
        Role: "user",
        LeaderBoardPoints: 0,
      })).rejects.toThrow("Passwords do not match");
    });

    it("should create user and call sendEmailVerification", async () => {
      const mockUser = { uid: "123", emailVerified: false };
      createUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
      sendEmailVerification.mockResolvedValueOnce();

      await signupNormUser({
        Name: "Test",
        Email: "test@example.com",
        Password: "123",
        ConfirmPassword: "123",
        Role: "user",
        LeaderBoardPoints: 0,
      });

      expect(createUserWithEmailAndPassword).toHaveBeenCalled();
      expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
    });
  });

  describe("loginNormUser", () => {
    it("should throw if email not verified", async () => {
      const mockUser = { emailVerified: false };
      signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });

      await expect(loginNormUser({ email: "test@example.com", password: "123" }))
        .rejects.toThrow("Email not verified");

      expect(auth.signOut).toHaveBeenCalled();
    });

    it("should return user if login successful", async () => {
      const mockUser = { emailVerified: true };
      signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });

      const result = await loginNormUser({ email: "test@example.com", password: "123" });
      expect(result).toEqual(mockUser);
    });
  });

  describe("logout", () => {
    it("should call auth.signOut", () => {
      logout();
      expect(auth.signOut).toHaveBeenCalled();
    });
  });
});
