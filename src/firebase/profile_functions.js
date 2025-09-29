import { db, auth } from "./firebase";
import { collection, getDocs, getDoc, updateDoc, doc } from "firebase/firestore";



/**
 * Fetches the authenticated user's profile data from the backend API.
 * The authentication token is automatically handled by apiRequest.
 * @returns {Promise<object>} The structured user profile data.
 */
export async function getProfileData() {
    try {
        // apiRequest defaults to 'GET' and sends the Authorization token,
        // which the backend uses to identify the user and retrieve their data.
        const profileData = await apiRequest('/api/users/profile');
        
        console.log("Profile data successfully fetched.");
        return profileData;

    } catch (error) {
        console.error("Error fetching profile data:", error.message);
        // Throw the error so the component can handle it (e.g., redirect to login)
        throw new Error(`Failed to load profile: ${error.message}`);
    }
}


/**
 * Triggers an administrative backend job to initialize or update default profile 
 * fields for all users in the database.
 * @returns {Promise<void>}
 */
export async function addProfileFields() {
    try {
        console.log("Requesting backend to initialize default profile fields for all users...");
        
        // Use apiRequest with 'POST' to trigger the secure, server-side batch job
        const response = await apiRequest(
            '/api/users/init-fields', 
            'POST', 
            {} // Empty body, as all data is derived server-side
        );
        
        alert(`Profile field initialization finished: ${response.message}`);

    } catch (error) {
        console.error("Error triggering profile field initialization:", error.message);
        alert(`Failed to run profile field initialization. Details: ${error.message}`);
        throw error; // Propagate error for component-level handling
    }
}


/**
 * Updates the authenticated user's profile data via the backend API.
 * @param {object} profileData - Object containing the fields to update: { uid, Name, Bio, ProfilePictureUrl }.
 * @returns {Promise<void>}
 */
export async function updateProfileData(profileData) {
    // Note: The original function's logic to dynamically build the updateObj
    // is now best done by the calling component, but we pass the full object here.
    
    // apiRequest handles throwing an error if the request fails
    const response = await apiRequest(
        '/api/users/profile', 
        'PATCH', 
        profileData // Pass the data directly; backend handles filtering and validation
    );
    
    console.log(`Profile update successful: ${response.message}`);
}

