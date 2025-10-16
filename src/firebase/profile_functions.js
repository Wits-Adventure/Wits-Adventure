import { db, auth } from "./firebase";
import { collection, getDocs, getDoc, updateDoc, doc } from "firebase/firestore";

// NOTE: 'apiRequest' is assumed to be defined/imported elsewhere in your project
// (e.g., 'import { apiRequest } from "./api";') 

// -----------------------------------------------------------------
// 1. PROFILE MANAGEMENT (Using Backend API)
// -----------------------------------------------------------------

/**
 * Fetches the authenticated user's profile data from the backend API.
 * The authentication token is automatically handled by apiRequest.
 * @returns {Promise<object>} The structured user profile data.
 */
export async function getProfileData() {
    try {
        // apiRequest defaults to 'GET' and sends the Authorization token
        const profileData = await apiRequest('/api/users/profile');
        
        console.log("Profile data successfully fetched.");
        return profileData;

    } catch (error) {
        console.error("Error fetching profile data:", error.message);
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
        
        // Uses the secure, server-side batch job
        const response = await apiRequest(
            '/api/users/init-fields', 
            'POST', 
            {} // Empty body
        );
        
        alert(`Profile field initialization finished: ${response.message}`);

    } catch (error) {
        console.error("Error triggering profile field initialization:", error.message);
        alert(`Failed to run profile field initialization. Details: ${error.message}`);
        throw error;
    }
}

/**
 * Updates the authenticated user's profile data via the backend API.
 * @param {object} profileData - Object containing the fields to update: { uid, Name, Bio, ProfilePictureUrl }.
 * @returns {Promise<void>}
 */
export async function updateProfileData(profileData) {
    // apiRequest handles throwing an error if the request fails
    const response = await apiRequest(
        '/api/users/profile', 
        'PATCH', 
        profileData // Pass the data directly; backend handles filtering and validation
    );
    
    console.log(`Profile update successful: ${response.message}`);
}

// -----------------------------------------------------------------
// 2. INVENTORY & CUSTOMIZATION (Using Direct Firestore SDK)
// -----------------------------------------------------------------

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

/**
 * Returns the user's inventoryItems object, initializing if missing.
 * @returns {Promise<object>} The user's inventory items object.
 */
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
        // Write the initialized inventory back to Firestore
        await updateDoc(userDocRef, { inventoryItems: inventory });
    }

    return inventory;
}

/**
 * Attempts to unlock an inventory item by checking points and performing an update.
 * NOTE: This client-side function is susceptible to race conditions and should be 
 * converted to a Firestore Transaction or a Backend API call for high-security applications.
 * @param {string} itemId - The ID of the item to unlock.
 * @param {number} cost - The cost in SpendablePoints.
 * @returns {Promise<object>} The updated inventory object.
 */
export async function unlockInventoryItem(itemId, cost) {
    const user = auth.currentUser;
    if (!user) throw new Error("User is not authenticated");

    const userDocRef = doc(db, "Users", user.uid);
    // Use getDoc() to read current state
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) throw new Error("User document does not exist in Firestore");

    const userData = userDoc.data();
    const inventory = userData.inventoryItems || {};
    const spendablePoints = userData.SpendablePoints ?? 0;

    if (inventory[itemId]) throw new Error("Item already unlocked");
    if (spendablePoints < cost) throw new Error("Not enough points");

    // Perform the client-side write
    inventory[itemId] = true;
    await updateDoc(userDocRef, {
        inventoryItems: inventory,
        // WARNING: This is a direct read/write update and not atomic. 
        // A server-side transaction is safer for financial operations.
        SpendablePoints: spendablePoints - cost
    });

    return inventory;
}

/**
 * Sets the user's current customization settings.
 * @param {object} settings - The settings object: { borderId, cardColor, backgroundColor }.
 * @returns {Promise<void>}
 */
export async function setCustomisation({ borderId, cardColor, backgroundColor }) {
    const user = auth.currentUser;
    if (!user) throw new Error("User is not authenticated");
    const userDocRef = doc(db, "Users", user.uid);

    // Only update provided fields using dot notation for nested fields
    const updateObj = {};
    if (borderId !== undefined) updateObj["customisation.borderId"] = borderId;
    if (cardColor !== undefined) updateObj["customisation.cardColor"] = cardColor;
    if (backgroundColor !== undefined) updateObj["customisation.backgroundColor"] = backgroundColor;

    await updateDoc(userDocRef, updateObj);
}

/**
 * Retrieves the user's current customization settings.
 * @returns {Promise<object>} The customization settings object.
 */
export async function getCustomisation() {
    const user = auth.currentUser;
    if (!user) throw new Error("User is not authenticated");
    const userDocRef = doc(db, "Users", user.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) throw new Error("User document does not exist in Firestore");
    
    // Return the nested 'customisation' object, or an empty object if missing
    return userDoc.data().customisation || {};
}