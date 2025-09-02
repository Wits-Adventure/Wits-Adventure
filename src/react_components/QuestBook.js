import React, { useState, useEffect } from 'react';
import '../css/QuestBook.css';
import '../css/Home.css'; // Use Home.css for fonts and buttons
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import logo from '../media/logo.jpg';
import { getUserData } from '../firebase/firebase';
import { getAllQuests } from '../firebase/general_quest_functions';
import CompleteQuestForm from './CompleteQuestForm';
import Leaderboard from "./Leaderboard";

const questsPerPage = 4;

const QuestBook = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('Quests');
  const [acceptedQuests, setAcceptedQuests] = useState([]);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [activeQuest, setActiveQuest] = useState(null);

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const questsArray = await getAllQuests();
        setQuests(questsArray);
      } catch (error) {
        console.error("Error fetching quests:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUser = async () => {
      try {
        const userData = await getUserData();
        setUserId(userData?.uid || null);
        setAcceptedQuests(userData?.acceptedQuests || []);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
    fetchQuests();
  }, []);

  const acceptedQuestList = quests.filter(q => acceptedQuests.includes(q.id));
  const totalPages = Math.ceil(acceptedQuestList.length / questsPerPage);
  const indexOfLast = currentPage * questsPerPage;
  const indexOfFirst = indexOfLast - questsPerPage;
  const currentQuests = acceptedQuestList.slice(indexOfFirst, indexOfLast);

  const handlePageChange = (direction) => {
    setCurrentPage(prev => {
      const nextPage = direction === 'next' ? prev + 1 : prev - 1;
      return Math.min(Math.max(nextPage, 1), totalPages);
    });
  };

  const handleTurnInQuest = (quest) => {
    setActiveQuest(quest);
    setShowCompleteForm(true);
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Loading quests...</p>;
  if (quests.length === 0) return <p style={{ textAlign: 'center' }}>No quests available.</p>;

  return (
    <div className="home-container">
      {/* HEADER + LOGO + TITLE + TABS */}
      <div className="header-container">
        <div className="logo-title">
          <img src={logo} alt="Logo" className="logo-circle" />
          <h1 className="title">Wits Adventure Quests</h1>
        </div>

        <div className="tab-container">
          <button
            className={`home-btn tab ${activeTab === 'Quests' ? 'active' : ''}`}
            onClick={() => setActiveTab('Quests')}
          >
            Quests
          </button>
          <button
            className={`home-btn tab ${activeTab === 'Leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('Leaderboard')}
          >
            Leaderboard
          </button>
        </div>
      </div>

      {/* CONTENT FRAME */}
      <div className="map-frame">
        {activeTab === 'Quests' && (
          <>
            {currentQuests.map((quest) => (
              <div key={quest.id} className="quest-card">
                <h2>{quest.name || "Untitled Quest"}</h2>
                <p>Latitude: {quest.location ? quest.location.latitude.toFixed(6) : "N/A"}</p>
                <p>Longitude: {quest.location ? quest.location.longitude.toFixed(6) : "N/A"}</p>
                <span className="reward-tag">{quest.reward ?? 0} points</span>
                <button className="home-btn complete-btn" onClick={() => handleTurnInQuest(quest)}>
                  Turn in Quest
                </button>
              </div>
            ))}

            <CompleteQuestForm
              isOpen={showCompleteForm}
              onClose={() => {
                setShowCompleteForm(false);
                setActiveQuest(null);
              }}
              quest={activeQuest}
            />

            {/* PAGINATION */}
            <div className="pagination">
              <button
                className="home-btn"
                onClick={() => handlePageChange("prev")}
                disabled={currentPage === 1}
              >
                <FaArrowLeft />
              </button>
              <span>
                Page {currentPage} / {totalPages}
              </span>
              <button
                className="home-btn"
                onClick={() => handlePageChange("next")}
                disabled={currentPage === totalPages}
              >
                <FaArrowRight />
              </button>
            </div>
          </>
        )}

        {activeTab === 'Leaderboard' && <Leaderboard />}
      </div>
    </div>
  );
};

export default QuestBook;
