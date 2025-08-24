import React, { useState, useEffect, useRef } from "react";
import "../css/ProfilePage.css";
import profilePic from "../assets/profile.jpg";
import editIcon from "../assets/edit_icon.png";
import { getProfileData } from "../firebase/profile_functions";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [editedBio, setEditedBio] = useState("");
  const [editedProfilePic, setEditedProfilePic] = useState(profilePic);

  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  const handleBackHome = () => {
    navigate("/");
  };

  // Fetch data from Firebase when the component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const profileData = await getProfileData();
        setUser({
          ...profileData,
          username: profileData.Name,
          points: profileData.LeaderBoardPoints,
          questsCompleted: profileData.CompletedQuests,
          level: profileData.Level,
          bio: profileData.Bio,
          profilePicture: profilePic,
          rank: 12,
          questsInProgress: 3, // Placeholder
        });
        setEditedUsername(profileData.Name);
        setEditedBio(profileData.Bio);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

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

  // Replaces previous handleProfilePicChange - supports both click-select and drag/drop
  const processFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEditedProfilePic(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleProfilePicChange = (e) => {
    // e can be from input change or drop event
    const file = e?.target?.files?.[0] || e?.dataTransfer?.files?.[0];
    if (file) processFile(file);
    setIsDragging(false);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // NEW: remove profile image and reset to default in public folder
  const handleRemoveImage = () => {
    setEditedProfilePic('/default.jpg');
    if (fileInputRef.current) {
      try {
        fileInputRef.current.value = null;
      } catch (err) {
        // ignore if not supported
      }
    }
  };

  // preview emojis for created-quests guide (extended for testing)
  const previewEmojis = [
    '🗡️','🪄','🧭','🗺️','🐉','🧪','📜',
    '🛡️','🏹','⚔️','🧙‍♂️','🧝‍♀️','🐲','🏺',
    '🕯️','🗝️','🔮','🦉','🪶','🐺','🪙','📯','🔱','🧿',
    // 15 more for testing (added)
    '🏰','👑','🔥','🌕','🌲','⛏️','🧚','🧝‍♂️','🧛‍♂️','🧟‍♂️','🪓','⚜️','🦴','🔔','🧙‍♀️'
  ];

  if (loading) {
    return (
      <main className="profile-container">
        <div className="loading-message">Loading profile...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="profile-container">
        <div className="error-message">
          Error: {error}. Please try again later.
        </div>
      </main>
    );
  }

  return (
    <main className="profile-container">
      <div className="profile-layout">
        {/* Left Panel - Profile Card */}
        <section className="profile-card">
          <div className="profile-pic-container">
            <img
              src={user.profilePicture}
              alt={`${user.username}'s avatar`}
              className="profile-pic"
            />
          </div>
          
          <div className="profile-name-section">
            <h2 className="profile-username">
              {user.username}
              <button className="edit-button" onClick={handleEditClick}>
                <img src={editIcon} alt="Edit profile" className="edit-icon" />
              </button>
            </h2>
            <p className="profile-bio">{user.bio}</p>
          </div>

          <div className="profile-info-section">
            <h3 className="info-title">INFO</h3>
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-label">Level:</span>
                <span className="stat-value">{user.level}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Points:</span>
                <span className="stat-value">{user.points}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Rank:</span>
                <span className="stat-value">{user.rank}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Quests Completed:</span>
                <span className="stat-value">{user.questsCompleted}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Quests In Progress:</span>
                <span className="stat-value">{user.questsInProgress}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Panel - Content Sections */}
        <div className="profile-right-panel">
          {/* Customization Inventory */}
          <section className="content-section">
            <h3 className="section-title">Customization Inventory</h3>
            <div className="section-content">
              <p className="placeholder-text">Your unlocked customizations will appear here</p>
            </div>
          </section>

          {/* Created Quests */}
          <section className="content-section">
            <h3 className="section-title">View And Manage Created Quests</h3>

            {/* NEW: emoji preview grid (7 items in an 8-column grid) */}
            <div className="section-content">
              <div className="emoji-grid" role="list" aria-label="Quest previews">
                {previewEmojis.map((emoji, idx) => (
                  <div
                    key={idx}
                    className="emoji-item"
                    role="listitem"
                    aria-label={`Quest preview ${idx + 1}`}
                    title={`Quest preview ${idx + 1}`}
                  >
                    <span className="emoji-char" aria-hidden="true">{emoji}</span>
                  </div>
                ))}
                {/* empty slot(s) allowed — grid is 8 columns */}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content">
              <h2 className="modal-title">Edit Profile</h2>
              
              <div className="input-group">
                <label className="input-label">Username:</label>
                <input
                  type="text"
                  value={editedUsername}
                  onChange={(e) => setEditedUsername(e.target.value)}
                  className="modal-input"
                />
              </div>
              
              <div className="input-group">
                <label className="input-label">Bio:</label>
                <textarea
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  className="modal-textarea"
                  rows="4"
                />
              </div>
              
              <div className="input-group">
                <label className="input-label">Profile Picture:</label>

                {/* Image drop / select area (replaces plain file input) */}
                <div
                  className={`image-drop-area ${isDragging ? "drag_over" : ""}`}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleFileDrop}
                  role="button"
                  tabIndex={0}
                  aria-label="Select or drop profile image"
                >
                  {editedProfilePic ? (
                    <img
                      src={editedProfilePic}
                      alt="Profile preview"
                      className="image-preview"
                    />
                  ) : (
                    <div className="drop-placeholder">
                      Click or drop an image here to upload
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicChange}
                    style={{ display: "none" }}
                  />
                </div>
              </div>
              
              <div className="modal-buttons">
                <button onClick={handleSave} className="modal-button save-button">
                  Save
                </button>
                <button onClick={handleCancel} className="modal-button cancel-button">
                  Cancel
                </button>
                <button onClick={handleRemoveImage} className="modal-button remove-button">
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back to Home button - fixed at bottom-left */}
      <button
        type="button"
        className="back-home-btn"
        onClick={handleBackHome}
        aria-label="Back to home"
      >
        <img src="/return.svg" alt="Back" />
      </button>
    </main>
  );
}