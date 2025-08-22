const { getProfileData, addProfileFields } = require("../firebase/firebase");
const { getAuth } = require("firebase/auth");
const { getFirestore, doc, getDoc, getDocs, updateDoc, collection } = require("firebase/firestore");

// Mock Firebase dependencies
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({
    currentUser: { uid: "123" },
  })),
}));

jest.mock("firebase/firestore", () => {
  const mockDb = {};
  return {
    getFirestore: jest.fn(() => mockDb),
    doc: jest.fn(() => "mock-doc"),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    updateDoc: jest.fn().mockResolvedValue(),
    collection: jest.fn(() => "mock-collection"),
  };
});

// Mock console.log and console.error to suppress output
jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

describe("Firebase Profile Helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getProfileData", () => {
    test("should return user profile data when user is authenticated and document exists", async () => {
      const mockData = {
        Name: "Tetelo",
        LeaderBoardPoints: 100,
        CompletedQuests: ["quest1", "quest2"],
        Level: 5,
        Bio: "Test bio",
      };
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockData,
      });

      const result = await getProfileData();

      expect(result).toEqual({
        Name: "Tetelo",
        LeaderBoardPoints: 100,
        CompletedQuests: 2,
        Level: 5,
        Bio: "Test bio",
      });
      expect(doc).toHaveBeenCalledWith(getFirestore(), "Users", "123");
      expect(getDoc).toHaveBeenCalledWith("mock-doc");
    });

    test("should throw if user is not authenticated", async () => {
      getAuth.mockImplementationOnce(() => ({ currentUser: null }));
      await expect(getProfileData()).rejects.toThrow("User is not authenticated");
      expect(doc).not.toHaveBeenCalled();
      expect(getDoc).not.toHaveBeenCalled();
    });

    test("should throw if user document does not exist", async () => {
      getDoc.mockResolvedValue({ exists: () => false });
      await expect(getProfileData()).rejects.toThrow("User document does not exist in Firestore");
      expect(doc).toHaveBeenCalledWith(getFirestore(), "Users", "123");
      expect(getDoc).toHaveBeenCalledWith("mock-doc");
    });
  });

  describe("addProfileFields", () => {
    test("should update all user documents with default fields", async () => {
      const mockDocs = [
        { id: "user1", data: () => ({}) },
        { id: "user2", data: () => ({}) },
      ];
      getDocs.mockResolvedValue({
        empty: false,
        docs: mockDocs,
        forEach: (callback) => mockDocs.forEach(callback),
      });

      await addProfileFields();

      expect(collection).toHaveBeenCalledWith(getFirestore(), "Users");
      expect(getDocs).toHaveBeenCalledWith("mock-collection");
      expect(doc).toHaveBeenCalledTimes(2);
      expect(doc).toHaveBeenCalledWith(getFirestore(), "Users", "user1");
      expect(doc).toHaveBeenCalledWith(getFirestore(), "Users", "user2");
      expect(updateDoc).toHaveBeenCalledTimes(2);
      expect(updateDoc).toHaveBeenCalledWith("mock-doc", {
        Level: 0,
        CompletedQuests: [],
        Bio: "",
        SpendablePoints: 0,
        Experience: 0,
        Quests: [],
      });
      // expect(console.log).toHaveBeenCalledWith("All documents processed.");
    });

    test("should log message when users collection is empty", async () => {
      getDocs.mockResolvedValue({ empty: true });
      await addProfileFields();
      expect(collection).toHaveBeenCalledWith(getFirestore(), "Users");
      expect(getDocs).toHaveBeenCalledWith("mock-collection");
      expect(console.log).toHaveBeenCalledWith("No documents found in the users collection.");
      expect(doc).not.toHaveBeenCalled();
      expect(updateDoc).not.toHaveBeenCalled();
    });

    test("should handle Firestore error and log it", async () => {
      const error = new Error("Firestore error");
      getDocs.mockRejectedValue(error);
      await addProfileFields();
      expect(collection).toHaveBeenCalledWith(getFirestore(), "Users");
      expect(getDocs).toHaveBeenCalledWith("mock-collection");
      expect(console.error).toHaveBeenCalledWith("Error updating documents:", error);
      expect(doc).not.toHaveBeenCalled();
      expect(updateDoc).not.toHaveBeenCalled();
    });
  });
});