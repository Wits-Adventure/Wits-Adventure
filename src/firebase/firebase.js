
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';




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

const apiURL = 'http://localhost:5000'
//const apiURL = 'https://bloobaseapi-cfbrbub4fzg5b8aq.southafricanorth-01.azurewebsites.net'


export const apiRequest = async (url, method = 'GET', body = null, isFormData = false) => {
  const headers = {};

  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    if (isFormData) {
      config.body = body;
    } else {
      headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(body);
    }
  }

  const response = await fetch(`${apiURL}${url}`, config);

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch (_) {}
    throw new Error(errorMessage);
  }

  return await response.json();
};


async function addUserToFirestore(userId, email, name, role) {
  try {
    await apiRequest('/api/users', 'POST', { userId, email, name, role });
    console.log("User added via API!");
    const userDocRef = doc(db, "Users", userId);
    const userData = {
      Email: email,
      Name: name,
      joinedAt: serverTimestamp(),
      Role: role,
     
     
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

/**
 * Fetches the currently authenticated user's data from the backend.
 * @returns {Promise<object>} The user data from Firestore.
 */
 const getUserData = async () => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User is not authenticated");
    }

    try {
        // Call the backend GET endpoint using apiRequest
        const userData = await apiRequest(`/api/users/${user.uid}`);
        return userData;
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error; // Re-throw the error to be handled by the UI
    }
};


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

const signupNormUser = ({ Name, Email, Password, ConfirmPassword, Role }) => {
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
          addUserToFirestore(user.uid, Email, Name, Role);
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


/**
 * Uploads a file to the backend API and returns its URL.
 * @param {File} file - The image file to upload.
 * @returns {Promise<string>} A promise that resolves with the public URL of the uploaded image.
 */
export const uploadImage = async (file) => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User is not authenticated. Cannot upload image.");
    }

    const idToken = await user.getIdToken();
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        // Updated to use the new endpoint
        const response = await apiRequest('/api/upload/image', 'POST', formData, true, idToken);
        return response.imageUrl;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
};
export {
  app,
  auth,
  db,
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
