import { apiRequest } from "./firebase";
// Removed: import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
// Removed: import { db, auth } from "./firebase";

/**
 * Get the current user's journey quest progress from the backend API.
 * @returns {Promise<Object>} Journey quest progress object
 */
export async function getJourneyQuestProgress() {
    try {
        // GET /api/quests/journey/progress
        return await apiRequest('/api/quests/journey/progress');
    } catch (error) {
        console.error("Error fetching journey quest progress:", error);
        // Return default state on error for UX stability
        return {
            currentJourneyQuest: null,
            currentJourneyStop: 1,
            completedJourneyQuests: []
        };
    }
}

/**
 * Accept a journey quest (abandons any current one) via the backend API.
 * @param {string} journeyQuestId - The ID of the journey quest to accept
 */
export async function acceptJourneyQuest(journeyQuestId) {
    try {
        // PATCH /api/quests/journey/accept
        await apiRequest('/api/quests/journey/accept', 'PATCH', {
            journeyQuestId: journeyQuestId
        });
        console.log(`Journey quest ${journeyQuestId} accepted successfully.`);
    } catch (error) {
        console.error("Error accepting journey quest:", error);
        throw error;
    }
}

/**
 * Advance the current journey quest stop via the backend API.
 * @param {string} journeyQuestId - The ID of the current journey quest
 * @param {number} newStop - The new stop number to set
 */
export async function advanceJourneyQuestStop(journeyQuestId, newStop) {
    try {
        // PATCH /api/quests/journey/advance
        await apiRequest('/api/quests/journey/advance', 'PATCH', {
            journeyQuestId: journeyQuestId,
            newStop: newStop
        });
        console.log(`Journey quest ${journeyQuestId} advanced to stop ${newStop}.`);
    } catch (error) {
        console.error("Error advancing journey quest stop:", error);
        throw error;
    }
}

/**
 * Complete the current journey quest via the backend API.
 * @param {string} journeyQuestId - The ID of the completed journey quest
 * @param {number} rewardPoints - Points to award for completion
 */
export async function completeJourneyQuest(journeyQuestId, rewardPoints) {
    try {
        // POST /api/quests/journey/complete
        await apiRequest('/api/quests/journey/complete', 'POST', {
            journeyQuestId: journeyQuestId,
            rewardPoints: rewardPoints
        });
        console.log(`Journey quest ${journeyQuestId} completed successfully.`);
    } catch (error) {
        console.error("Error completing journey quest:", error);
        throw error;
    }
}

/**
 * Resets the current journey quest fields, effectively abandoning it.
 * Corresponds to: PATCH /api/quests/journey/abandon
 */
export async function abandonJourneyQuest() {
    try {
        // PATCH /api/quests/journey/abandon
        // No body required, as the user ID and data to reset are inferred on the backend.
        await apiRequest('/api/quests/journey/abandon', 'PATCH');
        console.log('Current journey quest abandoned successfully.');
    } catch (error) {
        console.error("Error abandoning journey quest:", error);
        throw error;
    }
}
