import { db } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { doc, updateDoc, arrayUnion, getDoc, setDoc, GeoPoint, deleteDoc } from "firebase/firestore";
import { apiRequest,auth } from './firebase';
/**
 * Fetches all quests from the backend API.
 * @returns {Promise<Array<object>>} An array of quest objects.
 */
export const getAllQuests = async () => {
    try {
        // 💡 Use apiRequest for a simple GET call
        const questsArray = await apiRequest('/api/quests');
        console.log("Quests fetched from backend:", questsArray);
        return questsArray;
    } catch (error) {
        console.error("Error fetching quests:", error);
        return [];
    }
};


/**
 * Saves a new quest to the backend API.
 * @param {object} questData - The quest data to be saved.
 * @returns {Promise<string>} The ID of the newly created quest.
 */
export const saveQuestToFirestore = async (questData) => {
    try {
        const response = await apiRequest('/api/quests', 'POST', questData);

        // Backend now sends a more robust response
        alert(response.message);
        console.log("Quest ID:", response.questId);
        return response.questId;

    } catch (error) {
        console.error("Error adding quest:", error);
        alert("Failed to add quest. Please try again.");
        throw error; // Rethrow for further error handling in the UI
    }
};


// Accept a quest: update both quest and user
/**
 * Accepts a quest by updating both the quest and user documents via the backend.
 * @param {string} questId The ID of the quest to accept.
 * @returns {Promise<object>} The API response from the backend.
 */
export const acceptQuest = async (questId) => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User is not authenticated. Please log in to accept a quest.");
    }
    try {
        // Make a PATCH request to the backend. The backend will use the user's token
        // to get their UID and handle all the database logic.
        const response = await apiRequest(`/api/quests/${questId}/accept`, 'PATCH', {});
        return response;
    } catch (error) {
        console.error("Error accepting quest:", error);
        throw error;
    }
};

/**
 * Closes and deletes a quest, triggering backend logic to remove it from all users.
 * @param {string} questId The ID of the quest to close.
 * @returns {Promise<object>} The API response from the backend.
 */
export const closeQuestAndRemoveFromUsers = async (questId) => {
    try {
        // The backend handles all the complex logic of deleting the quest
        // and updating the user data.
        const response = await apiRequest(`/api/quests/${questId}`, 'DELETE');
        return response;
    } catch (error) {
        console.error("Error closing quest:", error);
        throw error; // Re-throw the error for UI feedback
    }
};

/**
 * Abandons a quest for the current user via the backend API.
 * @param {string} questId The ID of the quest to abandon.
 * @returns {Promise<object>} The API response from the backend.
 */
export const abandonQuest = async (questId) => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User is not authenticated. Cannot abandon quest.");
    }

    try {
        // Make a PATCH request. The backend will use the user's token
        // to get their UID and handle all the database logic.
        const response = await apiRequest(`/api/quests/${questId}/abandon`, 'PATCH', {});
        return response;
    } catch (error) {
        console.error("Error abandoning quest:", error);
        throw error;
    }
};