import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../css/Home.css';
import logoImage from '../media/LOGO_Alpha.png';
import questbookImage from '../media/questbook_outline.png';
import profilePic from '../assets/profile.jpg'; // added: use same default pfp as ProfilePage
import { useNavigate, useLocation } from 'react-router-dom';
import { logout, getUserData } from '../firebase/firebase'; // Import getUserData
import { useAuth } from '../context/AuthContext'; // Import useAuth hook
import { getAllQuests, acceptQuest, abandonQuest } from '../firebase/general_quest_functions';
import CreateQuestForm from './CreateQuestForm';
import { getProfileData } from '../firebase/profile_functions';

const Home = () => {
  const { currentUser } = useAuth();
  const [username, setUsername] = useState('');
  const [profilePicture, setProfilePicture] = useState(profilePic); // <-- new state for profile picture
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const headerRef = useRef(null);
  const questCirclesRef = useRef([]); // Add this to track quest circles
  const navigate = useNavigate();
  const location = useLocation(); // Add this near the top of Home()
  const [showCreateForm, setShowCreateForm] = useState(false); // NEW
  const [allQuests, setAllQuests] = useState([]);

  // Use useEffect to fetch user data when the authentication state changes
  useEffect(() => {
    const fetchUsername = async () => {
      if (currentUser) {
        try {
          const userData = await getUserData(); // Assuming this fetches the Name
          if (userData && userData.Name) {
            setUsername(userData.Name);
          } else {
            setUsername('User'); // Fallback name
          }
        } catch (error) {
          console.error("Failed to fetch username:", error);
          setUsername('User'); // Fallback on error
        }
      } else {
        setUsername(''); // Clear username if no user is logged in
      }
    };

    fetchUsername();
  }, [currentUser]); // Dependency array: run this effect when currentUser changes

  useEffect(() => {
    const fetchProfile = async () => {
      if (currentUser) {
        try {
          const profileData = await getProfileData();
          setUsername(profileData.Name || 'User');
          setProfilePicture(profileData.profilePicture || profilePic); // <-- set profile picture
        } catch (error) {
          console.error("Failed to fetch profile:", error);
          setUsername('User');
          setProfilePicture(profilePic);
        }
      } else {
        setUsername('');
        setProfilePicture(profilePic);
      }
    };

    fetchProfile();
  }, [currentUser]);

  useEffect(() => {
    async function fetchQuests() {
      const quests = await getAllQuests();
      setAllQuests(
        quests.map(q => ({
          ...q,
          location: q.location && typeof q.location.latitude === "number"
            ? { latitude: q.location.latitude, longitude: q.location.longitude }
            : q.location && typeof q.location._lat === "number"
              ? { latitude: q.location._lat, longitude: q.location._long }
              : Array.isArray(q.location)
                ? { latitude: q.location[0], longitude: q.location[1] }
                : null
        }))
      );
    }
    fetchQuests();
  }, []);

  // Function to add quest area highlights
  const addQuestAreas = useCallback(() => {
    if (!mapInstanceRef.current) return;

    // Remove old quest circles/markers
    if (questCirclesRef.current && questCirclesRef.current.length > 0) {
      questCirclesRef.current.forEach(circle => {
        mapInstanceRef.current.removeLayer(circle);
        if (circle._emojiMarker) {
          mapInstanceRef.current.removeLayer(circle._emojiMarker);
        }
      });
      questCirclesRef.current = [];
    }

    // Add markers for all quests from Firestore
    allQuests.forEach(quest => {
      if (!quest.location) return;
      const { latitude, longitude } = quest.location;

      // Use saved emoji and color, fallback if missing
      const titleEmoji = quest.emoji || (quest.name?.match(/^\p{Extended_Pictographic}/u)?.[0]) || '🌟';
      const color = quest.color || '#8B4513';

      // Draw the quest radius as a circle
      const questCircle = window.L.circle([latitude, longitude], {
        color: color,
        fillColor: color,
        fillOpacity: 0.3,
        radius: quest.radius || 50,
        weight: 2,
        questId: quest.id // <-- add this line
      }).addTo(mapInstanceRef.current);

      // Custom popup
      const hasAccepted = quest.acceptedBy && quest.acceptedBy.includes(currentUser?.uid);
      const isOwnQuest = currentUser && quest.creatorId === currentUser.uid;
      const buttonHtml = isOwnQuest
        ? `<button class="quest-popup-btn your-quest-btn" disabled>Your Quest</button>`
        : hasAccepted
          ? `<button class="quest-popup-btn abandon-quest-btn" onclick="window.handleAbandonQuest('${quest.id}')">Abandon Quest</button>`
          : `<button class="quest-popup-btn quest-accept-btn" onclick="window.handleAcceptQuest('${quest.id}')">Accept Quest</button>`;

      questCircle.bindPopup(`
        <div class="quest-popup">
          <h3>${titleEmoji} ${quest.name}</h3>
          ${quest.imageUrl ? `<div class="quest-image-container"><img src="${quest.imageUrl}" alt="Quest Image" class="quest-popup-image" /></div>` : ''}
          <p><strong>Reward:</strong> ${quest.reward ?? quest.radius} points</p>
          ${buttonHtml}
        </div>
      `);

      // Emoji marker in the center
      const emojiIcon = window.L.divIcon({
        className: 'quest-emoji-icon',
        html: `<div class="quest-emoji">${titleEmoji}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      const emojiMarker = window.L.marker([latitude, longitude], { icon: emojiIcon }).addTo(mapInstanceRef.current);
      emojiMarker.bindPopup(questCircle.getPopup());
      questCircle._emojiMarker = emojiMarker;

      // Click handling for emoji marker
      emojiMarker.on('click', (e) => {
        if (window.__questPlacing) return;
        questCircle.openPopup();
        if (e.originalEvent) {
          e.originalEvent.stopPropagation();
          e.originalEvent.preventDefault();
        }
      });

      // Store reference for cleanup
      questCirclesRef.current.push(questCircle);
    });

    // Example quest locations (you can modify these coordinates)
    const questLocations = [
      {
        lat: -26.1935,
        lng: 28.0298,
        radius: 50,
        title: '🗡️ Combat Training',
        description: 'Test your combat skills in this training area.',
        image: '/combat.jpg',
        special: true
      },
      {
        lat: -26.1920,
        lng: 28.0315,
        radius: 75,
        title: '📜 Ancient Scroll',
        description: 'Discover the secrets hidden in ancient texts.',
        image: '/scroll.jpg',
        special: true
      },
      {
        lat: -26.1945,
        lng: 28.0290,
        radius: 60,
        title: '🪄 Magic Studies',
        description: 'Learn the mystical arts of magic and spellcasting.',
        image: '/magic.jpg',
        special: true
      }
    ];

    questLocations.forEach(quest => {
      const questCircle = window.L.circle([quest.lat, quest.lng], {
        color: '#8B4513',
        fillColor: '#D2691E',
        fillOpacity: 0.3,
        radius: quest.radius,
        weight: 2
      }).addTo(mapInstanceRef.current);

      // badge markup for special treasure hunts
      const badgeHTML = quest.special
        ? `<div class="quest-badge">⭐ <span class="badge-text">Treasure Hunt</span></div>`
        : '';

      // Add popup to quest area (include badge if special)
      questCircle.bindPopup(`
          <div class="quest-popup">
            ${badgeHTML}
            <h3>${quest.title}</h3>
            <div class="quest-image-container">
              <img src="${quest.image}" alt="Quest Image" class="quest-popup-image" />
            </div>
            <p>${quest.description}</p>
            <p><strong>Reward:</strong> ${quest.radius} points</p>
            <button class="quest-popup-btn quest-accept-btn" onclick="window.handleAcceptQuest()">Accept Quest</button>
          </div>
        `);

      // Extract emoji for center marker
      const titleEmojiMatch = quest.title.match(/^\p{Extended_Pictographic}/u);
      const titleEmoji = titleEmojiMatch ? titleEmojiMatch[0] : '🌟';

      questCircle._emoji = titleEmoji;

      const emojiIcon = window.L.divIcon({
        className: 'quest-emoji-icon',
        html: `<div class="quest-emoji">${titleEmoji}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      const emojiMarker = window.L.marker([quest.lat, quest.lng], { icon: emojiIcon }).addTo(mapInstanceRef.current);
      emojiMarker.bindPopup(questCircle.getPopup());
      questCircle._emojiMarker = emojiMarker;

      // Overlap click handling for emoji marker
      emojiMarker.on('click', (e) => {
        if (window.__questPlacing) return;
        questCircle.openPopup();
        if (e.originalEvent) {
          e.originalEvent.stopPropagation();
          e.originalEvent.preventDefault();
        }
      });

      // Overlap handling for quest circle
      questCircle.on('click', (e) => {
        const clickLatLng = e.latlng;
        if (!questCirclesRef?.current) return;
        const overlapping = questCirclesRef.current.filter(c =>
          c.getLatLng().distanceTo(clickLatLng) <= c.getRadius()
        );
        if (overlapping.length) {
          const smallest = overlapping.reduce((a, b) => a.getRadius() < b.getRadius() ? a : b);
          smallest.openPopup();
          if (e.originalEvent) {
            e.originalEvent.stopPropagation();
            e.originalEvent.preventDefault();
          }
        }
      });

      // Store reference for cleanup
      questCirclesRef.current.push(questCircle);
    });
  }, [allQuests, mapInstanceRef, questCirclesRef, currentUser]);

  // Map and header effects remain the same
  useEffect(() => {
    const initializeMap = () => {
      if (mapRef.current && !mapInstanceRef.current && window.L) {
        try {
          mapInstanceRef.current = window.L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false
          }).setView([-26.1929, 28.0305], 17);

          window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: ''
          }).addTo(mapInstanceRef.current);

          const customZoomControl = window.L.control.zoom({
            position: 'topleft'
          });
          customZoomControl.addTo(mapInstanceRef.current);

          const customIcon = window.L.divIcon({
            className: 'fantasy-marker',
            html: `<div class="fantasy-marker-content">
                     <div class="marker-pin"></div>
                     <div class="marker-pulse"></div>
                   </div>`,
            iconSize: [30, 40],
            iconAnchor: [15, 40]
          });

          window.L.marker([-26.1929, 28.0305], { icon: customIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`<div class="fantasy-popup">
                          <h3>🏰 Wits University</h3>
                          <p>Your adventure begins here!</p>
                        </div>`)
            .openPopup();

          // Add quest area highlights
          addQuestAreas();

          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize();
            }
          }, 100);
        } catch (error) {
          console.error('Error initializing map:', error);
        }
      }
    };



    if (window.L) {
      initializeMap();
    } else {
      const checkLeaflet = setInterval(() => {
        if (window.L) {
          clearInterval(checkLeaflet);
          initializeMap();
        }
      }, 100);
      setTimeout(() => clearInterval(checkLeaflet), 5000);
    }

    return () => {
      if (mapInstanceRef.current) {
        // Clean up quest circles
        questCirclesRef.current.forEach(circle => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(circle);
          }
        });
        questCirclesRef.current = [];

        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [addQuestAreas]);

  useEffect(() => {
    const updateHeaderOffset = () => {
      if (headerRef.current) {
        const h = headerRef.current.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--header-offset', `${h + 20}px`);
        if (mapInstanceRef.current) {
          setTimeout(() => mapInstanceRef.current.invalidateSize(), 60);
        }
      }
    };
    updateHeaderOffset();
    window.addEventListener('resize', updateHeaderOffset);
    window.addEventListener('orientationchange', updateHeaderOffset);
    return () => {
      window.removeEventListener('resize', updateHeaderOffset);
      window.removeEventListener('orientationchange', updateHeaderOffset);
    };
  }, []);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    logout();
  };

  const handleSignup = () => {
    navigate('/signup');
  };
  const handleProfileClick = () => {
    navigate('/ProfilePage');
  };

  const handleQuestbookClick = () => {
    navigate('/questbook');
  };

  // NEW: open create form only for logged-in users; otherwise go to login
  const handleCreateQuestClick = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setShowCreateForm(true);
  };

  // Add global function for Accept Quest button
  useEffect(() => {
    window.handleAcceptQuest = async (questId) => {
      if (!currentUser) {
        navigate('/login');
        return;
      }
      try {
        await acceptQuest(questId, currentUser.uid);
        alert('Quest accepted!');
      } catch (error) {
        alert('Failed to accept quest.');
        console.error(error);
      }
    };

    return () => {
      delete window.handleAcceptQuest;
    };
  }, [currentUser, navigate]);

  useEffect(() => {
    window.handleAbandonQuest = async (questId) => {
      if (!currentUser) {
        navigate('/login');
        return;
      }
      try {
        await abandonQuest(questId, currentUser.uid);
        alert('Quest abandoned.');
      } catch (error) {
        alert('Failed to abandon quest.');
        console.error(error);
      }
    };

    return () => {
      delete window.handleAbandonQuest;
    };
  }, [currentUser, navigate]);

  useEffect(() => {
    if (window.L && mapInstanceRef.current) {
      addQuestAreas();
    }
  }, [addQuestAreas]);

  // Focus map on quest if navigated from "View On Map"
  useEffect(() => {
    if (
      mapInstanceRef.current &&
      location.state &&
      location.state.focusQuest &&
      location.state.focusQuest.location
    ) {
      const { latitude, longitude } = location.state.focusQuest.location;
      if (
        typeof latitude === "number" &&
        typeof longitude === "number" &&
        !isNaN(latitude) &&
        !isNaN(longitude)
      ) {
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize(); // <-- Add this line
            mapInstanceRef.current.setView([latitude, longitude], 18, { animate: true }); // <-- And this line

            // Optionally, open the popup for that quest
            const questId = location.state.focusQuest.id;
            const questCircle = questCirclesRef.current.find(
              c => c.options && c.options.questId === questId
            );
            if (questCircle) {
              questCircle.openPopup();
            }
          }
        }, 200); // 200ms delay, adjust if needed
      } else {
        console.warn("Invalid quest location:", location.state.focusQuest.location);
      }
    }
    // eslint-disable-next-line
  }, [location.state, mapInstanceRef.current, questCirclesRef.current]);

  return (
    <section className="home-container">
      <header ref={headerRef} className="header">
        <section className="website-name">
          <img src={logoImage} alt="Logo" className="logo" />
          <h1>WITS ADVENTURE</h1>
        </section>

        {/* Create Quest button inserted between site name and user-area */}
        <button
          className="create-quest-btn"
          onClick={handleCreateQuestClick} // changed
          aria-label="Create Quest"
        >
          Create Quest
        </button>

        <section className="user-area">
          {currentUser ? ( // Conditional rendering based on currentUser
            <section className="user-profile" onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
              <section className="profile-icon">
                <img src={profilePicture} alt={`${username}'s avatar`} className="profile-icon-img" />
              </section>
              <span className="username">{username}</span>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </section>
          ) : (
            <section className="auth-buttons">
              <button className="signup-btn" onClick={handleSignup}>Sign Up </button>
              <button className="login-btn" onClick={handleLogin}>
                Login
              </button>
            </section>
          )}
        </section>
      </header>

      {/* Render floating form component (controlled by state) */}
      <CreateQuestForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        mapInstanceRef={mapInstanceRef}
        questCirclesRef={questCirclesRef}
      />

      <main className="map-section">
        <section className="map-container">
          <div className="map-frame">
            <div className="map-corners">
              <section className="corner top-left"></section>
              <section className="corner top-right"></section>
              <section className="corner bottom-left"></section>
              <section className="corner bottom-right"></section>
            </div>
            <div ref={mapRef} id="map" style={{ width: '100%', height: '100%' }}>
              <button className="questbook-icon" onClick={handleQuestbookClick}>
                <img src={questbookImage} alt="Questbook" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </section>
  );
};

export default Home;