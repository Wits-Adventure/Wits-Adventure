import React from "react";
import "../css/ProfilePage.css";
import profilePic from "../assets/profile.jpeg";
import editIcon from "../assets/edit_icon.png";
import beginnerIcon from "../assets/Beginner.png";

export default function ProfilePage() {
  const user = {
    level: 20,
    xp: 310,
    maxXp: 670,
    username: "PkmnMasterTR",
    bio: "I like quests, lol!",
    profilePicture: profilePic,
    Level:'Beginner',
    points: 210,
    rank: 12,
    questsCompleted: 1,
    questsInProgress: 2,
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
    </main>
  );
}