import React, { useState, useEffect } from 'react';
import '../css/QuestBook.css';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import logo from '../media/logo.jpg';
import trophy from '../media/trophy.png';
import { getUserData } from '../firebase/firebase';
import { getAllQuests } from '../firebase/general_quest_functions';
import CompleteQuestForm from './CompleteQuestForm';

const questsPerPage = 4;

const QuestBook = () => {
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

  if (loading) return <p style={{ textAlign: 'center' }}>Loading quests...</p>;
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
      <div className="quest-list">
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
            {currentQuests.map((quest) => {
              const hasUserSubmission = quest.submissions?.some(sub => sub.userId === userId);
              return (
                <div key={quest.id} className="quest-card">
                  <h2>{quest.name || "Untitled Quest"}</h2>
                  <p>Latitude: {quest.location ? quest.location.latitude.toFixed(6) : "N/A"}</p>
                  <p>Longitude: {quest.location ? quest.location.longitude.toFixed(6) : "N/A"}</p>
                  <span className="reward-tag">
                    {quest.reward ?? 0} points
                  </span>
                  <button
                    className="complete-btn"
                    onClick={() => handleTurnInQuest(quest)}
                  >
                    {hasUserSubmission ? "Replace Submission" : "Turn in Quest"}
                  </button>
                </div>
              );
            })}
            <CompleteQuestForm
              isOpen={showCompleteForm}
              onClose={() => { setShowCompleteForm(false); setActiveQuest(null); }}
              quest={activeQuest}
            />
          </>
        )}

        {activeTab === 'Leaderboard' && (
          <div>
            <h1 className="title">
              <img src={trophy} alt="trophy" className="trophy" /> Leaderboard
            </h1>
            <p style={{ textAlign: 'center' }}>Leaderboard content will go here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestBook;
