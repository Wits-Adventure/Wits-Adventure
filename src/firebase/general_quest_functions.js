import { db, storage } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { doc, updateDoc, arrayUnion, getDoc, setDoc, GeoPoint, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { apiRequest, auth } from './firebase';

// Future functions should follow this pattern: upload to Storage, save the URL in Firestore.


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
 * Creates a new quest by first uploading the image (if present) and then saving 
 * the quest data to the backend API.
 * * @param {object} questData - The quest details including an optional 'imageFile'.
 * @returns {Promise<string>} The ID of the newly created quest.
 */
export async function createQuestOnBackend(questData) {
    try {
        let imageUrl = '';

        // Check if an image file was provided to upload
        if (questData.imageFile) {
            // 1. UPLOAD IMAGE TO BACKEND
            console.log("Uploading image...");
            
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('image', questData.imageFile);

            // Use apiRequest with isFormData = true
            const uploadResponse = await apiRequest(
                '/api/upload/image', 
                'POST', 
                formData, 
                true // Set isFormData to true for file uploads
            );
            
            imageUrl = uploadResponse.imageUrl;
            console.log("Image uploaded. URL:", imageUrl);
        }

        // Prepare quest data for Firestore
        const finalQuestData = {
            name: questData.name,
            radius: questData.radius,
            reward: questData.reward,
            type: questData.type,
            lat: questData.lat, // Pass lat/lng as numbers to the backend
            lng: questData.lng,
            imageUrl: imageUrl, // Use the uploaded URL (or empty string)
            creatorName: questData.creatorName,
            emoji: questData.emoji,
            color: questData.color
            // creatorId is derived from the auth token on the backend
        };

        // 2. SAVE QUEST DATA TO BACKEND
        console.log("Saving quest data...");
        // Use apiRequest for JSON data
        const questResponse = await apiRequest(
            '/api/quests', 
            'POST', 
            finalQuestData
        );
        
        alert(`Quest "${questData.name}" added successfully!`);
        console.log("Quest ID:", questResponse.questId);
        return questResponse.questId;

    } catch (error) {
        console.error("Error creating quest:", error.message);
        alert(`Failed to create quest. Details: ${error.message}`);
        throw error; // Re-throw the error for component-level handling
    }
}

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


/**
 * Submits an attempt for a quest by first uploading the image to the backend 
 * and then sending the resulting URL to the quest submission endpoint.
 * @param {string} questId - The ID of the quest being attempted.
 * @param {string} userId - The ID of the user submitting the attempt. (Handled by token on backend)
 * @param {File} file - The image file to upload.
 * @param {string} userName - The display name of the user.
 * @returns {Promise<void>}
 */
export async function submitQuestAttemptToBackend(questId, userId, file, userName) {
    try {
        let imageUrl = '';

        // --- 1. UPLOAD IMAGE TO BACKEND ---
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('image', file, file.name); // 'image' must match multer field in upload.js

        console.log("Uploading submission image...");
        
        // Use apiRequest with isFormData = true to upload the file
        const uploadResponse = await apiRequest(
            '/api/upload/image', 
            'POST', 
            formData, 
            true // isFormData: true for file upload
        );
        
        imageUrl = uploadResponse.imageUrl;
        console.log("Image uploaded. URL:", imageUrl);

        // --- 2. SUBMIT ATTEMPT DETAILS TO BACKEND ---
        const submissionData = {
            imageUrl: imageUrl,
            userName: userName,
            // userId is retrieved on the backend from the authentication token
        };

        console.log("Submitting quest attempt details...");
        
        // Use apiRequest for JSON data (isFormData: false)
        await apiRequest(
            `/api/quests/${questId}/submit`, 
            'PATCH', 
            submissionData
        );
        
        alert(`Quest attempt submitted successfully!`);

    } catch (error) {
        console.error("Error submitting quest attempt:", error.message);
        alert(`Failed to submit quest attempt. Details: ${error.message}`);
        throw error; // Propagate error for component handling
    }
}


/**
 * Fetches the submissions array for a specific quest from the backend API.
 * @param {string} questId - The ID of the quest.
 * @returns {Promise<Array<object>>} An array of quest submission objects.
 */
export async function fetchQuestSubmissions(questId) {
    try {
        // apiRequest defaults to 'GET' and handles the Bearer token
        const submissions = await apiRequest(`/api/quests/${questId}/submissions`);
        
        console.log(`Submissions fetched for quest ${questId}`);
        return submissions;
        
    } catch (error) {
        console.error("Error fetching quest submissions:", error.message);
        return []; 
    }
}

/**
 * Sends a request to the backend to remove a submission from a quest by index.
 * @param {string} questId - The ID of the quest.
 * @param {number} submissionIndex - The index of the submission to remove in the array.
 * @returns {Promise<void>}
 */
export async function removeQuestSubmission(questId, submissionIndex) {
    try {
        console.log(`Requesting removal of submission at index ${submissionIndex} for quest ${questId}`);
        
        const body = {
            submissionIndex: submissionIndex // Send index in the request body
        };

        // Use apiRequest with 'PATCH' to send the removal request
        await apiRequest(
            `/api/quests/${questId}/submissions/remove`, 
            'PATCH', 
            body
        );
        
        alert(`Submission removed successfully from quest ${questId}!`);

    } catch (error) {
        console.error("Error removing quest submission:", error.message);
        alert(`Failed to remove submission. Details: ${error.message}`);
        throw error; // Re-throw the error for component-level handling
    }
}

/**
 * Sends a request to the backend to approve a submission, award points, and close the quest.
 * Only the quest creator is authorized to call this endpoint.
 * @param {string} questId - The ID of the quest to close.
 * @param {string} approvedUserId - The ID of the user whose submission is being approved.
 * @returns {Promise<void>}
 */
export async function approveSubmissionAndCloseQuest(questId, approvedUserId) {
    try {
        console.log(`Approving submission for user ${approvedUserId} and closing quest ${questId}`);
        
        const body = {
            approvedUserId: approvedUserId 
        };

        // Use apiRequest with 'POST' (or PATCH) to trigger the complex server-side logic
        await apiRequest(
            `/api/quests/${questId}/approve`, 
            'POST', 
            body
        );
        
        alert(`Submission approved and quest closed! Points awarded to both ${approvedUserId} and the creator.`);

    } catch (error) {
        console.error("Error approving and closing quest:", error.message);
        alert(`Failed to approve and close quest. Details: ${error.message}`);
        throw error; // Propagate error for component-level handling
    }
}


/**
 * Sends a request to the backend to remove all submissions for a specific user from a quest.
 * @param {string} questId - The ID of the quest.
 * @param {string} userId - The ID of the user whose submissions are to be removed.
 * @returns {Promise<void>}
 */
export async function removeSubmissionByUserId(questId, userId) {
    try {
        console.log(`Requesting removal of submissions for user ${userId} from quest ${questId}`);
        
        const body = {
            userIdToRemove: userId // Mapped to the backend parameter
        };

        // Use apiRequest with 'PATCH' to send the removal request
        await apiRequest(
            `/api/quests/${questId}/submissions/remove-by-user`, 
            'PATCH', 
            body
        );
        
        alert(`All submissions for user ${userId} successfully removed from quest ${questId}!`);

    } catch (error) {
        console.error("Error removing submission by user ID:", error.message);
        alert(`Failed to remove submissions. Details: ${error.message}`);
        throw error; // Re-throw the error for component-level handling
    }
}