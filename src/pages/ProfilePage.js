
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import "../css/ProfilePage.css";
import profilePic from "../assets/profile.jpeg";
import editIcon from "../assets/edit_icon.png";
import beginnerIcon from "../assets/Beginner.png";

export default function ProfilePage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [editedBio, setEditedBio] = useState("");
  const [editedProfilePic, setEditedProfilePic] = useState("");

  // fetch player data
  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const docRef = doc(db, "Users", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUser(data);
          setEditedUsername(data.username);
          setEditedBio(data.bio);
          setEditedProfilePic(data.profilePicture);
        } else {
          console.log("No such player!");
        }
      } catch (error) {
        console.error("Error fetching player:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayer();
  }, [id]);

  const handleEditClick = () => setIsEditing(true);

  const handleSave = () => {
    setUser({
      ...user,
      username: editedUsername,
      bio: editedBio,
      profilePicture: editedProfilePic
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUsername(user.username);
    setEditedBio(user.bio);
    setEditedProfilePic(user.profilePicture);
    setIsEditing(false);
  };

  const handleProfilePicChange = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setEditedProfilePic(reader.result);
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div>Loading player...</div>;
  if (!user) return <div>Player not found.</div>;

  return (
    <main className="profile-container">
      <section className="profile-card">
        <header className="profile-header" style={{ backgroundImage: `url(${user.backgroundImage})` }}></header>
        <section className="profile-info">
          <div className="profile-pic-wrapper">
            <img src={user.profilePicture || profilePic} alt={user.username} className="profile-pic"/>
          </div>
          <div className="profile-name-section">
            <h2 className="profile-username">
              {user.username}
              <img src={beginnerIcon} alt="Beginner icon" className="BeginnerIcon"/>
              <span onClick={handleEditClick}>
                <img src={editIcon} alt="edit" className="editIcon"/>
              </span>
            </h2>
            <p className="bio">{user.bio}</p>
            <section className="profile-details">
              <p>Level: {user.Level}</p>
              <p>Points: {user.points}</p>
              <p>Rank: {user.rank}</p>
              <p>Quests completed: {user.questsCompleted}</p>
              <p>Quests in progress: {user.questsInProgress}</p>
            </section>
          </div>
        </section>
      </section>

      {isEditing && (
        <main className="modal">
          <section className="modal-content">
            <h2>Edit Profile</h2>
            <label>Username:
              <input type="text" value={editedUsername} onChange={e => setEditedUsername(e.target.value)} />
            </label>
            <label>Bio:
              <textarea value={editedBio} onChange={e => setEditedBio(e.target.value)} />
            </label>
            <label>Profile Picture:
              <input type="file" accept="image/*" onChange={handleProfilePicChange}/>
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


