import React, { useState, useEffect, useRef } from 'react';
import '../css/Home.css';
import logoImage from '../media/LOGO_Alpha.png';
import questbookImage from '../media/questbook_outline.png';
import { useNavigate } from 'react-router-dom';
import { logout, getUserData } from '../firebase/firebase'; // Import getUserData
import { useAuth } from '../context/AuthContext'; // Import useAuth hook

const Home = () => {
  const { currentUser } = useAuth(); // Use the auth context to get the current user
  const [username, setUsername] = useState('');
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const headerRef = useRef(null);
  const navigate = useNavigate();

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
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

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

  return (
    <section className="home-container">
      <header ref={headerRef} className="header">
        <section className="website-name">
          <img src={logoImage} alt="Logo" className="logo" />
          <h1>WITS ADVENTURE</h1>
        </section>

        <section className="user-area">
          {currentUser ? ( // Conditional rendering based on currentUser
            <section className="user-profile" onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
              <section className="profile-icon">
                {username.charAt(0).toUpperCase()}
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