import React, { useState, useEffect, useRef } from 'react';
import '../Home.css';
import logoImage from '../media/LOGO_Alpha.png';
import questbookImage from '../media/questbook_outline.png';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const headerRef = useRef(null); // NEW

  // Initialize map when component mounts
  useEffect(() => {
    // Add a small delay to ensure DOM is ready
    const initializeMap = () => {
      if (mapRef.current && !mapInstanceRef.current && window.L) {
        try {
          // Initialize the map with higher zoom level
          mapInstanceRef.current = window.L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false
          }).setView([-26.1929, 28.0305], 17);

          // Use OpenStreetMap for better building visibility
          window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: ''
          }).addTo(mapInstanceRef.current);

          // Add custom zoom control
          const customZoomControl = window.L.control.zoom({
            position: 'topleft'
          });
          customZoomControl.addTo(mapInstanceRef.current);

          // Create custom marker
          const customIcon = window.L.divIcon({
            className: 'fantasy-marker',
            html: `<div class="fantasy-marker-content">
                     <div class="marker-pin"></div>
                     <div class="marker-pulse"></div>
                   </div>`,
            iconSize: [30, 40],
            iconAnchor: [15, 40]
          });

          // Add marker
          window.L.marker([-26.1929, 28.0305], { icon: customIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`<div class="fantasy-popup">
                          <h3>🏰 Wits University</h3>
                          <p>Your adventure begins here!</p>
                        </div>`)
            .openPopup();

          // Force map to resize after initialization
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

    // Check if Leaflet is loaded, if not wait a bit
    if (window.L) {
      initializeMap();
    } else {
      const checkLeaflet = setInterval(() => {
        if (window.L) {
          clearInterval(checkLeaflet);
          initializeMap();
        }
      }, 100);

      // Clear interval after 5 seconds to avoid infinite checking
      setTimeout(() => clearInterval(checkLeaflet), 5000);
    }

    // Cleanup function
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
        // Add some breathing room below header (adjust 20 if needed)
        document.documentElement.style.setProperty('--header-offset', `${h + 20}px`);
        if (mapInstanceRef.current) {
          // Delay to allow layout to settle
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

  // Mock login function - replace with actual authentication
  const handleLogin = () => {
    setIsLoggedIn(true);
    setUsername('JohnDoe'); // Replace with actual username from auth
  };

  // Mock logout function
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
  };

  // Handle questbook click
  const handleQuestbookClick = () => {
    console.log('Questbook clicked!');
    // Add your questbook functionality here
  };

  return (
    <section className="home-container">
      {/* Header */}
      <header ref={headerRef} className="header">
        {/* Website Name with Logo */}
        <section className="website-name">
          <img src={logoImage} alt="Logo" className="logo" />
          <h1>WITS ADVENTURE</h1>
        </section>

        {/* User Profile Area */}
        <section className="user-area">
          {isLoggedIn ? (
            <section className="user-profile">
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
              <button className="signup-btn">Sign Up</button>
              <button className="login-btn" onClick={handleLogin}>
                Login
              </button>
            </section>
          )}
        </section>
      </header>
      {/* Map Container */}
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
              {/* Questbook icon positioned at bottom right of map */}
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