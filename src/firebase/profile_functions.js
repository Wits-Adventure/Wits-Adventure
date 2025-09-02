// client/src/api/profile-client.js

// The client-side file now only uses fetch, no direct Firestore calls for writing.
// The auth import is kept to get the current user's UID.
import { auth } from "./firebase"; 

/**
 * Fetches a user's profile data from the backend API.
 * @param {string} uid - The user's ID.
 * @returns {Promise<object>} The user's profile data.
 */
export async function getProfileData(uid) {
  if (!uid) {
    throw new Error("User ID is required to fetch profile data.");
  }

  try {
    const response = await fetch(`http://localhost:5000/api/profile?uid=${uid}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch profile data.");
    }
    const profileData = await response.json();
    return profileData;
  } catch (error) {
    console.error("Error fetching profile data:", error);
    throw error;
  }
}

/**
 * Updates a user's profile data by sending a request to the backend API.
 * @param {object} profileUpdate - The object containing the user's UID and fields to update.
 */
export async function updateProfileData(profileUpdate) {
  if (!profileUpdate || !profileUpdate.uid) {
    throw new Error("User ID and update data are required.");
  }

  try {
    const response = await fetch('http://localhost:5000/api/profile/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileUpdate)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update profile.');
    }
    console.log("Profile updated successfully!");
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}

/**
 * Triggers the backend function to add profile fields to all users.
 * NOTE: This is an administrative function and should not be accessible to all users.
 */
export async function addProfileFields() {
  try {
    const response = await fetch('http://localhost:5000/api/profile/add-fields', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add profile fields.');
    }
    console.log("Profile fields added successfully for all users!");
  } catch (error) {
    console.error("Error adding profile fields:", error);
    throw error;
  }
}