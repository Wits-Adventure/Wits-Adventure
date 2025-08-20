import React, { useState, useEffect } from "react";
import "../css/ProfilePage.css";
import profilePic from "../assets/profile.jpeg";
import editIcon from "../assets/edit_icon.png";
import beginnerIcon from "../assets/Beginner.png";
import { getProfileData } from "../firebase/profile_functions"; // Assuming this is the correct path

export default function ProfilePage() {
  const [user, setUser] = useState(null); // Initialize with null to indicate loading
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [editedBio, setEditedBio] = useState("");
  const [editedProfilePic, setEditedProfilePic] = useState(profilePic);

  // Fetch data from Firebase when the component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const profileData = await getProfileData();
        setUser({
          ...profileData, // Spread the data fetched from Firebase
          username: profileData.Name, // Use Name from Firestore as username
          points: profileData.LeaderBoardPoints,
          questsCompleted: profileData.CompletedQuests,
          level: profileData.Level,
          // You can also add more fields from Firestore here
          bio: profileData.Bio, 
          profilePicture: profilePic, // Placeholder until you add the field in Firestore
          rank: 12, // Placeholder until you figure out how to get the rank
        });
        setEditedUsername(profileData.Name);
        setEditedBio(profileData.Bio); // Set bio for editing
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []); // The empty dependency array ensures this effect runs only once, on mount

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // This is where you would update Firestore with the new data
    // For now, we'll just update the local state
    setUser({
      ...user,
      username: editedUsername,
      bio: editedBio,
      profilePicture: editedProfilePic,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUsername(user.username);
    setEditedBio(user.bio);
    setEditedProfilePic(user.profilePicture);
    setIsEditing(false);
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setEditedProfilePic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Render different content based on loading, error, or data
  if (loading) {
    return <main className="profile-container">Loading profile...</main>;
  }

  if (error) {
    return (
      <main className="profile-container">
        Error: {error}. Please try again later.
      </main>
    );
  }

  return (
    <main className="profile-container">
      <section className="profile-card">
        <header
          className="profile-header"
          style={{
            backgroundImage: `url(${user.backgroundImage})`,
          }}
        ></header>
        <section className="profile-info">
          <section className="profile-pic-wrapper">
            <img
              src={user.profilePicture}
              alt={`${user.username}'s avatar`}
              className="profile-pic"
            />
          </section>

          <section className="profile-name-section">
            <section className="username-wrapper">
              <h2 className="profile-username">
                {user.username}
                <img
                  src={beginnerIcon}
                  alt="Beginner icon"
                  className="BeginnerIcon"
                />
                <section className="EditProfile" onClick={handleEditClick}>
                  <img
                    src={editIcon}
                    alt="edit Icon"
                    className="editIcon"
                  />
                </section>
              </h2>
            </section>
            <p className="bio">{user.bio}</p>
            <section className="profile-details">
              <p className="detail">Level: {user.level}</p>
              <p className="detail">Points: {user.points}</p>
              <p className="detail">Rank: {user.rank}</p>
              <p className="detail">Quests completed: {user.questsCompleted}</p>
              <p className="detail">Quests in progress: {user.questsInProgress}</p>
            </section>
          </section>
        </section>
      </section>

      {isEditing && (
        <main className="modal">
          <section className="modal-content">
            <h2>Edit Profile</h2>
            <label>
              Username:
              <input
                type="text"
                value={editedUsername}
                onChange={(e) => setEditedUsername(e.target.value)}
              />
            </label>
            <label>
              Bio:
              <textarea
                value={editedBio}
                onChange={(e) => setEditedBio(e.target.value)}
              />
            </label>
            <label>
              Profile Picture:
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePicChange}
              />
            </label>
            <section className="modal-buttons">
              <button onClick={handleSave}>Save</button>
              <button onClick={handleCancel}>Cancel</button>
            </section>
          </section>
        </main>
      )}
    </main>
  );
}