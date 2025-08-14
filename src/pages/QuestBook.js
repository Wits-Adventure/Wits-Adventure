import React, { useState } from 'react';
import '../css/QuestBook.css';
import { FaFilter, FaArrowLeft, FaArrowRight, FaStar, FaAward, FaGem, FaBoxOpen } from 'react-icons/fa';
import logo from '../media/logo.jpg';  

const allQuests = [
  { id: 1, title: 'Library Hunt', description: 'Find and scan the QR code at the library.', reward: 'Points' },
  { id: 2, title: 'Science Block Marker', description: 'Locate the hidden marker near the lab.', reward: 'Badges' },
  { id: 3, title: 'Ancient Oak Clue', description: 'Clue near the big oak tree in the quad.', reward: 'Collectibles' },
  { id: 4, title: 'Leaderboard Trial', description: 'Complete 3 quests to rank this week.', reward: 'Points' },
  { id: 5, title: 'Hidden Scroll', description: 'Retrieve the scroll from the archives.', reward: 'Items' },
  { id: 6, title: 'Potion Recipe', description: 'Find ingredients in the science garden.', reward: 'Collectibles' },
  { id: 7, title: 'Enchanted Garden', description: 'Discover the secret flower in the campus garden.', reward: 'Items' },
  { id: 8, title: 'Wizard’s Challenge', description: 'Solve the riddle posted on the notice board.', reward: 'Badges' },
  { id: 9, title: 'Mystic Library Scroll', description: 'Find the ancient scroll hidden in the library stacks.', reward: 'Collectibles' },
  { id: 10, title: 'Campus Marathon', description: 'Complete the 5K run around campus.', reward: 'Points' },
];

const rewards = ['All', 'Points', 'Badges', 'Collectibles', 'Items'];
const questsPerPage = 4;

const rewardIcons = {
  Points: <FaStar style={{ marginRight: '6px', color: '#fbc02d' }} />,
  Badges: <FaAward style={{ marginRight: '6px', color: '#d32f2f' }} />,
  Collectibles: <FaGem style={{ marginRight: '6px', color: '#1976d2' }} />,
  Items: <FaBoxOpen style={{ marginRight: '6px', color: '#388e3c' }} />,
};

const QuestBook = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('All');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Quests'); // NEW: Active tab tracking

  const filteredQuests = filter === 'All'
    ? allQuests
    : allQuests.filter(q => q.reward === filter);

  const indexOfLast = currentPage * questsPerPage;
  const indexOfFirst = indexOfLast - questsPerPage;
  const currentQuests = filteredQuests.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(filteredQuests.length / questsPerPage);

  const handlePageChange = (direction) => {
    setCurrentPage((prev) => {
      const nextPage = direction === 'next' ? prev + 1 : prev - 1;
      return Math.min(Math.max(nextPage, 1), totalPages);
    });
  };

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleFilterChange = (reward) => {
    setFilter(reward);
    setCurrentPage(1);
    setDropdownOpen(false);
  };

  return (
    <div className="full-page-background">
      <div className="quest-list">

        {/* TAB NAVIGATION */}
        <div className="tab-container">
          <div
            className={`tab ${activeTab === 'Quests' ? 'active' : ''}`}
            onClick={() => setActiveTab('Quests')}
          >
            Quests
          </div>
          <div
            className={`tab ${activeTab === 'Leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('Leaderboard')}
          >
            Leaderboard
          </div>
          
        </div>

        {/* PAGE CONTENT BASED ON TAB */}
        {activeTab === 'Quests' && (
          <>
            <h1 className="title">
            <img src={logo} alt="Logo" className="logo-circle" />
              Wits Adventure Quests
            </h1>

            <div className="filter-pagination-container">
              <div style={{ position: 'relative' }}>
                <button className="filter-icon-btn" onClick={toggleDropdown}>
                  <FaFilter />
                </button>
                {dropdownOpen && (
                  <ul className="dropdown-menu">
                    {rewards.map((reward, index) => (
                      <li key={index} onClick={() => handleFilterChange(reward)}>
                        {reward}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pagination">
                <button onClick={() => handlePageChange('prev')} disabled={currentPage === 1}>
                  <FaArrowLeft />
                </button>
                <span>Page {currentPage}</span>
                <button onClick={() => handlePageChange('next')} disabled={currentPage === totalPages}>
                  <FaArrowRight />
                </button>
              </div>
            </div>

            {currentQuests.map((quest) => (
              <div key={quest.id} className="quest-card">
                <h2>{quest.title}</h2>
                <p>{quest.description}</p>
                <span className="reward-tag">
                  {rewardIcons[quest.reward]}
                  {quest.reward}
                </span>
              </div>
            ))}
          </>
        )}

        {activeTab === 'Leaderboard' && (
          <div>
            <h1 className="title">🏆 Leaderboard</h1>
            <p style={{ textAlign: 'center' }}>Leaderboard content will go here.</p>
          </div>
        )}

        
      </div>
    </div>
  );
};

export default QuestBook;
