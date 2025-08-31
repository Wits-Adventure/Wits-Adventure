/**
 * @jest-environment node
 */
// Polyfill fetch for Node.js
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
);

// Mock Firebase Auth
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({
    currentUser: { uid: "mockUserId", emailVerified: true },
    signOut: jest.fn(() => Promise.resolve()),
  })),
}));

// Mock Firebase Firestore
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => "mock-timestamp"),
  getDocs: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  arrayUnion: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  GeoPoint: jest.fn(),
}));

// Mock the firebase module to provide auth and db
jest.mock("../firebase/firebase", () => ({
  __esModule: true,
  auth: {
    currentUser: { uid: "mockUserId", emailVerified: true },
    signOut: jest.fn(() => Promise.resolve()),
  },
  db: jest.fn(),
}));

const { db } = require("../firebase/firebase");
const { collection, addDoc, serverTimestamp, getDocs, doc, updateDoc, arrayUnion, getDoc, setDoc, GeoPoint } = require("firebase/firestore");
const { getAllQuests, saveQuestToFirestore, acceptQuest } = require("../firebase/general_quest_functions");

// Mock console and alert for testing
console.error = jest.fn();
console.log = jest.fn();
global.alert = jest.fn();

describe("Firestore Quest Functions", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe("getAllQuests", () => {
    test("should fetch all quests successfully", async () => {
      // Mock Firestore query snapshot
      const mockDocs = [
        { id: "quest1", data: () => ({ name: "Quest 1", radius: 100 }) },
        { id: "quest2", data: () => ({ name: "Quest 2", radius: 200 }) },
      ];
      const mockQuerySnapshot = { docs: mockDocs };
      getDocs.mockResolvedValue(mockQuerySnapshot);
      collection.mockReturnValue("quests-collection");

      // Call the function
      const result = await getAllQuests();

      // Assertions
      expect(collection).toHaveBeenCalledWith(db, "Quests");
      expect(getDocs).toHaveBeenCalledWith("quests-collection");
      expect(result).toEqual([
        { id: "quest1", name: "Quest 1", radius: 100 },
        { id: "quest2", name: "Quest 2", radius: 200 },
      ]);
      expect(console.log).toHaveBeenCalledWith("Quests fetched from Firebase:", expect.any(Array));
    });

    test("should handle errors and return empty array", async () => {
      // Mock Firestore error
      getDocs.mockRejectedValue(new Error("Firestore error"));
      collection.mockReturnValue("quests-collection");

      // Call the function
      const result = await getAllQuests();

      // Assertions
      expect(collection).toHaveBeenCalledWith(db, "Quests");
      expect(getDocs).toHaveBeenCalledWith("quests-collection");
      expect(console.error).toHaveBeenCalledWith("Error fetching quests:", expect.any(Error));
      expect(result).toEqual([]);
    });
  });

  describe("saveQuestToFirestore", () => {
    test("should save a quest successfully", async () => {
      // Mock quest data
      const questData = {
        name: "Test Quest",
        radius: 50,
        reward: 100,
        lat: 40.7128,
        lng: -74.0060,
        imageUrl: "http://example.com/image.jpg",
        creatorId: "user123",
        creatorName: "Test User",
        emoji: "🎉",
        color: "#FF0000",
      };
      const mockQuestRef = { id: "quest123" };
      addDoc.mockResolvedValue(mockQuestRef);
      collection.mockReturnValue("quests-collection");
      serverTimestamp.mockReturnValue("timestamp");
      GeoPoint.mockImplementation((lat, lng) => ({ lat, lng }));

      // Call the function
      const result = await saveQuestToFirestore(questData);

      // Assertions
      expect(collection).toHaveBeenCalledWith(db, "Quests");
      expect(addDoc).toHaveBeenCalledWith("quests-collection", {
        name: "Test Quest",
        radius: 50,
        reward: 100,
        location: { lat: 40.7128, lng: -74.0060 },
        imageUrl: "http://example.com/image.jpg",
        creatorId: "user123",
        creatorName: "Test User",
        createdAt: "timestamp",
        active: true,
        acceptedBy: [],
        emoji: "🎉",
        color: "#FF0000",
      });
      expect(alert).toHaveBeenCalledWith('Quest "Test Quest" added successfully!');
      expect(console.log).toHaveBeenCalledWith("Quest ID:", "quest123");
      expect(result).toBe("quest123");
    });

    test("should handle errors when saving a quest", async () => {
      // Mock quest data
      const questData = {
        name: "Test Quest",
        radius: 50,
        reward: 100,
        lat: 40.7128,
        lng: -74.0060,
        imageUrl: "http://example.com/image.jpg",
        creatorId: "user123",
        creatorName: "Test User",
        emoji: "🎉",
        color: "#FF0000",
      };
      addDoc.mockRejectedValue(new Error("Firestore error"));
      collection.mockReturnValue("quests-collection");

      // Call the function
      const result = await saveQuestToFirestore(questData);

      // Assertions
      expect(collection).toHaveBeenCalledWith(db, "Quests");
      expect(addDoc).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith("Error adding quest to Firestore:", expect.any(Error));
      expect(alert).toHaveBeenCalledWith("Failed to add quest. Please try again.");
      expect(result).toBeUndefined();
    });
  });

  describe("acceptQuest", () => {
    test("should accept a quest and update user and quest documents (existing user)", async () => {
      // Mock Firestore data
      const questId = "quest123";
      const userId = "user123";
      const mockUserSnap = { exists: () => true };
      doc.mockImplementation((db, collection, id) => `${collection}/${id}`);
      getDoc.mockResolvedValue(mockUserSnap);
      arrayUnion.mockImplementation((id) => ({ arrayUnion: id }));

      // Call the function
      await acceptQuest(questId, userId);

      // Assertions
      expect(doc).toHaveBeenCalledWith(db, "Quests", questId);
      expect(doc).toHaveBeenCalledWith(db, "Users", userId);
      expect(updateDoc).toHaveBeenCalledWith("Quests/quest123", {
        acceptedBy: { arrayUnion: userId },
      });
      expect(getDoc).toHaveBeenCalledWith("Users/user123");
      expect(updateDoc).toHaveBeenCalledWith("Users/user123", {
        acceptedQuests: { arrayUnion: questId },
      });
      expect(setDoc).not.toHaveBeenCalled();
    });

    test("should accept a quest and create user document if it does not exist", async () => {
      // Mock Firestore data
      const questId = "quest123";
      const userId = "user123";
      const mockUserSnap = { exists: () => false };
      doc.mockImplementation((db, collection, id) => `${collection}/${id}`);
      getDoc.mockResolvedValue(mockUserSnap);
      arrayUnion.mockImplementation((id) => ({ arrayUnion: id }));

      // Call the function
      await acceptQuest(questId, userId);

      // Assertions
      expect(doc).toHaveBeenCalledWith(db, "Quests", questId);
      expect(doc).toHaveBeenCalledWith(db, "Users", userId);
      expect(updateDoc).toHaveBeenCalledWith("Quests/quest123", {
        acceptedBy: { arrayUnion: userId },
      });
      expect(getDoc).toHaveBeenCalledWith("Users/user123");
      expect(setDoc).toHaveBeenCalledWith("Users/user123", { acceptedQuests: [questId] }, { merge: true });
      expect(updateDoc).toHaveBeenCalledTimes(1); // Only for quest, not user
    });
  });
});