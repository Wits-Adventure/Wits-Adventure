import React, { useState, useRef, useCallback, useEffect } from 'react';
import '../css/CreateQuestForm.css';
import { useAuth } from '../context/AuthContext';
import {
  createQuestAtLocation,
  getLocation
} from './general_quest_functions';

export default function CreateQuestForm({ isOpen, onClose, mapInstanceRef, questCirclesRef }) {
  const [name, setName] = useState('');
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
          const response = await fetch(`http://localhost:5000/api/profile?uid=${currentUser.uid}`);
          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }
          const userData = await response.json();
          setUsername(userData.Name || 'User');
        } catch (error) {
          console.error("Failed to fetch username:", error);
          setUsername('User');
        }
      }
    };
    fetchUsername();
  }, [currentUser]);

  useEffect(() => {
    return () => stopFollowing();
  }, [stopFollowing]);

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
      createQuestAtLocation({
        latLng: e.latlng,
        mapInstanceRef,
        radius,
        name,
        imagePreview,
        username,
        currentUser,
        questCirclesRef,
        stopFollowing
      });
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

  if (!isOpen && !following) return null;

  return (
    <div className={`create-quest-portal ${isOpen ? 'open' : ''}`} role="dialog" aria-modal="true">
      {!following && (
        <form className="create-quest-form" onSubmit={(e) => e.preventDefault()}>
          <h3>Create Quest</h3>
          <label className="cq-label">
            Quest name
            <input
              className="cq-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter quest name"
              maxLength={60}
              autoFocus
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
              onClick={() => getLocation({
                mapInstanceRef,
                radius,
                name,
                imagePreview,
                username,
                currentUser,
                questCirclesRef,
                stopFollowing
              })}
              type="button"
              disabled={!questImage}
            >
              Use My Location 🗺️
            </button>
            <button
              className={`cq-btn cq-select ${!questImage ? 'disabled' : ''}`}
              onClick={handleSelectLocation}
              type="button"
              disabled={!questImage}
            >
              Select on Map
            </button>
            <button className="cq-btn cq-cancel" onClick={handleCancel} type="button">
              Cancel
            </button>
          </div>
          <p className="cq-hint">After pressing "Select on Map", click on the map to place the quest.</p>
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