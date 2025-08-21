const {
  signupNormUser,
  loginNormUser,
  addUserToFirestore,
  getUserData,
  getUserName,
  getUserRole,
  logout,
  getAllQuests,
} = require("../firebase/firebase");

const { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, doc, setDoc, getDoc, getDocs, collection } = require("firebase/firestore");

// Mock Firebase methods
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({
    signOut: jest.fn().mockResolvedValue(),
    currentUser: { uid: "123" },
  })),
  createUserWithEmailAndPassword: jest.fn(),
  sendEmailVerification: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(() => "mock-doc"),
  setDoc: jest.fn().mockResolvedValue(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  collection: jest.fn(() => "mock-collection"),
  serverTimestamp: jest.fn(() => "mock-timestamp"),
}));

// Mock console.log and console.error to suppress output
jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

// Mock alert for Node environment
global.alert = jest.fn();

describe("Firebase helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.alert.mockClear();
  });

  describe("signupNormUser", () => {
    test("should reject if passwords do not match", async () => {
      await expect(
        signupNormUser({
          Name: "Tetelo",
          Email: "test@example.com",
          Password: "1234",
          ConfirmPassword: "abcd",
          Role: "user",
          LeaderBoardPoints: 0,
        })
      ).rejects.toThrow("Passwords do not match");
      expect(global.alert).toHaveBeenCalledWith("Passwords do not match");
    });

    test("should create user, send verification, and add to Firestore", async () => {
      const mockUser = { uid: "123", email: "test@example.com", emailVerified: false };
      createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });
      sendEmailVerification.mockResolvedValue();
      const addUserToFirestoreMock = jest.spyOn(require("../src/firebase/firebase"), "addUserToFirestore").mockResolvedValue();

      await signupNormUser({
        Name: "Tetelo",
        Email: "test@example.com",
        Password: "1234",
        ConfirmPassword: "1234",
        Role: "user",
        LeaderBoardPoints: 10,
      });

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), "test@example.com", "1234");
      expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
      expect(addUserToFirestoreMock).toHaveBeenCalledWith("123", "test@example.com", "Tetelo", "user", "Firebase Auth", 10);
      expect(global.alert).toHaveBeenCalledWith("Account created! Please check your email for verification.");
      addUserToFirestoreMock.mockRestore();
    });

    test("should throw error on signup failure", async () => {
      const error = new Error("Signup error");
      createUserWithEmailAndPassword.mockRejectedValue(error);
      await expect(
        signupNormUser({
          Name: "Tetelo",
          Email: "test@example.com",
          Password: "1234",
          ConfirmPassword: "1234",
          Role: "user",
          LeaderBoardPoints: 10,
        })
      ).rejects.toThrow("Signup error");
      expect(global.alert).toHaveBeenCalledWith("Signup failed: Signup error");
    });
  });

  describe("loginNormUser", () => {
    test("should throw if email not verified", async () => {
      const mockUser = { emailVerified: false };
      signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
      await expect(
        loginNormUser({ email: "test@example.com", password: "1234" })
      ).rejects.toThrow("Email not verified");
      expect(global.alert).toHaveBeenCalledWith("Please verify your email before logging in.");
      expect(getAuth().signOut).toHaveBeenCalled();
    });

    test("should return user if email verified", async () => {
      const mockUser = { emailVerified: true, uid: "123" };
      signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
      const result = await loginNormUser({ email: "test@example.com", password: "1234" });
      expect(result).toEqual(mockUser);
      expect(global.alert).toHaveBeenCalledWith("Login successful!");
    });

    test("should throw error on login failure", async () => {
      const error = new Error("Login error");
      signInWithEmailAndPassword.mockRejectedValue(error);
      await expect(
        loginNormUser({ email: "test@example.com", password: "1234" })
      ).rejects.toThrow("Login error");
    });
  });

  describe("addUserToFirestore", () => {
    test("should call setDoc with correct user data", async () => {
      await addUserToFirestore("123", "test@example.com", "Tetelo", "user", "Firebase Auth", 10);
      expect(doc).toHaveBeenCalledWith(expect.anything(), "Users", "123");
      expect(setDoc).toHaveBeenCalledWith("mock-doc", {
        Email: "test@example.com",
        Name: "Tetelo",
        joinedAt: "mock-timestamp",
        Role: "user",
        LeaderBoardPoints: 10,
        autheProvider: "Firebase Auth",
        Level: 0,
        CompletedQuests: [],
        Bio: "",
        SpendablePoints: 0,
        Experience: 0,
        Quests: [],
      });
    });

    test("should handle Firestore error", async () => {
      const error = new Error("Firestore error");
      setDoc.mockRejectedValue(error);
      await addUserToFirestore("123", "test@example.com", "Tetelo", "user", "Firebase Auth", 10);
      expect(console.error).toHaveBeenCalledWith("Error adding user to Firestore:", error);
    });
  });

  describe("getUserData", () => {
    test("should return user data from Firestore", async () => {
      const mockData = { Role: "admin", Name: "Tetelo" };
      getDoc.mockResolvedValue({ exists: () => true, data: () => mockData });
      const data = await getUserData();
      expect(data).toEqual(mockData);
      expect(doc).toHaveBeenCalledWith(expect.anything(), "Users", "123");
    });

    test("should throw if user not authenticated", async () => {
      getAuth.mockReturnValueOnce({ currentUser: null });
      await expect(getUserData()).rejects.toThrow("User is not authenticated");
    });

    test("should throw if user document does not exist", async () => {
      getDoc.mockResolvedValue({ exists: () => false });
      await expect(getUserData()).rejects.toThrow("User document does not exist in Firestore");
    });
  });

  describe("getUserName", () => {
    test("should return Name from user data", async () => {
      const mockData = { Name: "Tetelo" };
      getDoc.mockResolvedValue({ exists: () => true, data: () => mockData });
      const name = await getUserName();
      expect(name).toBe("Tetelo");
    });

    test("should return null on error", async () => {
      getDoc.mockRejectedValue(new Error("Firestore error"));
      const name = await getUserName();
      expect(name).toBeNull();
      expect(console.error).toHaveBeenCalledWith("Error fetching user name:", expect.any(Error));
    });
  });

  describe("getUserRole", () => {
    test("should return Role from user data", async () => {
      const mockData = { Role: "admin" };
      getDoc.mockResolvedValue({ exists: () => true, data: () => mockData });
      const role = await getUserRole();
      expect(role).toBe("admin");
    });

    test("should return null on error", async () => {
      getDoc.mockRejectedValue(new Error("Firestore error"));
      const role = await getUserRole();
      expect(role).toBeNull();
      expect(console.error).toHaveBeenCalledWith("Error fetching user name:", expect.any(Error));
    });
  });

  describe("logout", () => {
    test("should call auth.signOut", () => {
      logout();
      expect(getAuth().signOut).toHaveBeenCalled();
    });
  });

  describe("getAllQuests", () => {
    test("should return quests array", async () => {
      getDocs.mockResolvedValue({
        docs: [{ id: "q1", data: () => ({ title: "Quest 1" }) }],
      });
      const quests = await getAllQuests();
      expect(quests).toEqual([{ id: "q1", title: "Quest 1" }]);
      expect(collection).toHaveBeenCalledWith(expect.anything(), "Quests");
    });

    test("should return empty array on error", async () => {
      getDocs.mockRejectedValue(new Error("Firestore error"));
      const quests = await getAllQuests();
      expect(quests).toEqual([]);
      expect(console.error).toHaveBeenCalledWith("Error fetching quests:", expect.any(Error));
    });
  });
});