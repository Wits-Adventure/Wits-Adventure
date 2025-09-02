import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import "../css/Home.css";          // global styles
import "../css/Leaderboard.css";  // optional extra styles

const Leaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Users"));
        const playersData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            profilePicture: data.profilePicture || "/default-avatar.png",
          };
        });

        // Sort descending by LeaderBoardPoints
        playersData.sort((a, b) => b.LeaderBoardPoints - a.LeaderBoardPoints);
        setPlayers(playersData);
      } catch (error) {
        console.error("Error fetching players:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  if (loading) {
    return <p style={{ textAlign: "center" }}>Loading leaderboard...</p>;
  }

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
                src={player.profilePicture}
                alt={player.Name || "Unknown Hero"}
                className="avatar"
              />
            </div>
            <div className="player-info">
              <span className="player-name">{index + 1}. {player.Name || "Unnamed Hero"}</span>
              <span className="player-points">{player.LeaderBoardPoints || 0} pts</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;
