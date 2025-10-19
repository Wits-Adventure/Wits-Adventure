import { storage } from './firebase'; // Keep for Storage only
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Keep for Storage only
import { apiRequest, auth } from './firebase'; 

/**
 * Fetches all quests from the backend API.
 * Corresponds to: GET /api/quests
 * @returns {Promise<Array<object>>} An array of quest objects.
 */
export const getAllQuests = async () => {
    try {
        const questsArray = await apiRequest('/api/quests');
        console.log("Quests fetched from backend:", questsArray);
        return questsArray;
    } catch (error) {
        console.error("Error fetching quests:", error);
        return [];
    }
};

/**
 * Uploads an image (if present) and sends quest data to the backend API for creation.
 * Corresponds to: POST /api/quests
 * @param {object} questData - The quest data including a potential imageFile.
 * @returns {Promise<string>} The ID of the newly created quest.
 */
export async function saveQuestToFirestore(questData) {
    try {
        let imageUrl = '';
        const user = auth.currentUser;
        if (!user) throw new Error("Authentication required to create a quest.");

        // 1. FRONTEND: Handle Image Upload to Storage
        if (questData.imageFile) {
            // Use the authenticated user's ID to ensure unique paths
            const storageRef = ref(storage, `quest_images/${user.uid}_${Date.now()}`);
            await uploadBytes(storageRef, questData.imageFile);
            imageUrl = await getDownloadURL(storageRef);
        }

        // 2. FRONTEND: Prepare data for the backend
        const dataToSend = {
            ...questData,
            imageUrl: imageUrl, // Pass the URL, not the file
            // The backend gets creatorId from the auth token (req.user.uid)
            imageFile: undefined // Must remove the File object before JSON serialization
        };

        // 3. FRONTEND: Send the creation request to the backend
        const response = await apiRequest('/api/quests', 'POST', dataToSend);
        
        alert(`Quest "${questData.name}" added successfully!`);
        return response.questId;

    } catch (error) {
        console.error("Error adding quest:", error);
        alert(`Failed to add quest. ${error.message || 'Please try again.'}`); 
        throw error;
    }
}

/**
 * Allows the current user to accept a quest.
 * Corresponds to: PATCH /api/quests/:questId/accept
 * @param {string} questId - The ID of the quest to accept.
 */
export async function acceptQuest(questId) {
    try {
        await apiRequest(`/api/quests/${questId}/accept`, 'PATCH');
        console.log(`Quest ${questId} accepted successfully.`);
    } catch (error) {
        console.error("Error accepting quest:", error);
        throw error;
    }
}

/**
 * Submits an attempt (image) for a quest by uploading the image and calling the backend.
 * Corresponds to: PATCH /api/quests/:questId/submit
 * @param {string} questId - The ID of the quest.
 * @param {File} file - The image file to upload.
 * @param {string} userName - The name of the user.
 */
export async function submitQuestAttempt(questId, file, userName) {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User is not authenticated. Cannot submit quest.");
    }

    // 1. FRONTEND: Upload image to Firebase Storage
    const storageRef = ref(storage, `quest_submissions/${questId}/${user.uid}_${Date.now()}`);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);

    // 2. FRONTEND: Call the backend endpoint
    await apiRequest(`/api/quests/${questId}/submit`, 'PATCH', {
        imageUrl: imageUrl,
        userName: userName,
        // The backend infers userId from the auth token
    });
}

/**
 * Fetches submissions for a quest by ID from the backend API.
 * Corresponds to: GET /api/quests/:questId/submissions
 * @param {string} questId - The ID of the quest.
 * @returns {Promise<Array<object>>} An array of submission objects.
 */
export async function fetchQuestSubmissions(questId) {
    return await apiRequest(`/api/quests/${questId}/submissions`);
}

/**
 * Removes a submission from a quest by index via the backend API.
 * Corresponds to: PATCH /api/quests/:questId/submissions/remove
 * @param {string} questId - The ID of the quest.
 * @param {number} submissionIndex - The index of the submission to remove.
 */
export async function removeQuestSubmission(questId, submissionIndex) {
    await apiRequest(`/api/quests/${questId}/submissions/remove`, 'PATCH', {
        submissionIndex: submissionIndex
    });
}

/**
 * Removes all submissions for a specific userId from a quest via the backend API.
 * Corresponds to: PATCH /api/quests/:questId/submissions/remove-by-user
 * @param {string} questId - The ID of the quest.
 * @param {string} userId - The ID of the user whose submissions to remove.
 */
export async function removeSubmissionByUserId(questId, userId) {
    await apiRequest(`/api/quests/${questId}/submissions/remove-by-user`, 'PATCH', {
        userIdToRemove: userId
    });
}

/**
 * Approves a submission, awards points, and closes the quest via the backend API.
 * Corresponds to: POST /api/quests/:questId/approve
 * @param {string} questId - The ID of the quest to approve/close.
 * @param {string} approvedUserId - The ID of the user whose submission is being approved.
 */
export async function approveSubmissionAndCloseQuest(questId, approvedUserId) {
    await apiRequest(`/api/quests/${questId}/approve`, 'POST', {
        approvedUserId: approvedUserId
    });
}

/**
 * Allows the current user to abandon an accepted quest.
 * Corresponds to: PATCH /api/quests/:questId/abandon
 * @param {string} questId - The ID of the quest to abandon.
 */
export async function abandonQuest(questId) {
    try {
        await apiRequest(`/api/quests/${questId}/abandon`, 'PATCH');
        console.log(`Quest ${questId} abandoned successfully.`);
    } catch (error) {
        console.error("Error abandoning quest:", error);
        throw error;
    }
}

/**
 * Closes (archives or deletes) a quest and removes it from all users' accepted lists.
 * Corresponds to: DELETE /api/quests/:questId
 * @param {string} questId - The ID of the quest to close/remove.
 */
export async function closeQuestAndRemoveFromUsers(questId) {
    try {
        // We use DELETE method here, as the backend will handle authorization and cleanup
        await apiRequest(`/api/quests/${questId}`, 'DELETE');
        console.log(`Quest ${questId} closed and removed from users successfully.`);
    } catch (error) {
        console.error("Error closing quest:", error);
        throw error;
    }
}
