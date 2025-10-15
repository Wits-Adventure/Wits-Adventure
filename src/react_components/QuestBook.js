import React, { useState, useEffect } from 'react';
import '../css/QuestBook.css';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { FaChevronLeft } from 'react-icons/fa'; // Add this for a matching icon
import logo from '../media/LOGO_Final.jpg';
import trophy from '../media/trophy.png';
import { getUserData } from '../firebase/firebase';
import { getAllQuests, abandonQuest } from '../firebase/general_quest_functions'; // Add abandonQuest import
import CompleteQuestForm from './CompleteQuestForm';
import { useNavigate } from "react-router-dom";
import Leaderboard from './Leaderboard.js';

const questsPerPage = 4;

const QuestBook = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('Quests'); // Added tab state
  const [acceptedQuests, setAcceptedQuests] = useState([]);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [activeQuest, setActiveQuest] = useState(null);

  // Fetch quests and user info on mount
  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const questsArray = await getAllQuests();
        console.log("Fetched quests:", questsArray);
        setQuests(questsArray);
      } catch (error) {
        console.error("Error fetching quests:", error);
      } finally {
        setLoading(false);
      }
    };

    /*
    From Tafara
    To get user ID you can import auth from firebase
        const user = auth.currentUser;
        if (user) {
          const uid = user.uid;
          console.log("User ID:", uid);
        } else {
          console.log("No user is signed in.");
          navigate to homepage as quest page is only accessible to signed in students
        }
    */
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

  // Add abandon quest handler
  const handleAbandonQuest = async (questId) => {
    try {
      await abandonQuest(questId);
      // Remove from accepted quests list
      setAcceptedQuests(prev => prev.filter(id => id !== questId));
      // Optionally show a success message
      console.log('Quest abandoned successfully');
    } catch (error) {
      console.error('Error abandoning quest:', error);
      alert('Failed to abandon quest. Please try again.');
    }
  };

  // Handler for back button (same as ProfilePage)
  const handleBackHome = () => {
    navigate("/");
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Loading quests...</p>;
  if (loading) return <div style={{ textAlign: 'center' }}><img src={process.env.PUBLIC_URL + '/loading.gif'} alt="Loading..." style={{ width: 60, height: 60 }} /></div>;
  if (quests.length === 0) return <p style={{ textAlign: 'center' }}>No quests available.</p>;

  return (
    <div className="full-page-background">

      {/* HEADER OUTSIDE BORDER */}
      <div className="questbook-header">
        <div className="questbook-title">
          <img src={logo} alt="Logo" className="logo-circle" style={{ width: 48, height: 48 }} />
          Wits Adventure Quests
        </div>
        <div className="questbook-tabs">
          <div
            className={`questbook-tab ${activeTab === 'Quests' ? 'active' : ''}`}
            onClick={() => setActiveTab('Quests')}
          >
            Quests
          </div>
          <div
            className={`questbook-tab ${activeTab === 'Leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('Leaderboard')}
          >
            Leaderboard
          </div>
        </div>
      </div>

      {/* BORDERED CONTENT */}
      <div className="quest-list" style={{ position: "relative" }}>
        {/* Back to Home button - fixed at bottom-left of viewport */}
        <button
          type="button"
          className="back-home-btn"
          onClick={handleBackHome}
          aria-label="Back to home"
        >
          <img src="/return.svg" alt="Back" />
        </button>

        {activeTab === 'Quests' && (
          <>
            <div className="pagination">
              <button onClick={() => handlePageChange('prev')} disabled={currentPage === 1}>
                <FaArrowLeft />
              </button>
              <span>Page {currentPage} / {totalPages}</span>
              <button onClick={() => handlePageChange('next')} disabled={currentPage === totalPages}>
                <FaArrowRight />
              </button>
            </div>

            <div className="quest-grid">
              {currentQuests.map((quest) => {
                const hasUserSubmission = quest.submissions?.some(sub => sub.userId === userId);
                return (
                  <div key={quest.id} className="quest-card">
                    <div className="quest-card-header">
                      <h2>{quest.name || "Untitled Quest"}</h2>
                      <span className="reward-tag">{quest.reward ?? 0} points</span>
                    </div>

                    {/* Only show description section if description exists */}
                    {quest.description && (
                      <div className="quest-card-meta">
                        <span className="meta-chip">{quest.description}</span>
                      </div>
                    )}

                    {/* Quest Image Display */}
                    {quest.imageUrl && (
                      <div className="questbook-quest-image-container">
                        <img
                          src={quest.imageUrl}
                          alt={`${quest.name || "Quest"} image`}
                          className="questbook-quest-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div className="quest-card-actions">
                      <button
                        className="complete-btn"
                        onClick={() => handleTurnInQuest(quest)}
                      >
                        {hasUserSubmission ? "Replace Submission" : "Turn in Quest"}
                      </button>
                      <button
                        className="questbook-abandon-btn"
                        onClick={() => handleAbandonQuest(quest.id)}
                      >
                        Abandon Quest
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <CompleteQuestForm
              isOpen={showCompleteForm}
              onClose={() => { setShowCompleteForm(false); setActiveQuest(null); }}
              quest={activeQuest}
            />
          </>
        )}

        {activeTab === 'Leaderboard' && (

          <Leaderboard />

        )}
      </div>
    </div>
  );
};

export default QuestBook;
