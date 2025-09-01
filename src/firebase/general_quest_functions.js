import { db, storage } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { doc, updateDoc, arrayUnion, getDoc, setDoc, GeoPoint, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Future functions should follow this pattern: upload to Storage, save the URL in Firestore.


// Fetch all quests from Firestore
export async function getAllQuests() {
    try {
        const querySnapshot = await getDocs(collection(db, "Quests"));
        const questsArray = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Quests fetched from Firebase:", questsArray); // debug
        return questsArray;
    } catch (error) {
        console.error("Error fetching quests:", error);
        return [];
    }
}

export async function saveQuestToFirestore(questData) {
    try {
        const questRef = await addDoc(collection(db, "Quests"), {
            name: questData.name,
            radius: questData.radius,
            reward: questData.reward,
            location: new GeoPoint(questData.lat, questData.lng),
            imageUrl: questData.imageUrl,
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
export async function acceptQuest(questId, userId) {
    // Add userId to quest's acceptedBy array
    const questRef = doc(db, "Quests", questId);
    await updateDoc(questRef, {
        acceptedBy: arrayUnion(userId)
    });

    // Add questId to user's acceptedQuests array (create array if missing)
    const userRef = doc(db, "Users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        await updateDoc(userRef, {
            acceptedQuests: arrayUnion(questId)
        });
    } else {
        await setDoc(userRef, { acceptedQuests: [questId] }, { merge: true });
    }
}

// Remove quest from all users' acceptedQuests and delete the quest
export async function closeQuestAndRemoveFromUsers(questId) {
    // 1. Delete the quest document
    const questRef = doc(db, "Quests", questId);
    await deleteDoc(questRef);

    // 2. Remove questId from all users' acceptedQuests arrays
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
}

export async function abandonQuest(questId, userId) {
    // Remove userId from quest's acceptedBy array
    const questRef = doc(db, "Quests", questId);
    const questSnap = await getDoc(questRef);
    if (questSnap.exists()) {
        const acceptedBy = questSnap.data().acceptedBy || [];
        await updateDoc(questRef, {
            acceptedBy: acceptedBy.filter(uid => uid !== userId)
        });
    }

    // Remove questId from user's acceptedQuests array
    const userRef = doc(db, "Users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const acceptedQuests = userSnap.data().acceptedQuests || [];
        await updateDoc(userRef, {
            acceptedQuests: acceptedQuests.filter(qid => qid !== questId)
        });
    }
}

// Submit an attempt (image) for a quest
export async function submitQuestAttempt(questId, userId, file, userName) {
    // 1. Upload image to Firebase Storage
    const storageRef = ref(storage, `quest_submissions/${questId}/${userId}_${Date.now()}`);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);

    // 2. Add submission to quest document
    const questRef = doc(db, "Quests", questId);
    await updateDoc(questRef, {
        submissions: arrayUnion({
            userId,
            Name: userName,
            imageUrl,
            submittedAt: Date.now()
        })
    });
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