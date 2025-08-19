
import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import '../css/Home.css';
import logo from '../media/LOGO_Alpha.png';

const Leaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch players from Firestore "Users" collection
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Users"));
        const playersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort descending by LeaderBoardPoints
        playersData.sort((a, b) => b.LeaderBoardPoints - a.LeaderBoardPoints);

        setPlayers(playersData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching players:", error);
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  if (loading) {
    return <div className="loading">Loading leaderboard...</div>;
  }

  return (
    <div className="home-container" style={{ padding: '40px', minHeight: '100vh' }}>
      {/* Header */}
      <div className="header">
        <div className="website-name">
          <img src={logo} alt="Logo" className="logo" />
          <h1 style={{ color: '#f5d742', textShadow: '2px 2px #000' }}>Fantasy Leaderboard</h1>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="leaderboard-container" 
           style={{ 
             backgroundColor: '#2a2a2a', 
             border: '2px solid #f5d742', 
             borderRadius: '15px', 
             padding: '30px', 
             maxWidth: '900px', 
             margin: '40px auto', 
             boxShadow: '0 4px 15px rgba(0,0,0,0.5)' 
           }}>
        <h2 className="leaderboard-title" 
            style={{ 
              textAlign: 'center', 
              marginBottom: '30px', 
              fontSize: '2rem', 
              color: '#f5d742', 
              textShadow: '1px 1px #000' 
            }}>
          All Heroes
        </h2>

<ul className="leaderboard-list">
  {players.map((player, index) => (
<li
  key={player.id}
  className="leaderboard-item"
  onClick={() => navigate(`/profile/${player.id}`)}
  style={{ animationDelay: `${index * 0.1}s` }} // staggered appearance
>


      <div className="player-avatar-wrapper">
        <img
          src={player.profilePicture || "/default-avatar.jpg"}
          alt={player.Name}
          className="avatar"
        />
      </div>
      <div className="player-info">
        <span className="player-name">{player.Name}</span>
        <span className="player-points">{player.LeaderBoardPoints} pts</span>
      </div>
    </li>
  ))}
</ul>



      </div>
    </div>
  );
};

export default Leaderboard;

