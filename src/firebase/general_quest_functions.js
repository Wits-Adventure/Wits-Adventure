import { db } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";

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
            latitude: questData.lat,
            longitude: questData.lng,
            imageUrl: questData.imageUrl,
            creatorId: questData.creatorId,
            creatorName: questData.creatorName,
            createdAt: serverTimestamp(),
            active: true,
            completedBy: []
        });
        alert(`Quest "${questData.name}" added successfully!`);
        console.log("Quest ID:", questRef.id);
        return questRef.id;
    } catch (error) {
        console.error("Error adding quest to Firestore:", error);
        alert("Failed to add quest. Please try again.");
    }
}