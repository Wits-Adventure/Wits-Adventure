import React, { useState, useEffect, useRef } from "react";
import "../css/ProfilePage.css";
import profilePic from "../assets/profile.jpg";
import editIcon from "../assets/edit_icon.png";
import { getProfileData, updateProfileData } from "../firebase/profile_functions";
import { useNavigate } from "react-router-dom";
import { getAllQuests } from "../firebase/general_quest_functions";
import QuestManager from "./QuestManager";

export default function ProfilePage({ mapInstanceRef, questCirclesRef }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [editedBio, setEditedBio] = useState("");
  const [editedProfilePic, setEditedProfilePic] = useState(profilePic);
  const [createdQuests, setCreatedQuests] = useState([]);

  // Quest Manager state
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [isQuestManagerOpen, setIsQuestManagerOpen] = useState(false);

  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  const handleCloseQuest = (questId) => {
    setCreatedQuests((prev) => prev.filter((q) => q.id !== questId));
  };

  const handleBackHome = () => {
    navigate("/");
  };

  function pastelizeHSL(hslString) {
    // Example input: "hsl(0 80% 40%)"
    const match = hslString.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
    if (!match) return hslString;
    const h = match[1];
    const origS = Number(match[2]);
    const origL = Number(match[3]);
    const s = Math.max(45, Math.min(65, Math.round(origS * 0.7))); // 45–65% saturation
    const l = Math.max(60, Math.min(80, Math.round(origL + 15)));  // 60–80% lightness
    return `hsl(${h} ${s}% ${l}%)`;
  }

  // Fetch data from Firebase when the component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const profileData = await getProfileData();
        setUser({
          ...profileData,
          username: profileData.Name,
          points: profileData.LeaderBoardPoints,
          questsCompleted: profileData.CompletedQuests.length,
          questsInProgress: profileData.acceptedQuests.length,
          level: profileData.Level,
          bio: profileData.Bio,
          profilePicture: profileData.profilePicture || profilePic,
          experience: profileData.Experience,
          spendablePoints: profileData.SpendablePoints,
          rank: 12, // Placeholder
        });
        setEditedUsername(profileData.Name);
        setEditedBio(profileData.Bio);

        // Fetch all quests and filter by creatorId
        const allQuests = await getAllQuests();
        const userCreated = allQuests
          .filter(q => q.creatorId === profileData.uid)
          .map(q => ({
            ...q,
            location: q.location && typeof q.location._latitude === "number"
              ? { latitude: q.location._latitude, longitude: q.location._longitude }
              : q.location && typeof q.location.latitude === "number"
                ? { latitude: q.location.latitude, longitude: q.location.longitude }
                : null
          }));
        setCreatedQuests(userCreated);

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

  const handleSave = async () => {
    try {
      await updateProfileData({
        uid: user.uid,
        Name: editedUsername,
        Bio: editedBio,
        ProfilePictureUrl: editedProfilePic
      });
      setUser({
        ...user,
        username: editedUsername,
        bio: editedBio,
        profilePicture: editedProfilePic,
      });
      setIsEditing(false);
    } catch (err) {
      alert("Failed to update profile. Please try again.");
      console.error(err);
    }
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

  // Quest Manager handlers
  const handleQuestClick = (quest) => {
    setSelectedQuest(quest);
    setIsQuestManagerOpen(true);
  };

  const handleCloseQuestManager = () => {
    setIsQuestManagerOpen(false);
    setSelectedQuest(null);
  };

  const handleAcceptSubmission = (submissionId, questId) => {
    console.log(`Accepted submission ${submissionId} for quest ${questId}`);
    // Add your accept submission logic here
  };

  const handleRejectSubmission = (submissionId, questId) => {
    console.log(`Rejected submission ${submissionId} for quest ${questId}`);
    // Add your reject submission logic here
  };


  const profilePicture = user.profilePicture || "/profile.png";

  return (
    <main className="profile-container">
      <div className="profile-layout">
        {/* Left Panel - Profile Card */}
        <section className="profile-card">
          <div className="profile-pic-container">
            <img
              src={profilePicture}
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
                <span className="stat-label">Experience:</span>
                <span className="stat-value">{user.experience}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Spendable points:</span>
                <span className="stat-value">{user.spendablePoints}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Quests Completed:</span>
                <span className="stat-value">{user.questsCompleted}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Quests In Progress:</span>
                <span className="stat-value">{user.questsInProgress}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">LeaderBoard Points</span>
                <span className="stat-value">{user.points}</span>
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
            <div className="section-content">
              {createdQuests.length === 0 ? (
                <p className="placeholder-text">You haven't created any quests yet.</p>
              ) : (
                <div className="emoji-grid" role="list" aria-label="Your created quests">
                  {createdQuests.map((quest, idx) => (
                    <div
                      key={quest.id}
                      className="emoji-item"
                      role="listitem"
                      aria-label={`Quest: ${quest.name}`}
                      title={quest.name}
                      style={{
                        background: pastelizeHSL(quest.color || "#ffeac8"),
                        borderColor: "#90774c",
                        color: "#2F1B14",
                        cursor: "pointer"
                      }}
                      onClick={() => handleQuestClick(quest)}
                    >
                      <span className="emoji-char" aria-hidden="true" style={{ fontSize: "2em" }}>
                        {quest.emoji || "🗺️"}
                      </span>
                      <div className="quest-name" style={{ fontSize: "0.9em", marginTop: "0.3em", fontWeight: 600 }}>
                        {quest.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  onKeyDown={(e) => {
                    if (e.key === ' ') {
                      e.stopPropagation(); // prevent global handlers from blocking space
                    }
                  }}
                  className="modal-input"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Bio:</label>
                <textarea
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === ' ') {
                      e.stopPropagation();
                    }
                  }}
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

      {/* Quest Manager Modal */}
      <QuestManager
        quest={selectedQuest}
        isOpen={isQuestManagerOpen}
        onClose={handleCloseQuestManager}
        onAccept={handleAcceptSubmission}
        onCloseQuest={handleCloseQuest}
      />

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