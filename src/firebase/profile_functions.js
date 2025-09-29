import { db, auth } from "./firebase";
import { collection, getDocs, getDoc, updateDoc, doc } from "firebase/firestore";





export async function getProfileData() {
  const user = auth.currentUser;
  if (!user) throw new Error("User is not authenticated");

  const userDocRef = doc(db, "Users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) throw new Error("User document does not exist in Firestore");

  const userData = userDoc.data();
  return {
    uid: user.uid,
    Name: userData.Name,
    LeaderBoardPoints: userData.LeaderBoardPoints,
    CompletedQuests: userData.CompletedQuests || [],
    acceptedQuests: userData.acceptedQuests || [],
    Level: userData.Level,
    Bio: userData.Bio,
    profilePicture: userData.ProfilePictureUrl,
    Experience: userData.Experience ?? 0,
    SpendablePoints: userData.SpendablePoints ?? 0,
  };
}

export async function addProfileFields() {
  const usersCollectionRef = collection(db, "Users");

  try {
    const querySnapshot = await getDocs(usersCollectionRef);

    if (querySnapshot.empty) {
      console.log("No documents found in the users collection.");
      return;
    }

    querySnapshot.forEach(async (document) => {
      const userDocRef = doc(db, "Users", document.id);
      await updateDoc(userDocRef, {
        Level: 0,
        CompletedQuests: [],
        Bio: "",
        SpendablePoints: 0,
        Experience: 0,
        Quests: [],



      });
      //console.log(`Document with ID: ${document.id} successfully updated.`);
    });

    //console.log("All documents processed.");

  } catch (error) {
    console.error("Error updating documents:", error);
  }


}

export async function updateProfileData({ uid, Name, Bio, ProfilePictureUrl }) {
  if (!uid) throw new Error("No user ID provided");
  const userDocRef = doc(db, "Users", uid);
  const updateObj = {};
  if (Name !== undefined) updateObj.Name = Name;
  if (Bio !== undefined) updateObj.Bio = Bio;
  if (ProfilePictureUrl !== undefined) updateObj.ProfilePictureUrl = ProfilePictureUrl;
  await updateDoc(userDocRef, updateObj);
}

// List of all possible inventory item IDs
const ALL_INVENTORY_ITEMS = [
  'card-customization',
  'background-customization',
  'border-1',
  'border-2',
  'border-3',
  'border-4',
  'border-5',
  'border-6'
];

// Returns the user's inventoryItems object, initializing if missing
export async function getUserInventoryItems() {
  const user = auth.currentUser;
  if (!user) throw new Error("User is not authenticated");

  const userDocRef = doc(db, "Users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) throw new Error("User document does not exist in Firestore");

  let userData = userDoc.data();
  let inventory = userData.inventoryItems;

  // If inventoryItems field doesn't exist, initialize it
  if (!inventory) {
    inventory = {};
    ALL_INVENTORY_ITEMS.forEach(itemId => {
      inventory[itemId] = false; // false means locked
    });
    await updateDoc(userDocRef, { inventoryItems: inventory });
  }

  return inventory;
}

export async function unlockInventoryItem(itemId, cost) {
  const user = auth.currentUser;
  if (!user) throw new Error("User is not authenticated");

  const userDocRef = doc(db, "Users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) throw new Error("User document does not exist in Firestore");

  const userData = userDoc.data();
  const inventory = userData.inventoryItems || {};
  const spendablePoints = userData.SpendablePoints ?? 0;

  if (inventory[itemId]) throw new Error("Item already unlocked");
  if (spendablePoints < cost) throw new Error("Not enough points");

  inventory[itemId] = true;
  await updateDoc(userDocRef, {
    inventoryItems: inventory,
    SpendablePoints: spendablePoints - cost
  });

  return inventory;
}

export async function setCustomisation({ borderId, cardColor, backgroundColor }) {
  const user = auth.currentUser;
  if (!user) throw new Error("User is not authenticated");
  const userDocRef = doc(db, "Users", user.uid);

  // Only update provided fields
  const updateObj = {};
  if (borderId !== undefined) updateObj["customisation.borderId"] = borderId;
  if (cardColor !== undefined) updateObj["customisation.cardColor"] = cardColor;
  if (backgroundColor !== undefined) updateObj["customisation.backgroundColor"] = backgroundColor;

  await updateDoc(userDocRef, updateObj);
}

export async function getCustomisation() {
  const user = auth.currentUser;
  if (!user) throw new Error("User is not authenticated");
  const userDocRef = doc(db, "Users", user.uid);
  const userDoc = await getDoc(userDocRef);
  if (!userDoc.exists()) throw new Error("User document does not exist in Firestore");
  return userDoc.data().customisation || {};
}

