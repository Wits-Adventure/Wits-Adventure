/**
 * @jest-environment node
 */
import { getProfileData, addProfileFields, updateProfileData } from "../firebase/profile_functions";
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
    // Reset auth.currentUser to default
    auth.currentUser = { uid: "testUserId" };
  });

  describe("getProfileData", () => {
    it("should throw error if user is not authenticated", async () => {
      auth.currentUser = null;

      await expect(getProfileData()).rejects.toThrow("User is not authenticated");
    });

    it("should throw error if user document does not exist", async () => {
      getDoc.mockResolvedValueOnce({ exists: () => false });

      await expect(getProfileData()).rejects.toThrow("User document does not exist in Firestore");
    });

    it("should return user data if document exists", async () => {
      const mockUserData = {
        Name: "Alice Johnson",
        LeaderBoardPoints: 120,
        CompletedQuests: [1, 2, 3],
        Level: 3,
        Bio: "Test bio",
        ProfilePictureUrl: "https://example.com/avatar.jpg",
      };

      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockUserData,
      });

      const result = await getProfileData();

      expect(result).toEqual({
        uid: "testUserId",
        Name: "Alice Johnson",
        LeaderBoardPoints: 120,
        CompletedQuests: 3,
        Level: 3,
        Bio: "Test bio",
        profilePicture: "https://example.com/avatar.jpg",
      });
    });

    it("should handle missing CompletedQuests array", async () => {
      const mockUserData = {
        Name: "Bob Smith",
        LeaderBoardPoints: 50,
        Level: 1,
        Bio: "Another test bio",
        ProfilePictureUrl: "https://example.com/bob.jpg",
        // CompletedQuests is missing
      };

      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockUserData,
      });

      const result = await getProfileData();

      expect(result.CompletedQuests).toBe(0);
    });

    it("should handle empty CompletedQuests array", async () => {
      const mockUserData = {
        Name: "Charlie Brown",
        LeaderBoardPoints: 0,
        CompletedQuests: [],
        Level: 0,
        Bio: "",
        ProfilePictureUrl: null,
      };

      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockUserData,
      });

      const result = await getProfileData();

      expect(result.CompletedQuests).toBe(0);
    });

    it("should handle Firestore errors", async () => {
      const firestoreError = new Error("Firestore connection failed");
      getDoc.mockRejectedValueOnce(firestoreError);

      await expect(getProfileData()).rejects.toThrow("User document does not exist in Firestore");
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

    it("should update all documents with new fields", async () => {
      const mockDocs = [
        { id: "user1" },
        { id: "user2" },
        { id: "user3" },
      ];

      getDocs.mockResolvedValueOnce({
        empty: false,
        docs: mockDocs,
      });

      doc.mockImplementation((db, collectionName, id) => ({ db, collectionName, id }));

      await addProfileFields();

      expect(updateDoc).toHaveBeenCalledTimes(3);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "user1" }),
        {
          Level: 0,
          CompletedQuests: [],
          Bio: "",
          SpendablePoints: 0,
          Experience: 0,
          Quests: [],
        }
      );
    });

    it("should handle Firestore errors during update", async () => {
      const mockDocs = [{ id: "user1" }];
      getDocs.mockResolvedValueOnce({
        empty: false,
        docs: mockDocs,
      });

      const firestoreError = new Error("Update failed");
      updateDoc.mockRejectedValueOnce(firestoreError);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      
      await addProfileFields();

      expect(consoleSpy).toHaveBeenCalledWith("Error updating documents:", firestoreError);
      consoleSpy.mockRestore();
    });

    it("should handle empty docs array", async () => {
      getDocs.mockResolvedValueOnce({
        empty: false,
        docs: [],
      });

      await addProfileFields();

      expect(updateDoc).not.toHaveBeenCalled();
    });
  });

  describe("updateProfileData", () => {
    it("should throw error if no uid provided", async () => {
      await expect(updateProfileData({})).rejects.toThrow("No user ID provided");
      await expect(updateProfileData({ uid: null })).rejects.toThrow("No user ID provided");
      await expect(updateProfileData({ uid: "" })).rejects.toThrow("No user ID provided");
    });

    it("should update only provided fields", async () => {
      const updateData = {
        uid: "testUserId",
        Name: "New Name",
        Bio: "New bio",
      };

      doc.mockReturnValueOnce("mockDocRef");

      await updateProfileData(updateData);

      expect(updateDoc).toHaveBeenCalledWith("mockDocRef", {
        Name: "New Name",
        Bio: "New bio",
      });
    });

    it("should update profile picture URL", async () => {
      const updateData = {
        uid: "testUserId",
        ProfilePictureUrl: "https://example.com/new-avatar.jpg",
      };

      doc.mockReturnValueOnce("mockDocRef");

      await updateProfileData(updateData);

      expect(updateDoc).toHaveBeenCalledWith("mockDocRef", {
        ProfilePictureUrl: "https://example.com/new-avatar.jpg",
      });
    });

    it("should handle undefined values correctly", async () => {
      const updateData = {
        uid: "testUserId",
        Name: undefined,
        Bio: "Valid bio",
        ProfilePictureUrl: undefined,
      };

      doc.mockReturnValueOnce("mockDocRef");

      await updateProfileData(updateData);

      expect(updateDoc).toHaveBeenCalledWith("mockDocRef", {
        Bio: "Valid bio",
      });
    });

    it("should handle all fields being undefined", async () => {
      const updateData = {
        uid: "testUserId",
        Name: undefined,
        Bio: undefined,
        ProfilePictureUrl: undefined,
      };

      doc.mockReturnValueOnce("mockDocRef");

      await updateProfileData(updateData);

      expect(updateDoc).toHaveBeenCalledWith("mockDocRef", {});
    });

    it("should handle Firestore errors", async () => {
      const updateData = {
        uid: "testUserId",
        Name: "Test Name",
      };

      const firestoreError = new Error("Update failed");
      updateDoc.mockRejectedValueOnce(firestoreError);

      await expect(updateProfileData(updateData)).rejects.toThrow("Update failed");
    });

    it("should handle empty string values", async () => {
      const updateData = {
        uid: "testUserId",
        Name: "",
        Bio: "",
        ProfilePictureUrl: "",
      };

      doc.mockReturnValueOnce("mockDocRef");

      await updateProfileData(updateData);

      expect(updateDoc).toHaveBeenCalledWith("mockDocRef", {
        Name: "",
        Bio: "",
        ProfilePictureUrl: "",
      });
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete profile update workflow", async () => {
      // First get profile data
      const mockUserData = {
        Name: "Original Name",
        LeaderBoardPoints: 100,
        CompletedQuests: [1, 2],
        Level: 2,
        Bio: "Original bio",
        ProfilePictureUrl: "https://example.com/original.jpg",
      };

      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockUserData,
      });

      const profileData = await getProfileData();
      expect(profileData.Name).toBe("Original Name");

      // Then update profile
      doc.mockReturnValueOnce("mockDocRef");
      const updateData = {
        uid: "testUserId",
        Name: "Updated Name",
        Bio: "Updated bio",
      };

      await updateProfileData(updateData);

      expect(updateDoc).toHaveBeenCalledWith("mockDocRef", {
        Name: "Updated Name",
        Bio: "Updated bio",
      });
    });
  });
});
