import { db } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { doc, updateDoc, arrayUnion, getDoc, setDoc, GeoPoint, deleteDoc } from "firebase/firestore";
import { uploadQuestImage } from "./storage";

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

// Submit quest proof
export async function submitQuestProof(questId, userId, file) {
  console.log("submitQuestProof called with:", { questId, userId, file });

  if (!questId || !userId || !file) {
    throw new Error("Missing parameters for submitQuestProof");
  }

  try {
    // 1. Upload the proof image
    console.log("Uploading proof image...");
    const imageUrl = await uploadQuestImage(file, questId, userId);
    console.log("Image uploaded, URL:", imageUrl);

    // 2. Create a new document in the CompletedQuests collection
    const completedRef = await addDoc(collection(db, "CompletedQuests"), {
      questId,
      userId,
      imageUrl,
      submittedAt: serverTimestamp(),
      status: "pending"
    });

    console.log("Quest submission saved with ID:", completedRef.id);
    return completedRef.id;

  } catch (error) {
    console.error("Error submitting quest proof:", error);
    throw error;
  }
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