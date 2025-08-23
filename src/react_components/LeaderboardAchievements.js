import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app} from "../firebase/firebase"; 
import "../css/LeaderboardAchievements.css";

export default function LeaderboardAchievements() {
  const [activeTab, setActiveTab] = useState("leaderboard");
  const [players, setPlayers] = useState([]);
  const [achievements, setAchievements] = useState([]);

  const db = getFirestore(app);

  useEffect(() => {
    // Fetch players from Firestore
  
    const fetchPlayers = async () => {
      const snapshot = await getDocs(collection(db, "players"));
      const playerData = snapshot.docs.map((doc) => doc.data());
      setPlayers(playerData.sort((a, b) => b.score - a.score));
    };

    // Fetch achievements from Firestore
    const fetchAchievements = async () => {
      const snapshot = await getDocs(collection(db, "achievements"));
      const achievementData = snapshot.docs.map((doc) => doc.data());
      setAchievements(achievementData);
    };

    fetchPlayers();
    fetchAchievements();
  }, [db]);

  const top3 = players.slice(0, 3);
  const others = players.slice(3);

  return (
    <div className="game-container">
      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "leaderboard" ? "active" : ""}
          onClick={() => setActiveTab("leaderboard")}
        >
          Leaderboard
        </button>
        <button
          className={activeTab === "achievements" ? "active" : ""}
          onClick={() => setActiveTab("achievements")}
        >
          Achievement
        </button>
      </div>

      {/* Leaderboard Tab */}
      {activeTab === "leaderboard" && (
        <div className="leaderboard-tab">
          <div className="podium">
            {top3.map((player, index) => (
              <div
                key={player.id || index}
                className={`podium-place place-${index + 1}`}
              >
                <img
                  src={player.avatar || "/default-avatar.png"}
                  alt={player.name}
                />
                <h3>{player.name}</h3>
                <p className="score">{player.score.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="player-list">
            {others.map((player, index) => (
              <div key={player.id || index} className="player-row">
                <span className="rank">{index + 4}</span>
                <img
                  src={player.avatar || "/default-avatar.png"}
                  alt={player.name}
                  className="avatar"
                />
                <span className="name">{player.name}</span>
                <span className="score">{player.score.toLocaleString()}</span>
                <img
                  src="/coin.png"
                  alt="coins"
                  className="coin-icon"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === "achievements" && (
        <div className="achievements-tab">
          {achievements.map((ach, index) => (
            <div key={index} className="achievement-card">
              <div className="task-info">
                <h3>{ach.title}</h3>
                <p>{ach.description}</p>
              </div>
              <div className="progress-section">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(ach.current / ach.goal) * 100}%`,
                    }}
                  ></div>
                </div>
                <span>
                  {ach.current}/{ach.goal}
                </span>
              </div>
              <div className="reward">
                <img src="/coin.png" alt="coins" className="coin-icon" />
                <span>{ach.reward}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
