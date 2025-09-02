import { saveQuestToFirestore } from './firebase/firebase';
import { getAllQuests } from './firebase/firebase';

// Helper functions for quest creation
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

const emojiCatalog = [
  '🗡️', '⚔️', '🛡️', '🐉', '🧙‍♂️', '🏰', '📜', '🗺️', '💰', '👑',
  '💀', '🧪', '🪓', '🏹', '🧝', '🧚‍♀️', '🔮', '🗝️', '🔥', '🪄',
  '🪙', '🌟', '🪶', '🍄', '🦄', '🏺', '🧟', '⚗️', '⛲', '🪨',
  '🍷', '🕯️', '📯', '🪤', '🧭', '🔔', '📯', '🪶', '🪄', '🛡️',
  '🪙', '🧿', '💎', '🔱', '🏺', '🪓', '🏹', '🦅', '🦇', '🐺',
  '🌙', '☀️', '🌪️', '☄️', '✨', '🪄', '🧜‍♀️', '🧞‍♂️', '🧌', '🧝‍♀️',
  '🧛‍♂️', '🧚‍♂️', '🪄', '🎇', '🕯️', '📯', '🔔', '🧺', '🏔️', '🌲'
];

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

/**
 * Creates and saves a new quest at a specified location using the backend API.
 * @param {object} props - The properties needed to create the quest.
 * @param {object} props.latLng - The latitude and longitude for the quest.
 * @param {React.RefObject} props.mapInstanceRef - Ref to the Leaflet map instance.
 * @param {number} props.radius - The quest's radius in meters.
 * @param {string} props.name - The quest's name.
 * @param {string} props.imagePreview - The URL for the quest's image (for display).
 * @param {File} props.questImageFile - The image file object to upload.
 * @param {string} props.username - The name of the user creating the quest.
 * @param {object} props.currentUser - The current authenticated user object.
 * @param {React.RefObject} props.questCirclesRef - Ref to the array of quest circles.
 * @param {function} props.stopFollowing - The function to stop the "following" state.
 */
export const createQuestAtLocation = async ({
  latLng,
  mapInstanceRef,
  radius,
  name,
  imagePreview,
  questImageFile,
  username,
  currentUser,
  questCirclesRef,
  stopFollowing,
}) => {
  const map = mapInstanceRef?.current;
  if (!map) return;

  try {
    // 1. Upload the image to the backend endpoint first
    const formData = new FormData();
    formData.append('questImage', questImageFile);
    formData.append('userId', currentUser.uid);

    const imageResponse = await fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!imageResponse.ok) {
      const errorData = await imageResponse.json();
      throw new Error(errorData.error || 'Failed to upload image.');
    }
    const imageData = await imageResponse.json();
    const imageUrl = imageData.imageUrl;

    // 2. Prepare quest data with the received image URL
    const offsetDistance = Math.random() * radius;
    const offsetAngle = Math.random() * 360;

    const metersPerDegreeLat = 111132;
    const metersPerDegreeLng = metersPerDegreeLat * Math.cos(latLng.lat * (Math.PI / 180));

    const latOffset = (offsetDistance * Math.cos(offsetAngle * (Math.PI / 180))) / metersPerDegreeLat;
    const lngOffset = (offsetDistance * Math.sin(offsetAngle * (Math.PI / 180))) / metersPerDegreeLng;

    const circleCenterLatLng = window.L.latLng(latLng.lat - latOffset, latLng.lng - lngOffset);

    const color = randomHslColor();
    const rawName = name.trim();
    const userEmoji = extractLeadingEmoji(rawName);
    const baseName = userEmoji ? rawName.replace(/^\p{Extended_Pictographic}\s*/u, '').trim() : rawName;
    const chosenEmoji = userEmoji || pickRandomEmoji();
    const displayName = `${chosenEmoji} ${baseName || 'Unnamed Quest'}`;
    const safeName = escapeHtml(displayName);

    const questData = {
      name: baseName || 'Unnamed Quest',
      radius: radius,
      reward: radius,
      lat: circleCenterLatLng.lat,
      lng: circleCenterLatLng.lng,
      imageUrl: imageUrl, // Use the URL from the backend
      creatorId: currentUser?.uid || 'unknown',
      creatorName: username || 'User',
      emoji: chosenEmoji,
      color: color
    };

    // 3. Send quest data to the backend API
    const questResponse = await fetch('http://localhost:5000/api/quests/create-quest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questData),
    });

    if (!questResponse.ok) {
      const errorData = await questResponse.json();
      throw new Error(errorData.error || 'Failed to create quest.');
    }
    const questResult = await questResponse.json();
    console.log('Quest created with ID:', questResult.questId);

    // 4. Render the new quest on the map
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
        <div class="quest-image-container">
          <img src="${imageUrl}" alt="Quest Image" class="quest-popup-image" />
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
    
    stopFollowing();
    map.flyTo(circleCenterLatLng, 15);
    alert(`Quest "${displayName}" created successfully!`);

  } catch (error) {
    console.error("Error creating quest:", error);
    alert(`Failed to create quest: ${error.message}`);
  }
};

/**
 * Uses the HTML5 Geolocation API to get the user's current position.
 * @param {object} questCreationProps - All the necessary props to be passed to createQuestAtLocation.
 */
export const getLocation = (questCreationProps) => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLatLng = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        createQuestAtLocation({ ...questCreationProps, latLng: userLatLng });
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Could not get your location. Please ensure location services are enabled and you have granted permission.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Location access denied. Please enable it in your browser settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Location information is currently unavailable.";
        }
        alert(errorMessage);
      }
    );
  } else {
    alert("Geolocation is not supported by this browser.");
  }
};