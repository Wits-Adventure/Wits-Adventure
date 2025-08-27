import { db, auth } from "./firebase";
import { collection, getDocs, getDoc, updateDoc, doc } from "firebase/firestore";




export async function getProfileData() {
  const user = auth.currentUser; // Accessing the authenticated user
  if (!user) {
    throw new Error("User is not authenticated");
  }

  const userDocRef = doc(db, "Users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    throw new Error("User document does not exist in Firestore");
  }

  const userData = userDoc.data();
  return {
    uid: user.uid,
    Name: userData.Name,
    LeaderBoardPoints: userData.LeaderBoardPoints,
    CompletedQuests: userData.CompletedQuests.length,
    Level: userData.Level,
    Bio: userData.Bio,
    profilePicture: userData.ProfilePictureUrl,

    /*
    To be added later, using defaults for now
    Badge: userData.Badge
    Rank: userData.Rank? Have to figure out how we'll get the user's rank
    */



  }


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

