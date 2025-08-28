
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { getStorage } from "firebase/storage";




const firebaseConfig = {
  apiKey: "AIzaSyBjatUHRXn-vb8yZS_G2I9qRjr49G0Uqjg",
  authDomain: "bloobase2.firebaseapp.com",
  projectId: "bloobase2",
  storageBucket: "bloobase2.firebasestorage.app",
  messagingSenderId: "911192519911",
  appId: "1:911192519911:web:6a15e3e1773d69fc305e42",
  measurementId: "G-KW51J2YSJR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

async function addUserToFirestore(userId, email, name, role, autheProvider, leaderboardPoints) {
  try {
    const userDocRef = doc(db, "Users", userId);
    const userData = {
      Email: email,
      Name: name,
      joinedAt: serverTimestamp(),
      Role: role,
      LeaderBoardPoints: leaderboardPoints,
      autheProvider: autheProvider,
      Level: 0,
      CompletedQuests: [],
      Bio: "",
      SpendablePoints: 0,
      Experience: 0,
      Quests: [],
    };
    await setDoc(userDocRef, userData);
    console.log("User added to Firestore!");
  } catch (error) {
    console.error("Error adding user to Firestore:", error);
  }
}

// Function to get user data from Firestore
async function getUserData() {
  const user = auth.currentUser; // Accessing the authenticated user
  if (!user) {
    throw new Error("User is not authenticated");
  }

  const userDocRef = doc(db, "Users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    throw new Error("User document does not exist in Firestore");
  }

  console.log(userDoc.data().Role)

  return userDoc.data(); // Returns the user data from Firestore
}

// Function to get the user's name
async function getUserName() {
  try {
    const userData = await getUserData(); // Await the user data
    return userData.Name; // Return the name from the user data
  } catch (error) {
    console.error("Error fetching user name:", error);
    return null; // In case of error, return null
  }
}
async function getUserRole() {
  try {
    const userData = await getUserData(); // Await the user data
    return userData.Role; // Return the name from the user data
  } catch (error) {
    console.error("Error fetching user name:", error);
    return null; // In case of error, return null
  }
}
const logout = () => {
  auth.signOut();

}
const signupNormUser = ({ Name, Email, Password, ConfirmPassword, Role, LeaderBoardPoints }) => {
  if (Password !== ConfirmPassword) {
    alert("Passwords do not match");
    return Promise.reject(new Error("Passwords do not match"));
  }

  return createUserWithEmailAndPassword(auth, Email, Password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log(user.emailVerified);
      return sendEmailVerification(user)
        .then(() => {
          // Pass the correct fields to addUserToFirestore
          addUserToFirestore(user.uid, Email, Name, Role, 'Firebase Auth', LeaderBoardPoints);
          alert("Account created! Please check your email for verification.");
        })
        .catch((error) => {
          console.error("Error sending verification email:", error);
          alert("Error sending verification email.");
          throw error;
        });
    })
    .catch((error) => {
      alert(`Signup failed: ${error.message}`);
      throw error;
    });
};

const loginNormUser = async ({ email, password }) => {
  try {

    // Perform the email/password sign-in
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Check email verification
    if (!user.emailVerified) {
      alert("Please verify your email before logging in.");
      // Sign out the user who just signed in but isn't verified
      await auth.signOut();
      // Throw an error to be caught by the caller (Login.js)
      throw new Error("Email not verified");
    }

    alert('Login successful!');
    // Return the authenticated user object
    return user;

  } catch (error) {
    console.error("Login failed:", error);
    // Re-throw the error so it can be caught in the component
    throw error;
  }
};

export {
  app,
  auth,
  db,
  storage,
  doc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  signupNormUser,
  addUserToFirestore,
  loginNormUser,
  getUserName,
  getUserRole,
  getUserData,
  logout
};
