import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import "../css/Home.css"; // Global styles
import "../css/Leaderboard.css"; // Leaderboard-specific styles

const Leaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quests, setQuests] = useState([]); // New state for quests
  const navigate = useNavigate();

  // Function to pastelize HSL color
  function pastelizeHSL(hslString) {
    const match = hslString.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
    if (!match) return hslString;
    const h = match[1];
    const origS = Number(match[2]);
    const origL = Number(match[3]);
    const s = Math.max(45, Math.min(65, Math.round(origS * 0.7))); // 45–65% saturation
    const l = Math.max(60, Math.min(80, Math.round(origL + 15)));  // 60–80% lightness
    return `hsl(${h} ${s}% ${l}%)`;
  }

  // Fetch players and quests from Firebase
  useEffect(() => {
    const fetchPlayersAndQuests = async () => {
      try {
        const playersSnapshot = await getDocs(collection(db, "Users"));
        const playersData = playersSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            profilePicture: data.profilePicture || "/default-avatar.png", // Default image if no profile picture
          };
        });

        // Fetch quests that are active
        const questsSnapshot = await getDocs(collection(db, "Quests"));
        const questsData = questsSnapshot.docs.map((doc) => doc.data());

        // Sort players by LeaderBoardPoints
        playersData.sort((a, b) => b.LeaderBoardPoints - a.LeaderBoardPoints);
        setPlayers(playersData);
        setQuests(questsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false); // Set loading to false after data is fetched
      }
    };

    fetchPlayersAndQuests();
  }, []); // Runs only once when the component mounts

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-backdrop"></div>
        <div className="loading-center">
          <img
            src="/spinner.gif" // Replace with your actual spinner image or animation
            alt="Loading..."
            className="loading-spinner"
          />
        </div>
      </div>
    );
  }

  // Helper function to find the quest a player has accepted
  const getAcceptedQuest = (player) => {
    return quests.filter((quest) =>
      quest.acceptedBy && quest.acceptedBy.includes(player.id)
    );
  };

  return (
    <div className="leaderboard-container">
      <h1 className="leaderboard-title">Leaderboard</h1>
      <ul className="leaderboard-list">
        {players.map((player, index) => (
          <li
            key={player.id}
            className="leaderboard-item"
            onClick={() => navigate(`/profile/${player.id}`)}
          >
            <div className="player-avatar-wrapper">
              <img
                src={player.profilePicture ? player.profilePicture : "/default-avatar.png"}
                alt={player.Name || "Unknown Hero"} // Fallback alt text
                className="avatar"  // Ensure correct styling
              />
            </div>
            <div className="player-info">
              <span className="player-name">{index + 1}. {player.Name || "Unnamed Hero"}</span>
              <span className="player-points">{player.LeaderBoardPoints || 0} pts</span>
              <div className="player-quests">
                {getAcceptedQuest(player).length > 0 ? (
                  getAcceptedQuest(player).map((quest, idx) => (
                    <div
                      key={quest.name + idx}
                      className="emoji-item"
                      role="listitem"
                      aria-label={`Quest: ${quest.name}`}
                      title={quest.name}
                      style={{
                        background: pastelizeHSL(quest.color),
                        borderColor: "#90774c",
                        color: "#2F1B14",
                        cursor: "pointer",
                      }}
                    >
                      <span className="emoji-char" aria-hidden="true" style={{ fontSize: "2em" }}>
                        {quest.emoji || "🗺️"}
                      </span>
                      <div className="quest-name" style={{ fontSize: "0.9em", marginTop: "0.3em", fontWeight: 600 }}>
                        {quest.name || 'Unknown Quest'}
                      </div>
                    </div>
                  ))
                ) : (
                  <span>No accepted quests</span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;
