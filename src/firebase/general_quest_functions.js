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

export async function saveQuestToFirestore(questData) {
    try {
        let imageUrl = '';
        // Check if an image file was provided to upload
        if (questData.imageFile) {
            // 1. Upload image to Firebase Storage
            const storageRef = ref(storage, `quest_images/${questData.creatorId}_${Date.now()}`);
            await uploadBytes(storageRef, questData.imageFile);
            // 2. Get the download URL
            imageUrl = await getDownloadURL(storageRef);
        }

        // 3. Save the quest with the URL to Firestore
        const questRef = await addDoc(collection(db, "Quests"), {
            name: questData.name,
            radius: questData.radius,
            reward: questData.reward,
            location: new GeoPoint(questData.lat, questData.lng),
            imageUrl: imageUrl, // <-- Save the short URL, not the Base64 data
            creatorId: questData.creatorId,
            creatorName: questData.creatorName,
            createdAt: serverTimestamp(),
            active: true,
            acceptedBy: [],
            emoji: questData.emoji,
            color: questData.color
        });
        alert(`Quest "${questData.name}" added successfully!`);
        console.log("Quest ID:", questRef.id);
        return questRef.id;
    } catch (error) {
        console.error("Error adding quest to Firestore:", error);
        alert("Failed to add quest. Please try again.");
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

// Submit an attempt (image) for a quest
export async function submitQuestAttempt(questId, userId, file, userName) {
    // 1. Upload image to Firebase Storage
    const storageRef = ref(storage, `quest_submissions/${questId}/${userId}_${Date.now()}`);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);

    // 2. Get current submissions
    const questRef = doc(db, "Quests", questId);
    const questSnap = await getDoc(questRef);
    let submissions = questSnap.exists() ? questSnap.data().submissions || [] : [];

    // 3. Remove previous submission by this user
    submissions = submissions.filter(sub => sub.userId !== userId);

    // 4. Add new submission
    submissions.push({
        userId,
        Name: userName,
        imageUrl,
        submittedAt: Date.now()
    });

    // 5. Update quest document
    await updateDoc(questRef, { submissions });
}

// Fetch submissions for a quest by ID
export async function fetchQuestSubmissions(questId) {
    const questRef = doc(db, "Quests", questId);
    const questSnap = await getDoc(questRef);
    if (questSnap.exists()) {
        const data = questSnap.data();
        return data.submissions || [];
    }
    return [];
}

// Remove a submission from a quest by index
export async function removeQuestSubmission(questId, submissionIndex) {
    const questRef = doc(db, "Quests", questId);
    const questSnap = await getDoc(questRef);
    if (!questSnap.exists()) return;

    const data = questSnap.data();
    const submissions = data.submissions || [];
    console.log("Before removal:", submissions, "Index:", submissionIndex);

    if (submissionIndex < 0 || submissionIndex >= submissions.length) return;

    submissions.splice(submissionIndex, 1);
    console.log("After removal:", submissions);

    await updateDoc(questRef, { submissions });
}

// Approve a submission, award points, and clean up quest
export async function approveSubmissionAndCloseQuest(questId, approvedUserId) {
    // 1. Get quest data
    const questRef = doc(db, "Quests", questId);
    const questSnap = await getDoc(questRef);
    if (!questSnap.exists()) return;
    const questData = questSnap.data();

    const creatorId = questData.creatorId;
    const reward = questData.reward ?? 0;

    // Only keep the specified fields for CompletedQuests
    const completedQuestEntry = {
        color: questData.color,
        createdAt: questData.createdAt,
        creatorId: questData.creatorId,
        creatorName: questData.creatorName,
        emoji: questData.emoji,
        imageUrl: questData.imageUrl,
        location: questData.location,
        name: questData.name,
        questId: questId,
        radius: questData.radius,
        reward: questData.reward,
        completedAt: Date.now()
    };

    // 2. Award points and experience to approved user
    const approvedUserRef = doc(db, "Users", approvedUserId);
    const approvedUserSnap = await getDoc(approvedUserRef);
    if (approvedUserSnap.exists()) {
        const prevPoints = approvedUserSnap.data().SpendablePoints ?? 0;
        const prevExp = approvedUserSnap.data().Experience ?? 0;
        await updateDoc(approvedUserRef, {
            SpendablePoints: prevPoints + reward,
            Experience: prevExp + reward,
            CompletedQuests: [
                ...(approvedUserSnap.data().CompletedQuests ?? []),
                {
                    questId,
                    ...questData
                }
            ]
        });
    }

    // 3. Award points and experience to quest creator
    if (creatorId) {
        const creatorRef = doc(db, "Users", creatorId);
        const creatorSnap = await getDoc(creatorRef);
        if (creatorSnap.exists()) {
            const prevPoints = creatorSnap.data().SpendablePoints ?? 0;
            const prevExp = creatorSnap.data().Experience ?? 0;
            await updateDoc(creatorRef, {
                SpendablePoints: prevPoints + reward,
                Experience: prevExp + reward,
                CompletedQuests: [
                    ...(creatorSnap.data().CompletedQuests ?? []),
                    {
                        questId,
                        ...questData
                    }
                ]
            });
        }
    }

    // 4. Remove questId from all users' acceptedQuests arrays
    const usersSnapshot = await getDocs(collection(db, "Users"));
    const batch = [];
    usersSnapshot.forEach(userDoc => {
        const userData = userDoc.data();
        if (userData.acceptedQuests && userData.acceptedQuests.includes(questId)) {
            batch.push(
                updateDoc(doc(db, "Users", userDoc.id), {
                    acceptedQuests: userData.acceptedQuests.filter(qid => qid !== questId)
                })
            );
        }
    });
    await Promise.all(batch);

    // 5. Delete the quest document
    await deleteDoc(questRef);
}

export async function removeSubmissionByUserId(questId, userId) {
    const questRef = doc(db, "Quests", questId);
    const questSnap = await getDoc(questRef);
    if (!questSnap.exists()) return;

    const data = questSnap.data();
    const submissions = (data.submissions || []).filter(sub => sub.userId !== userId);

    await updateDoc(questRef, { submissions });
}