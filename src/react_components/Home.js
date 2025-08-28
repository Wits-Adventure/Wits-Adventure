import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../css/Home.css';
import logoImage from '../media/LOGO_Alpha.png';
import questbookImage from '../media/questbook_outline.png';
import profilePic from '../assets/profile.jpg'; // default profile picture
import { useNavigate, useLocation } from 'react-router-dom';
import { logout, getUserData } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { getAllQuests, acceptQuest, abandonQuest } from '../firebase/general_quest_functions';
import CreateQuestForm from './CreateQuestForm';
import CompleteQuestForm from './CompleteQuestForm';
import { getProfileData } from '../firebase/profile_functions';

const Home = () => {
  const { currentUser } = useAuth();
  const [username, setUsername] = useState('');
  const [profilePicture, setProfilePicture] = useState(profilePic);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const headerRef = useRef(null);
  const questCirclesRef = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [allQuests, setAllQuests] = useState([]);
  const [acceptedQuests, setAcceptedQuests] = useState({});
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [activeQuest, setActiveQuest] = useState(null);

  // JOURNEY QUEST: Integrated with description, reward, and three stops
  const [journeyQuests, setJourneyQuests] = useState([
    {
      id: 'campus_explorer',
      name: 'Campus Explorer Quest',
      description: 'Visit the three key locations on campus in order.',
      reward: 50,
      stops: [
         { name: 'Stop 1: Cullen Library', latitude: -26.190630, longitude: 28.029952 },
        { name: 'Stop 2: Main Library', latitude: -26.1905, longitude: 28.0315 },
        { name: 'Stop 3: Law Lawns', latitude: -26.1890, longitude: 28.0320 }
      ],
      radius: 30, 
      currentStopIndex: 0
    }
  ]);

  // Fetch username
  useEffect(() => {
    const fetchUsername = async () => {
      if (currentUser) {
        try {
          const userData = await getUserData();
          setUsername(userData?.Name || 'User');
        } catch {
          setUsername('User');
        }
      } else setUsername('');
    };
    fetchUsername();
  }, [currentUser]);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (currentUser) {
        try {
          const profileData = await getProfileData();
          setUsername(profileData.Name || 'User');
          setProfilePicture(profileData.profilePicture || profilePic);
        } catch {
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

  // Fetch quests
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

  // Add quest circles (normal + journey)
  const addQuestAreas = useCallback(() => {
    if (!mapInstanceRef.current) return;

    // Remove old circles
    if (questCirclesRef.current.length) {
      questCirclesRef.current.forEach(circle => {
        mapInstanceRef.current.removeLayer(circle);
        if (circle._emojiMarker) mapInstanceRef.current.removeLayer(circle._emojiMarker);
      });
      questCirclesRef.current = [];
    }

    // Regular quests
    allQuests.forEach(quest => {
      if (!quest.location) return;
      const { latitude, longitude } = quest.location;
      const titleEmoji = quest.emoji || (quest.name?.match(/^\p{Extended_Pictographic}/u)?.[0]) || '🌟';
      const color = quest.color || '#8B4513';

      const questCircle = window.L.circle([latitude, longitude], {
        color,
        fillColor: color,
        fillOpacity: 0.3,
        radius: quest.radius || 50,
        weight: 2,
        questId: quest.id
      }).addTo(mapInstanceRef.current);

      const hasAccepted = acceptedQuests[quest.id] !== undefined
        ? acceptedQuests[quest.id]
        : (quest.acceptedBy && quest.acceptedBy.includes(currentUser?.uid));
      const isOwnQuest = currentUser && quest.creatorId === currentUser.uid;
      const buttonHtml = isOwnQuest
        ? `<button id="quest-btn-${quest.id}" class="quest-popup-btn your-quest-btn" disabled>Your Quest</button>`
        : hasAccepted
          ? `<button id="quest-btn-${quest.id}" class="quest-popup-btn abandon-quest-btn" onclick="window.handleAbandonQuest('${quest.id}')">Abandon Quest</button>`
          : `<button id="quest-btn-${quest.id}" class="quest-popup-btn quest-accept-btn" onclick="window.handleAcceptQuest('${quest.id}')">Accept Quest</button>`;

      questCircle.bindPopup(`
        <div class="quest-popup">
          <h3>${titleEmoji} ${quest.name}</h3>
          ${quest.imageUrl ? `<div class="quest-image-container"><img src="${quest.imageUrl}" alt="Quest Image" class="quest-popup-image" /></div>` : ''}
          <p><strong>Reward:</strong> ${quest.reward ?? quest.radius} points</p>
          ${buttonHtml}
        </div>
      `);

      const emojiIcon = window.L.divIcon({
        className: 'quest-emoji-icon',
        html: `<div class="quest-emoji">${titleEmoji}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      const emojiMarker = window.L.marker([latitude, longitude], { icon: emojiIcon }).addTo(mapInstanceRef.current);
      emojiMarker.bindPopup(questCircle.getPopup());
      questCircle._emojiMarker = emojiMarker;

      emojiMarker.on('click', e => {
        if (window.__questPlacing) return;
        questCircle.openPopup();
        if (e.originalEvent) {
          e.originalEvent.stopPropagation();
          e.originalEvent.preventDefault();
        }
      });

      questCirclesRef.current.push(questCircle);
    });

    // Journey quests: add markers for all stops
    journeyQuests.forEach(jq => {
      jq.stops.forEach((stop, index) => {
        if (!stop || !mapInstanceRef.current) return;
        const isCurrentStop = index === jq.currentStopIndex;
        const color = isCurrentStop ? '#1E90FF' : '#87CEFA';

        const jqCircle = window.L.circle([stop.latitude, stop.longitude], {
          color,
          fillColor: color,
          fillOpacity: 0.3,
          radius: jq.radius,
          weight: 2,
          questId: jq.id,
          journeyQuest: true
        }).addTo(mapInstanceRef.current);

        const popupHtml = `<div class="quest-popup">
            <h3>🗺️ ${jq.name} - Stop ${index + 1}</h3>
            <p>${stop.name}</p>
            ${isCurrentStop 
              ? `<button class="quest-popup-btn quest-accept-btn" onclick="window.handleAcceptJourneyQuest('${jq.id}')">Check Stop</button>` 
              : `<p>Next stop</p>`}
          </div>`;

        jqCircle.bindPopup(popupHtml);

        const jqEmojiMarker = window.L.marker([stop.latitude, stop.longitude], {
          icon: window.L.divIcon({ html: isCurrentStop ? '🗺️' : `${index + 1}`, className: 'quest-emoji-icon' })
        }).addTo(mapInstanceRef.current);
        jqEmojiMarker.bindPopup(jqCircle.getPopup());
        jqCircle._emojiMarker = jqEmojiMarker;

        jqEmojiMarker.on('click', e => {
          jqCircle.openPopup();
          if (e.originalEvent) {
            e.originalEvent.stopPropagation();
            e.originalEvent.preventDefault();
          }
        });

        questCirclesRef.current.push(jqCircle);
      });
    });

  }, [allQuests, currentUser, acceptedQuests, journeyQuests]);

  // Initialize map
  useEffect(() => {
    const initializeMap = () => {
      if (mapRef.current && !mapInstanceRef.current && window.L) {
        mapInstanceRef.current = window.L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false
        }).setView([-26.1929, 28.0305], 17);

        window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: ''
        }).addTo(mapInstanceRef.current);

        window.L.control.zoom({ position: 'topleft' }).addTo(mapInstanceRef.current);

        addQuestAreas();
        setTimeout(() => {
          if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
        }, 100);
      }
    };

    if (window.L) initializeMap();
    else {
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
        questCirclesRef.current.forEach(circle => mapInstanceRef.current.removeLayer(circle));
        questCirclesRef.current = [];
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [addQuestAreas]);

  // Header resize
  useEffect(() => {
    const updateHeaderOffset = () => {
      if (headerRef.current) {
        const h = headerRef.current.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--header-offset', `${h + 20}px`);
        if (mapInstanceRef.current) setTimeout(() => mapInstanceRef.current.invalidateSize(), 60);
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

  const handleLogin = () => navigate('/login');
  const handleLogout = () => logout();
  const handleSignup = () => navigate('/signup');
  const handleProfileClick = () => navigate('/ProfilePage');
  const handleQuestbookClick = () => navigate('/questbook');
  const handleCreateQuestClick = () => {
    if (!currentUser) return navigate('/login');
    setShowCreateForm(true);
  };

  // Accept/Abandon normal quests
  useEffect(() => {
    window.handleAcceptQuest = async (questId) => {
      if (!currentUser) return navigate('/login');
      const quest = allQuests.find(q => q.id === questId);
      if (!quest) return;

      setActiveQuest(quest);
      setShowCompleteForm(true);

      setAcceptedQuests(prev => ({ ...prev, [questId]: true }));

      try { await acceptQuest(questId, currentUser.uid); }
      catch (error) {
        setAcceptedQuests(prev => ({ ...prev, [questId]: false }));
        alert('Failed to accept quest.');
        console.error(error);
      }
    };

    window.handleAbandonQuest = async (questId) => {
      setAcceptedQuests(prev => ({ ...prev, [questId]: false }));
      try { await abandonQuest(questId, currentUser.uid); }
      catch (error) {
        setAcceptedQuests(prev => ({ ...prev, [questId]: true }));
        alert('Failed to abandon quest.');
        console.error(error);
      }
    };

    window.handleAcceptJourneyQuest = (questId) => {
      const jq = journeyQuests.find(j => j.id === questId);
      if (!jq) return;
      if (!acceptedQuests[jq.id]) {
        setAcceptedQuests(prev => ({ ...prev, [jq.id]: true }));
        alert(`You accepted the journey quest: ${jq.name}`);
      } else {
        // Check current stop
        validateJourneyStop(jq);
      }
    };

    window.handleAbandonJourneyQuest = (questId) => {
      setAcceptedQuests(prev => ({ ...prev, [questId]: false }));
      alert('Journey quest abandoned.');
    };

    return () => {
      delete window.handleAcceptQuest;
      delete window.handleAbandonQuest;
      delete window.handleAcceptJourneyQuest;
      delete window.handleAbandonJourneyQuest;
    };
  }, [currentUser, navigate, allQuests, journeyQuests, acceptedQuests]);

  useEffect(() => {
    if (window.L && mapInstanceRef.current) addQuestAreas();
  }, [addQuestAreas]);

  // Distance calculation
  const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const toRad = deg => deg * (Math.PI / 180);
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Validate journey stop
  const validateJourneyStop = (jq) => {
    if (!navigator.geolocation) return alert('Geolocation not supported.');
    if (!acceptedQuests[jq.id]) return alert('You must accept the quest first.');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const currentStop = jq.stops[jq.currentStopIndex];
        if (!currentStop) return;

        const distance = getDistanceFromLatLonInMeters(
          latitude, longitude,
          currentStop.latitude, currentStop.longitude
        );

        if (distance <= jq.radius) {
          alert(`You've reached: ${currentStop.name}!`);
          jq.currentStopIndex++;
          setJourneyQuests([...journeyQuests]);
          if (jq.currentStopIndex >= jq.stops.length) {
            alert(`Congratulations! You completed the journey quest: ${jq.name}`);
            setAcceptedQuests(prev => ({ ...prev, [jq.id]: false }));
          } else {
            alert(`Proceed to the next stop: ${jq.stops[jq.currentStopIndex].name}`);
          }
        } else {
          alert(`You are ${Math.round(distance)}m away from ${currentStop.name}. Move closer!`);
        }
      },
      (error) => alert('Unable to get your location'),
      { enableHighAccuracy: true }
    );
  };

  // Focus map on quest if navigated from Questbook
  useEffect(() => {
    if (mapInstanceRef.current && location.state?.focusQuest?.location) {
      const { latitude, longitude } = location.state.focusQuest.location;
      if (typeof latitude === "number" && typeof longitude === "number") {
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
            mapInstanceRef.current.setView([latitude, longitude], 18, { animate: true });
            const questId = location.state.focusQuest.id;
            const questCircle = questCirclesRef.current.find(c => c.options?.questId === questId);
            if (questCircle) questCircle.openPopup();
          }
          navigate(".", { replace: true, state: {} });
        }, 200);
      }
    }
  }, [location.state, navigate]);

  return (
    <section className="home-container">
      <header ref={headerRef} className="header">
        <section className="website-name">
          <img src={logoImage} alt="Logo" className="logo" />
          <h1>WITS ADVENTURE</h1>
        </section>

        <button className="create-quest-btn" onClick={handleCreateQuestClick} aria-label="Create Quest">
          Create Quest
        </button>

        <section className="user-area">
          {currentUser ? (
            <section className="user-profile" onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
              <section className="profile-icon">
                <img src={profilePicture} alt={`${username}'s avatar`} className="profile-icon-img" />
              </section>
              <span className="username">{username}</span>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </section>
          ) : (
            <section className="auth-buttons">
              <button className="signup-btn" onClick={handleSignup}>Sign Up</button>
              <button className="login-btn" onClick={handleLogin}>Login</button>
            </section>
          )}
        </section>
      </header>

      <CompleteQuestForm
        isOpen={showCompleteForm}
        onClose={() => { setShowCompleteForm(false); setActiveQuest(null); }}
        quest={activeQuest}
      />

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
            <div ref={mapRef} id="map" className="map"></div>
          </div>
        </section>
      </main>
    </section>
  );
};

export default Home;
