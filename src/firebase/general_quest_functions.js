import { db } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { doc, updateDoc, arrayUnion, getDoc, setDoc, GeoPoint } from "firebase/firestore";

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