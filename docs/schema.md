Data Schema and Quest Logic

This document outlines the proposed database schema for users and quests, along with the logic for creating and completing quests within our application.

Topic
	

Description

Database Schema
	

The Users Collection: Each document is indexed by the user's userID. This collection stores all user-related data.<br><br>The Quests Collection: Each quest is a document in the Quests collection. The quest schema varies based on the type field.

User Fields
	

Common Fields:<br>- userID: string - A unique identifier.<br>- email: string - The user's email.<br>- role: string - "student" or "admin".<br>- name: string - The user's unique display name.<br>- authProvider: string - The method used for authentication.<br>- joinedAt: timestamp - The account creation date.<br><br>Student-Specific Fields:<br>- bio: string - Profile biography.<br>- points: number - Points for the current leaderboard cycle (resettable).<br>- rank: number - Leaderboard position based on points.<br>- experience: number - A cumulative total of all points (never resets).<br>- level: number - Based on experience.<br>- spendablePoints: number - For profile customizations.<br>- completedQuests: array<string> - IDs of completed quests.<br>- ownedQuests: array<string> - IDs of quests created by this user.<br>- trophies: array - A list of unique achievements.

Quest Fields
	

Common Fields (all types):<br>- title: string<br>- description: string<br>- type: string - "location" or "journey".<br>- creatorId: string - The userID of the creator.<br>- reward: number - Points awarded for completion.<br>- status: string - pending_approval, active, completed, or timed_out.<br>- createdAt: timestamp - The creation date.<br>- completedAt: timestamp - (Optional) The completion date.<br>- acceptedBy: array<string> - User IDs who have accepted the quest.<br><br>location Quest-Specific Fields:<br>- location: GeoPoint - The geographic coordinates.<br>- searchRadius: number - The radius (in meters) for verification.<br>- hintImageURL: string - A URL for the image hint.<br>- riddle: string - The quest riddle.<br>- collectedImages: array<object> - Submitted images for completion.

Journey Quest Fields
	

journey Quest-Specific Fields:<br>- checkpoints: array<object> - A chain of checkpoints, each containing:<br>    - hintImageURL: string<br>    - riddle: string<br>    - location: GeoPoint

Location Quest Process
	

Creation:<br>1. User travels to a physical location.<br>2. Uploads a picture.<br>3. Sets a search radius and writes a riddle.<br>4. Submits for admin approval.<br><br>Completion:<br>1. User accepts an "active" quest.<br>2. Is provided with the riddle, image, and radius.<br>3. Once within the radius, takes and submits a picture.<br>4. Creator verifies the image.<br>5. Upon verification, the user receives points, and the quest is delisted.<br>6. The submitted picture becomes a collectible.

Journey Quest Process
	

Creation:<br>1. Quest maker defines a chain of locations.<br>2. At each physical checkpoint, uploads a hint image and geolocation data.<br>3. Adds riddles for each location and publishes the quest.<br><br>Completion:<br>1. User accepts the quest, unlocking the first checkpoint.<br>2. Travels to the checkpoint's geolocation.<br>3. The API verifies their location, automatically unlocking the next checkpoint.<br>4. User repeats the process for all checkpoints.<br>5. A significantly larger point reward is awarded upon completion.

![alt text](./assets/schema.png)