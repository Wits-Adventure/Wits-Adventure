
import {
  signupNormUser,
  loginNormUser,
  addUserToFirestore,
  getAllQuests,
  getUserName,
  getUserRole,
  getUserData,
  logout,
  auth,
  db,
} from "../firebase/firebase";

// Mock Firebase packages
jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => "mockApp"),
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({ currentUser: { uid: "testUid" }, signOut: jest.fn() })),
  createUserWithEmailAndPassword: jest.fn(),
  sendEmailVerification: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => "mockDb"),
  doc: jest.fn((db, col, id) => ({ db, col, id })),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  serverTimestamp: jest.fn(() => "mockTimestamp"),
  collection: jest.fn(() => "mockCollection"),
  getDocs: jest.fn(),
}));

// pull mocked fns
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { setDoc, getDoc, getDocs } from "firebase/firestore";

describe("Firebase wrapper tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("signupNormUser rejects when passwords don't match", async () => {
    await expect(
      signupNormUser({
        Name: "John",
        Email: "john@test.com",
        Password: "123456",
        ConfirmPassword: "wrong",
        Role: "user",
        LeaderBoardPoints: 0,
      })
    ).rejects.toThrow("Passwords do not match");
  });

  test("signupNormUser creates user and sends verification", async () => {
    createUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: "uid123", emailVerified: false },
    });
    sendEmailVerification.mockResolvedValue();

    await signupNormUser({
      Name: "John",
      Email: "john@test.com",
      Password: "123456",
      ConfirmPassword: "123456",
      Role: "user",
      LeaderBoardPoints: 100,
    });

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      auth,
      "john@test.com",
      "123456"
    );
    expect(sendEmailVerification).toHaveBeenCalled();
    expect(setDoc).toHaveBeenCalled();
  });

  test("loginNormUser throws error if email not verified", async () => {
    signInWithEmailAndPassword.mockResolvedValue({
      user: { emailVerified: false },
    });
    auth.signOut = jest.fn();

    await expect(
      loginNormUser({ email: "test@test.com", password: "123456" })
    ).rejects.toThrow("Email not verified");

    expect(auth.signOut).toHaveBeenCalled();
  });

  test("loginNormUser returns user if verified", async () => {
    const mockUser = { emailVerified: true };
    signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

    const result = await loginNormUser({
      email: "verified@test.com",
      password: "123456",
    });

    expect(result).toBe(mockUser);
  });

  test("addUserToFirestore calls setDoc with correct data", async () => {
    await addUserToFirestore("uid1", "test@test.com", "Test", "user", "Firebase Auth", 50);

    expect(setDoc).toHaveBeenCalledWith(
      { db: "mockDb", col: "Users", id: "uid1" },
      expect.objectContaining({
        Email: "test@test.com",
        Name: "Test",
        Role: "user",
        LeaderBoardPoints: 50,
        autheProvider: "Firebase Auth",
      })
    );
  });

  test("getAllQuests returns mapped quests", async () => {
    getDocs.mockResolvedValue({
      docs: [{ id: "q1", data: () => ({ name: "Quest1" }) }],
    });

    const quests = await getAllQuests();

    expect(quests).toEqual([{ id: "q1", name: "Quest1" }]);
  });

  test("getUserData throws if no current user", async () => {
    const oldAuth = auth.currentUser;
    auth.currentUser = null;

    await expect(getUserData()).rejects.toThrow("User is not authenticated");

    auth.currentUser = oldAuth;
  });

  test("getUserName returns Name field", async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ Name: "Alice" }),
    });

    const name = await getUserName();
    expect(name).toBe("Alice");
  });

  test("getUserRole returns Role field", async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ Role: "Admin" }),
    });

    const role = await getUserRole();
    expect(role).toBe("Admin");
  });

  test("logout calls signOut", () => {
    auth.signOut = jest.fn();
    logout();
    expect(auth.signOut).toHaveBeenCalled();
  });
});
