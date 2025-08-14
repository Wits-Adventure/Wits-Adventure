import React, { useState } from "react";
import "../css/ProfilePage.css";
import profilePic from "../assets/profile.jpeg";
import editIcon from "../assets/edit_icon.png";
import beginnerIcon from "../assets/Beginner.png";

export default function ProfilePage() {
  const [user, setUser] = useState({
    level: 20,
    xp: 310,
    maxXp: 670,
    username: "PkmnMasterTR",
    bio: "I like quests, lol!",
    profilePicture: profilePic,
    Level: 'Beginner',
    points: 210,
    rank: 12,
    questsCompleted: 1,
    questsInProgress: 2,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState(user.username);
  const [editedBio, setEditedBio] = useState(user.bio);
  const [editedProfilePic, setEditedProfilePic] = useState(user.profilePicture);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
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

  return (
    <main className="profile-container">
      <section className="profile-card">
        <header
          className="profile-header"
          style={{
            backgroundImage: `url(${user.backgroundImage})`
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
                  alt="beginner icon"
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
              <p className="detail">Level: {user.Level}</p>
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