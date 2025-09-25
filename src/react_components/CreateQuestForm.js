import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../css/CreateQuestForm.css';
import { useAuth } from '../context/AuthContext';
import { getUserData, } from '../firebase/firebase';
import { saveQuestToFirestore } from '../firebase/general_quest_functions';

export default function CreateQuestForm({ isOpen, onClose, mapInstanceRef, questCirclesRef }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState(''); // NEW: description state
  const [radius, setRadius] = useState(45);
  const [questImage, setQuestImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [following, setFollowing] = useState(false);
  const followMarkerRef = useRef(null);
  const moveHandlerRef = useRef(null);
  const clickHandlerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const { currentUser } = useAuth();
  const [username, setUsername] = useState('');

  const stopFollowing = useCallback(() => {
    const map = mapInstanceRef?.current;
    if (map) {
      if (moveHandlerRef.current) map.off('mousemove', moveHandlerRef.current);
      if (clickHandlerRef.current) map.off('click', clickHandlerRef.current);
      map.getContainer().classList.remove('quest-placing');
    }

    if (questCirclesRef?.current) {
      questCirclesRef.current.forEach(c => {
        if (c._path) {
          c._path.style.pointerEvents = c._path.dataset.prevPointer || 'auto';
          delete c._path.dataset.prevPointer;
        }
        if (c._emojiMarker && c._emojiMarker._icon) {
          const iconEl = c._emojiMarker._icon;
          iconEl.style.pointerEvents = iconEl.dataset.prevPointer || 'auto';
          delete iconEl.dataset.prevPointer;
        }
      });
    }
    if (followMarkerRef.current && mapInstanceRef?.current) {
      mapInstanceRef.current.removeLayer(followMarkerRef.current);
      followMarkerRef.current = null;
    }
    window.__questPlacing = false;
    setFollowing(false);
    setName('');
    setRadius(45);
    setQuestImage(null);
    setImagePreview(null);
  }, [mapInstanceRef, questCirclesRef]);

  useEffect(() => {
    const fetchUsername = async () => {
      if (currentUser) {
        try {
          const userData = await getUserData();
          setUsername(userData?.Name || 'User');
        } catch (error) {
          console.error("Failed to fetch username:", error);
          setUsername('User');
        }
      }
    };
    fetchUsername();
  }, [currentUser]);

  const emojiCatalog = [
    '🗡️', '⚔️', '🛡️', '🐉', '🧙‍♂️', '🏰', '📜', '🗺️', '💰', '👑',
    '💀', '🧪', '🪓', '🏹', '🧝', '🧚‍♀️', '🔮', '🗝️', '🔥', '🪄',
    '🪙', '🌟', '🪶', '🍄', '🦄', '🏺', '🧟', '⚗️', '⛲', '🪨',
    '🍷', '🕯️', '📯', '🪤', '🧭', '🔔', '📯', '🪶', '🪄', '🛡️',
    '🪙', '🧿', '💎', '🔱', '🏺', '🪓', '🏹', '🦅', '🦇', '🐺',
    '🌙', '☀️', '🌪️', '☄️', '✨', '🪄', '🧜‍♀️', '🧞‍♂️', '🧌', '🧝‍♀️',
    '🧛‍♂️', '🧚‍♂️', '🪄', '🎇', '🕯️', '📯', '🔔', '🧺', '🏔️', '🌲'
  ];

  useEffect(() => {
    return () => stopFollowing();
  }, [stopFollowing]);

  function pickRandomEmoji() {
    const idx = Math.floor(Math.random() * emojiCatalog.length);
    return emojiCatalog[idx];
  }

  function randomHslColor() {
    const h = Math.floor(Math.random() * 360);
    const s = 65 + Math.floor(Math.random() * 20);
    const l = 40 + Math.floor(Math.random() * 15);
    return `hsl(${h} ${s}% ${l}%)`;
  }

  const startFollowing = () => {
    const map = mapInstanceRef?.current;
    if (!map) {
      alert('Map not ready yet.');
      return;
    }

    if (questCirclesRef?.current) {
      questCirclesRef.current.forEach(c => {
        if (c._path) {
          c._path.dataset.prevPointer = c._path.style.pointerEvents || '';
          c._path.style.pointerEvents = 'none';
        }
        if (c._emojiMarker && c._emojiMarker._icon) {
          const iconEl = c._emojiMarker._icon;
          iconEl.dataset.prevPointer = iconEl.style.pointerEvents || '';
          iconEl.style.pointerEvents = 'none';
        }
      });
    }

    window.__questPlacing = true;
    map.getContainer().classList.add('quest-placing');
    setFollowing(true);
    onClose?.();

    const followIcon = window.L.divIcon({
      className: 'quest-follow-marker',
      html: `<div class="quest-follow-icon"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      interactive: false
    });

    followMarkerRef.current = window.L.marker(map.getCenter(), { icon: followIcon, interactive: false }).addTo(map);

    moveHandlerRef.current = (e) => {
      if (followMarkerRef.current) followMarkerRef.current.setLatLng(e.latlng);
    };
    map.on('mousemove', moveHandlerRef.current);

    clickHandlerRef.current = async (e) => {
      const clickLatLng = e.latlng;
      const offsetDistance = Math.random() * radius;
      const offsetAngle = Math.random() * 360;

      const metersPerDegreeLat = 111132;
      const metersPerDegreeLng = metersPerDegreeLat * Math.cos(clickLatLng.lat * (Math.PI / 180));

      const latOffset = (offsetDistance * Math.cos(offsetAngle * (Math.PI / 180))) / metersPerDegreeLat;
      const lngOffset = (offsetDistance * Math.sin(offsetAngle * (Math.PI / 180))) / metersPerDegreeLng;

      const circleCenterLatLng = window.L.latLng(clickLatLng.lat - latOffset, clickLatLng.lng - lngOffset);

      const color = randomHslColor();
      const rawName = name.trim();
      const userEmoji = extractLeadingEmoji(rawName);
      const baseName = userEmoji ? rawName.replace(/^\p{Extended_Pictographic}\s*/u, '').trim() : rawName;
      const chosenEmoji = userEmoji || pickRandomEmoji();
      const displayName = `${chosenEmoji} ${baseName || 'Unnamed Quest'}`;
      const safeName = escapeHtml(displayName);

      const circle = window.L.circle(circleCenterLatLng, {
        color,
        fillColor: color,
        fillOpacity: 0.85,
        radius: radius,
        weight: 3,
        opacity: 0.95,
        className: 'quest-circle'
      }).addTo(map);
      circle._emoji = chosenEmoji;

      const popupHtml = `
        <div class="quest-popup">
          <h3>${safeName}</h3>
          <p class="quest-desc">${escapeHtml((description && description.trim()) ? description : 'Placeholder Description')}</p>
          <div class="quest-image-container">
            <img src="${imagePreview}" alt="Quest Image" class="quest-popup-image" />
          </div>
          <p>Placed here by ${username}</p>
          <p><strong>Reward:</strong> ${radius} points</p>
          <button class="quest-popup-btn your-quest-btn" disabled>Your Quest</button>
        </div>
      `;
      circle.bindPopup(popupHtml);

      const emojiIcon = window.L.divIcon({
        className: 'quest-emoji-icon',
        html: `<div class="quest-emoji">${chosenEmoji}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      const emojiMarker = window.L.marker(circleCenterLatLng, {
        icon: emojiIcon,
        riseOnHover: true
      }).addTo(map);
      emojiMarker.bindPopup(popupHtml);
      circle._emojiMarker = emojiMarker;

      if (questCirclesRef && Array.isArray(questCirclesRef.current)) {
        questCirclesRef.current.push(circle);
      }

      // Save quest to Firestore
      const questData = {
        name: baseName || 'Unnamed Quest',
        description, // NEW
        radius: radius,
        reward: radius,
        lat: circleCenterLatLng.lat,
        lng: circleCenterLatLng.lng,
        imageFile: questImage,
        creatorId: currentUser?.uid || 'unknown',
        creatorName: username || 'User',
        emoji: chosenEmoji,
        color: color
      };
      // REMOVED await: This now runs in the background
      saveQuestToFirestore(questData);

      // This will now run immediately
      stopFollowing();
    };

    map.once('click', clickHandlerRef.current);
  };



  const handleSelectLocation = (e) => {
    e.preventDefault();
    if (!questImage) {
      alert('Please upload an image before selecting a location.');
      return;
    }
    startFollowing();
  };

  const handleCancel = () => {
    if (following) stopFollowing();
    setName('');
    setDescription(''); // NEW
    setRadius(45);
    setQuestImage(null);
    setImagePreview(null);
    onClose?.();
  };

  const handleImageUpload = (file) => {
    if (file && file.type.startsWith('image/')) {
      setQuestImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      alert('Please upload a valid image file.');
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleImageUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  // Prevent map/global key handlers (e.g., Space) from interfering with typing
  const stopKeyPropagation = (e) => {
    e.stopPropagation();
  };

  if (!isOpen && !following) return null;

  return (
    <div className={`create-quest-portal ${isOpen ? 'open' : ''}`} role="dialog" aria-modal="true" onKeyDown={stopKeyPropagation}>
      {!following && (
        <form className="create-quest-form" onSubmit={(e) => e.preventDefault()}>
          <h3>Create Quest</h3>
          <label className="cq-label">
            Quest name
            <input
              className="cq-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={stopKeyPropagation}
              onKeyUp={stopKeyPropagation}
              placeholder="Enter quest name"
              maxLength={60}
              autoFocus
              autoComplete="off"
              spellCheck
            />
          </label>

          <label className="cq-label">
            Description
            <textarea
              className="cq-input cq-textarea" // match title input styles
              draggable={false}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={stopKeyPropagation}
              onKeyUp={stopKeyPropagation}
              placeholder="Briefly describe the quest..."
              rows={3}
              autoComplete="off"
              spellCheck
            />
          </label>

          <label className="cq-label">
            Quest Radius (m)
            <input
              type="range"
              className="cq-slider"
              min="25"
              max="150"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
            />
            <span className="cq-radius-display">{radius}m</span>
          </label>

          <div className="cq-reward">
            <p>Quest Reward: <strong>{radius} points</strong></p>
          </div>

          <div className="cq-image-section">
            <label className="cq-label">Quest Image (Required)</label>
            <div
              className={`cq-image-dropzone ${dragActive ? 'drag-active' : ''} ${imagePreview ? 'has-image' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDrag}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="cq-image-preview">
                  <img src={imagePreview} alt="Quest Preview" />
                  <div className="cq-image-overlay">
                    <span>Click to change image</span>
                  </div>
                </div>
              ) : (
                <div className="cq-image-placeholder">
                  <div className="cq-upload-icon">📸</div>
                  <p>Click to upload or drag image here</p>
                  <span className="cq-image-hint">PNG, JPG, GIF up to 5MB</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
          </div>

          <div className="cq-actions">
            <button
              className={`cq-btn cq-select ${!questImage ? 'disabled' : ''}`}
              onClick={handleSelectLocation}
              type="button"
              disabled={!questImage}
            >
              Select Location
            </button>
            <button className="cq-btn cq-cancel" onClick={handleCancel} type="button">
              Cancel
            </button>
          </div>
          <p className="cq-hint">After pressing "Select Location", click on the map to place the quest.</p>
        </form>
      )}

      {following && (
        <div className="create-quest-follow">
          <div className="follow-instructions">Click on the map to place the quest: <strong>{name || 'Unnamed Quest'}</strong></div>
          <button className="cq-btn cq-cancel" onClick={() => stopFollowing()} type="button">Abort</button>
        </div>
      )}
    </div>
  );
}

// Helpers
function escapeHtml(unsafe) {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function extractLeadingEmoji(str) {
  if (!str) return null;
  const m = str.trim().match(/^\p{Extended_Pictographic}/u);
  return m ? m[0] : null;
}
