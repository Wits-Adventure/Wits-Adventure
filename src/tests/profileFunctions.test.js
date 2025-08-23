// profile.test.js
import { getProfileData, addProfileFields } from "../firebase/profile_functions"; 
import { auth, db } from "../firebase/firebase";
import { collection, getDocs, getDoc, updateDoc, doc } from "firebase/firestore";

// Mock firebase modules
jest.mock("../firebase/firebase", () => ({
  auth: { currentUser: { uid: "testUserId" } },
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  doc: jest.fn(),
}));

describe("Profile Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getProfileData", () => {
    it("should throw error if user is not authenticated", async () => {
      // temporarily set currentUser to null
      auth.currentUser = null;

      await expect(getProfileData()).rejects.toThrow("User is not authenticated");
    });

    it("should throw error if user document does not exist", async () => {
      auth.currentUser = { uid: "testUserId" };
      getDoc.mockResolvedValueOnce({ exists: () => false });

      await expect(getProfileData()).rejects.toThrow("User document does not exist in Firestore");
    });

    it("should return user data if document exists", async () => {
      auth.currentUser = { uid: "testUserId" };
      const fakeData = {
        Name: "Alice",
        LeaderBoardPoints: 120,
        CompletedQuests: [1, 2],
        Level: 3,
        Bio: "Test bio",
      };

      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => fakeData,
      });

      const result = await getProfileData();

      expect(result).toEqual({
        Name: "Alice",
        LeaderBoardPoints: 120,
        CompletedQuests: 2,
        Level: 3,
        Bio: "Test bio",
      });
    });
  });

  describe("addProfileFields", () => {
    it("should log message if no documents found", async () => {
      getDocs.mockResolvedValueOnce({ empty: true });

      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      await addProfileFields();

      expect(consoleSpy).toHaveBeenCalledWith("No documents found in the users collection.");
      consoleSpy.mockRestore();
    });

    it("should update documents if found", async () => {
      const fakeDocs = [
        { id: "user1" },
        { id: "user2" },
      ];
      getDocs.mockResolvedValueOnce({
        empty: false,
        forEach: (callback) => fakeDocs.forEach(callback),
      });

      doc.mockImplementation((db, collectionName, id) => ({ db, collectionName, id }));

      await addProfileFields();

      expect(updateDoc).toHaveBeenCalledTimes(2);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "user1" }),
        expect.any(Object)
      );
    });
  });
});
