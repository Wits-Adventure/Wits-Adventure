// src/firebase/storage.js
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

// Uploads image and returns download URL
export const uploadQuestImage = async (file, questId, userId) => {
  try {
    // Create a reference: images/{userId}/{questId}/{filename}
    const storageRef = ref(storage, `quests/${userId}/${questId}/${file.name}`);

    // Upload the file
    await uploadBytes(storageRef, file);

    // Get the file URL
    const url = await getDownloadURL(storageRef);

    return url;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};
