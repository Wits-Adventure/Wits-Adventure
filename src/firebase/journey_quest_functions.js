import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "./firebase";

/**
 * Get the current user's journey quest progress from Firestore
 * @returns {Promise<Object>} Journey quest progress object
 */
export async function getJourneyQuestProgress() {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User is not authenticated");
    }

    try {
        const userDocRef = doc(db, "Users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            return {
                currentJourneyQuest: userData.currentJourneyQuest || null,
                currentJourneyStop: userData.currentJourneyStop || 1,
                completedJourneyQuests: userData.completedJourneyQuests || []
            };
        } else {
            // Initialize default values if user document doesn't exist
            return {
                currentJourneyQuest: null,
                currentJourneyStop: 1,
                completedJourneyQuests: []
            };
        }
    } catch (error) {
        console.error("Error fetching journey quest progress:", error);
        throw error;
    }
}

/**
 * Accept a journey quest (abandons any current one)
 * @param {string} journeyQuestId - The ID of the journey quest to accept
 */
export async function acceptJourneyQuest(journeyQuestId) {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User is not authenticated");
    }

    try {
        const userDocRef = doc(db, "Users", user.uid);
        await updateDoc(userDocRef, {
            currentJourneyQuest: journeyQuestId,
            currentJourneyStop: 1
        });
    } catch (error) {
        console.error("Error accepting journey quest:", error);
        throw error;
    }
}

/**
 * Abandon the current journey quest
 */
export async function abandonJourneyQuest() {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User is not authenticated");
    }

    try {
        const userDocRef = doc(db, "Users", user.uid);
        await updateDoc(userDocRef, {
            currentJourneyQuest: null,
            currentJourneyStop: 1
        });
    } catch (error) {
        console.error("Error abandoning journey quest:", error);
        throw error;
    }
}

/**
 * Advance to the next stop in the current journey quest
 * @param {number} nextStop - The next stop number
 */
export async function advanceJourneyQuestStop(nextStop) {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User is not authenticated");
    }

    try {
        const userDocRef = doc(db, "Users", user.uid);
        await updateDoc(userDocRef, {
            currentJourneyStop: nextStop
        });
    } catch (error) {
        console.error("Error advancing journey quest stop:", error);
        throw error;
    }
}

/**
 * Complete the current journey quest
 * @param {string} journeyQuestId - The ID of the completed journey quest
 * @param {number} rewardPoints - Points to award for completion
 */
export async function completeJourneyQuest(journeyQuestId, rewardPoints) {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User is not authenticated");
    }

    try {
        const userDocRef = doc(db, "Users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const completedQuests = userData.completedJourneyQuests || [];

            // Add the quest to completed list if not already there
            if (!completedQuests.includes(journeyQuestId)) {
                completedQuests.push(journeyQuestId);
            }

            await updateDoc(userDocRef, {
                currentJourneyQuest: null,
                currentJourneyStop: 1,
                completedJourneyQuests: completedQuests,
                LeaderBoardPoints: (userData.LeaderBoardPoints || 0) + rewardPoints
            });
        }
    } catch (error) {
        console.error("Error completing journey quest:", error);
        throw error;
    }
}




