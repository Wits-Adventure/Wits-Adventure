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
  deleteDoc: jest.fn(),
}));

// Mock Firebase Storage
jest.mock("firebase/storage", () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

// Mock the firebase module to provide auth, db, and storage
jest.mock("../firebase/firebase", () => ({
  __esModule: true,
  auth: {
    currentUser: { uid: "mockUserId", emailVerified: true },
    signOut: jest.fn(() => Promise.resolve()),
  },
  db: jest.fn(),
  storage: jest.fn(),
}));

const { db, storage } = require("../firebase/firebase");
const { collection, addDoc, serverTimestamp, getDocs, doc, updateDoc, arrayUnion, getDoc, setDoc, GeoPoint, deleteDoc } = require("firebase/firestore");
const { ref, uploadBytes, getDownloadURL } = require("firebase/storage");
const { getAllQuests, saveQuestToFirestore, acceptQuest, closeQuestAndRemoveFromUsers, abandonQuest, submitQuestAttempt, fetchQuestSubmissions, removeQuestSubmission, approveSubmissionAndCloseQuest, removeSubmissionByUserId } = require("../firebase/general_quest_functions");

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

  describe("closeQuestAndRemoveFromUsers", () => {
    test("should delete quest and remove from all users", async () => {
      const questId = "quest123";
      const mockUsersSnapshot = {
        forEach: jest.fn((callback) => {
          callback({ id: "user1", data: () => ({ acceptedQuests: ["quest123", "quest456"] }) });
          callback({ id: "user2", data: () => ({ acceptedQuests: ["quest789"] }) });
        })
      };
      
      getDocs.mockResolvedValue(mockUsersSnapshot);
      doc.mockImplementation((db, collection, id) => `${collection}/${id}`);
      deleteDoc.mockResolvedValue();
      updateDoc.mockResolvedValue();

      await closeQuestAndRemoveFromUsers(questId);

      expect(deleteDoc).toHaveBeenCalledWith("Quests/quest123");
      expect(updateDoc).toHaveBeenCalledWith("Users/user1", {
        acceptedQuests: ["quest456"]
      });
    });
  });

  describe("abandonQuest", () => {
    test("should remove user from quest and quest from user", async () => {
      const questId = "quest123";
      const userId = "user123";
      const mockQuestSnap = {
        exists: () => true,
        data: () => ({ acceptedBy: ["user123", "user456"] })
      };
      const mockUserSnap = {
        exists: () => true,
        data: () => ({ acceptedQuests: ["quest123", "quest456"] })
      };
      
      doc.mockImplementation((db, collection, id) => `${collection}/${id}`);
      getDoc.mockImplementation((ref) => {
        if (ref === "Quests/quest123") return Promise.resolve(mockQuestSnap);
        if (ref === "Users/user123") return Promise.resolve(mockUserSnap);
      });
      updateDoc.mockResolvedValue();

      await abandonQuest(questId, userId);

      expect(updateDoc).toHaveBeenCalledWith("Quests/quest123", {
        acceptedBy: ["user456"]
      });
      expect(updateDoc).toHaveBeenCalledWith("Users/user123", {
        acceptedQuests: ["quest456"]
      });
    });

    test("should handle quest that doesn't exist", async () => {
      const questId = "quest123";
      const userId = "user123";
      const mockQuestSnap = {
        exists: () => false
      };
      
      doc.mockImplementation((db, collection, id) => `${collection}/${id}`);
      getDoc.mockResolvedValue(mockQuestSnap);
      updateDoc.mockResolvedValue();

      await abandonQuest(questId, userId);

      expect(updateDoc).not.toHaveBeenCalledWith(expect.stringContaining("Quests"), expect.anything());
    });

    test("should handle user that doesn't exist", async () => {
      const questId = "quest123";
      const userId = "user123";
      const mockQuestSnap = {
        exists: () => true,
        data: () => ({ acceptedBy: ["user123", "user456"] })
      };
      const mockUserSnap = {
        exists: () => false
      };
      
      doc.mockImplementation((db, collection, id) => `${collection}/${id}`);
      getDoc.mockImplementation((ref) => {
        if (ref === "Quests/quest123") return Promise.resolve(mockQuestSnap);
        if (ref === "Users/user123") return Promise.resolve(mockUserSnap);
      });
      updateDoc.mockResolvedValue();

      await abandonQuest(questId, userId);

      expect(updateDoc).toHaveBeenCalledWith("Quests/quest123", {
        acceptedBy: ["user456"]
      });
    });
  });

  describe("submitQuestAttempt", () => {
    test("should upload image and add submission", async () => {
      const questId = "quest123";
      const userId = "user123";
      const userName = "Test User";
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const mockQuestSnap = {
        exists: () => true,
        data: () => ({ submissions: [] })
      };
      
      ref.mockReturnValue("storage-ref");
      uploadBytes.mockResolvedValue();
      getDownloadURL.mockResolvedValue("http://example.com/image.jpg");
      doc.mockReturnValue("Quests/quest123");
      getDoc.mockResolvedValue(mockQuestSnap);
      updateDoc.mockResolvedValue();

      await submitQuestAttempt(questId, userId, file, userName);

      expect(ref).toHaveBeenCalledWith(storage, expect.stringContaining(`quest_submissions/${questId}/${userId}_`));
      expect(uploadBytes).toHaveBeenCalledWith("storage-ref", file);
      expect(updateDoc).toHaveBeenCalledWith("Quests/quest123", {
        submissions: expect.arrayContaining([expect.objectContaining({
          userId,
          Name: userName,
          imageUrl: "http://example.com/image.jpg"
        })])
      });
    });

    test("should replace existing submission from same user", async () => {
      const questId = "quest123";
      const userId = "user123";
      const userName = "Test User";
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const mockQuestSnap = {
        exists: () => true,
        data: () => ({ 
          submissions: [{ userId: "user123", Name: "Old User", imageUrl: "old.jpg" }] 
        })
      };
      
      ref.mockReturnValue("storage-ref");
      uploadBytes.mockResolvedValue();
      getDownloadURL.mockResolvedValue("http://example.com/new.jpg");
      doc.mockReturnValue("Quests/quest123");
      getDoc.mockResolvedValue(mockQuestSnap);
      updateDoc.mockResolvedValue();

      await submitQuestAttempt(questId, userId, file, userName);

      expect(updateDoc).toHaveBeenCalledWith("Quests/quest123", {
        submissions: [expect.objectContaining({
          userId,
          Name: userName,
          imageUrl: "http://example.com/new.jpg"
        })]
      });
    });

    test("should handle quest that doesn't exist", async () => {
      const questId = "quest123";
      const userId = "user123";
      const userName = "Test User";
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const mockQuestSnap = {
        exists: () => false
      };
      
      ref.mockReturnValue("storage-ref");
      uploadBytes.mockResolvedValue();
      getDownloadURL.mockResolvedValue("http://example.com/image.jpg");
      doc.mockReturnValue("Quests/quest123");
      getDoc.mockResolvedValue(mockQuestSnap);
      updateDoc.mockResolvedValue();

      await submitQuestAttempt(questId, userId, file, userName);

      expect(updateDoc).toHaveBeenCalledWith("Quests/quest123", {
        submissions: [expect.objectContaining({
          userId,
          Name: userName,
          imageUrl: "http://example.com/image.jpg"
        })]
      });
    });
  });

  describe("fetchQuestSubmissions", () => {
    test("should return submissions for existing quest", async () => {
      const questId = "quest123";
      const mockSubmissions = [{ userId: "user1", imageUrl: "test.jpg" }];
      const mockQuestSnap = {
        exists: () => true,
        data: () => ({ submissions: mockSubmissions })
      };
      
      doc.mockReturnValue("Quests/quest123");
      getDoc.mockResolvedValue(mockQuestSnap);

      const result = await fetchQuestSubmissions(questId);

      expect(doc).toHaveBeenCalledWith(db, "Quests", questId);
      expect(result).toEqual(mockSubmissions);
    });

    test("should return empty array for non-existent quest", async () => {
      const questId = "quest123";
      const mockQuestSnap = {
        exists: () => false
      };
      
      doc.mockReturnValue("Quests/quest123");
      getDoc.mockResolvedValue(mockQuestSnap);

      const result = await fetchQuestSubmissions(questId);

      expect(result).toEqual([]);
    });

    test("should return empty array when no submissions", async () => {
      const questId = "quest123";
      const mockQuestSnap = {
        exists: () => true,
        data: () => ({})
      };
      
      doc.mockReturnValue("Quests/quest123");
      getDoc.mockResolvedValue(mockQuestSnap);

      const result = await fetchQuestSubmissions(questId);

      expect(result).toEqual([]);
    });
  });

  describe("removeQuestSubmission", () => {
    test("should remove submission by index", async () => {
      const questId = "quest123";
      const submissionIndex = 1;
      const mockSubmissions = [
        { userId: "user1", imageUrl: "test1.jpg" },
        { userId: "user2", imageUrl: "test2.jpg" },
        { userId: "user3", imageUrl: "test3.jpg" }
      ];
      const mockQuestSnap = {
        exists: () => true,
        data: () => ({ submissions: mockSubmissions })
      };
      
      doc.mockReturnValue("Quests/quest123");
      getDoc.mockResolvedValue(mockQuestSnap);
      updateDoc.mockResolvedValue();

      await removeQuestSubmission(questId, submissionIndex);

      expect(updateDoc).toHaveBeenCalledWith("Quests/quest123", {
        submissions: [
          { userId: "user1", imageUrl: "test1.jpg" },
          { userId: "user3", imageUrl: "test3.jpg" }
        ]
      });
    });

    test("should handle invalid index", async () => {
      const questId = "quest123";
      const submissionIndex = 5;
      const mockSubmissions = [{ userId: "user1", imageUrl: "test1.jpg" }];
      const mockQuestSnap = {
        exists: () => true,
        data: () => ({ submissions: mockSubmissions })
      };
      
      doc.mockReturnValue("Quests/quest123");
      getDoc.mockResolvedValue(mockQuestSnap);
      updateDoc.mockResolvedValue();

      await removeQuestSubmission(questId, submissionIndex);

      expect(updateDoc).not.toHaveBeenCalled();
    });

    test("should handle non-existent quest", async () => {
      const questId = "quest123";
      const submissionIndex = 0;
      const mockQuestSnap = {
        exists: () => false
      };
      
      doc.mockReturnValue("Quests/quest123");
      getDoc.mockResolvedValue(mockQuestSnap);
      updateDoc.mockResolvedValue();

      await removeQuestSubmission(questId, submissionIndex);

      expect(updateDoc).not.toHaveBeenCalled();
    });
  });

  describe("approveSubmissionAndCloseQuest", () => {
    test("should approve submission and close quest", async () => {
      const questId = "quest123";
      const approvedUserId = "user123";
      const mockQuestData = {
        creatorId: "creator123",
        reward: 100,
        color: "#FF0000",
        createdAt: "timestamp",
        creatorName: "Creator",
        emoji: "🎯",
        imageUrl: "quest.jpg",
        location: { lat: 1, lng: 1 },
        name: "Test Quest",
        radius: 50
      };
      const mockQuestSnap = {
        exists: () => true,
        data: () => mockQuestData
      };
      const mockUserSnap = {
        exists: () => true,
        data: () => ({ SpendablePoints: 50, Experience: 25, CompletedQuests: [] })
      };
      const mockCreatorSnap = {
        exists: () => true,
        data: () => ({ SpendablePoints: 75, Experience: 50, CompletedQuests: [] })
      };
      const mockUsersSnapshot = {
        forEach: jest.fn((callback) => {
          callback({ id: "user1", data: () => ({ acceptedQuests: ["quest123", "quest456"] }) });
        })
      };
      
      doc.mockImplementation((db, collection, id) => `${collection}/${id}`);
      getDoc.mockImplementation((ref) => {
        if (ref === "Quests/quest123") return Promise.resolve(mockQuestSnap);
        if (ref === "Users/user123") return Promise.resolve(mockUserSnap);
        if (ref === "Users/creator123") return Promise.resolve(mockCreatorSnap);
      });
      getDocs.mockResolvedValue(mockUsersSnapshot);
      updateDoc.mockResolvedValue();
      deleteDoc.mockResolvedValue();

      await approveSubmissionAndCloseQuest(questId, approvedUserId);

      expect(updateDoc).toHaveBeenCalledWith("Users/user123", {
        SpendablePoints: 150,
        Experience: 125,
        CompletedQuests: [expect.objectContaining({ questId })]
      });
      expect(deleteDoc).toHaveBeenCalledWith("Quests/quest123");
    });

    test("should handle quest without creator", async () => {
      const questId = "quest123";
      const approvedUserId = "user123";
      const mockQuestData = {
        reward: 100,
        color: "#FF0000",
        createdAt: "timestamp",
        creatorName: "Creator",
        emoji: "🎯",
        imageUrl: "quest.jpg",
        location: { lat: 1, lng: 1 },
        name: "Test Quest",
        radius: 50
      };
      const mockQuestSnap = {
        exists: () => true,
        data: () => mockQuestData
      };
      const mockUserSnap = {
        exists: () => true,
        data: () => ({ SpendablePoints: 50, Experience: 25 })
      };
      const mockUsersSnapshot = {
        forEach: jest.fn()
      };
      
      doc.mockImplementation((db, collection, id) => `${collection}/${id}`);
      getDoc.mockImplementation((ref) => {
        if (ref === "Quests/quest123") return Promise.resolve(mockQuestSnap);
        if (ref === "Users/user123") return Promise.resolve(mockUserSnap);
      });
      getDocs.mockResolvedValue(mockUsersSnapshot);
      updateDoc.mockResolvedValue();
      deleteDoc.mockResolvedValue();

      await approveSubmissionAndCloseQuest(questId, approvedUserId);

      expect(updateDoc).toHaveBeenCalledWith("Users/user123", expect.objectContaining({
        SpendablePoints: 150,
        Experience: 125
      }));
      expect(deleteDoc).toHaveBeenCalledWith("Quests/quest123");
    });

    test("should handle non-existent quest", async () => {
      const questId = "quest123";
      const approvedUserId = "user123";
      const mockQuestSnap = {
        exists: () => false
      };
      
      doc.mockReturnValue("Quests/quest123");
      getDoc.mockResolvedValue(mockQuestSnap);

      await approveSubmissionAndCloseQuest(questId, approvedUserId);

      expect(updateDoc).not.toHaveBeenCalled();
      expect(deleteDoc).not.toHaveBeenCalled();
    });

    test("should handle user that doesn't exist", async () => {
      const questId = "quest123";
      const approvedUserId = "user123";
      const mockQuestData = {
        creatorId: "creator123",
        reward: 100
      };
      const mockQuestSnap = {
        exists: () => true,
        data: () => mockQuestData
      };
      const mockUserSnap = {
        exists: () => false
      };
      const mockUsersSnapshot = {
        forEach: jest.fn()
      };
      
      doc.mockImplementation((db, collection, id) => `${collection}/${id}`);
      getDoc.mockImplementation((ref) => {
        if (ref === "Quests/quest123") return Promise.resolve(mockQuestSnap);
        if (ref === "Users/user123") return Promise.resolve(mockUserSnap);
      });
      getDocs.mockResolvedValue(mockUsersSnapshot);
      updateDoc.mockResolvedValue();
      deleteDoc.mockResolvedValue();

      await approveSubmissionAndCloseQuest(questId, approvedUserId);

      expect(deleteDoc).toHaveBeenCalledWith("Quests/quest123");
    });
  });

  describe("removeSubmissionByUserId", () => {
    test("should remove submission by userId", async () => {
      const questId = "quest123";
      const userId = "user123";
      const mockSubmissions = [
        { userId: "user123", imageUrl: "test1.jpg" },
        { userId: "user456", imageUrl: "test2.jpg" }
      ];
      const mockQuestSnap = {
        exists: () => true,
        data: () => ({ submissions: mockSubmissions })
      };
      
      doc.mockReturnValue("Quests/quest123");
      getDoc.mockResolvedValue(mockQuestSnap);
      updateDoc.mockResolvedValue();

      await removeSubmissionByUserId(questId, userId);

      expect(updateDoc).toHaveBeenCalledWith("Quests/quest123", {
        submissions: [{ userId: "user456", imageUrl: "test2.jpg" }]
      });
    });

    test("should handle non-existent quest", async () => {
      const questId = "quest123";
      const userId = "user123";
      const mockQuestSnap = {
        exists: () => false
      };
      
      doc.mockReturnValue("Quests/quest123");
      getDoc.mockResolvedValue(mockQuestSnap);

      await removeSubmissionByUserId(questId, userId);

      expect(updateDoc).not.toHaveBeenCalled();
    });
  });
});