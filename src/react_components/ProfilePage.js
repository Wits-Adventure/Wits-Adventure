import React, { useState, useEffect, useRef } from "react";
import "../css/ProfilePage.css";
import profilePic from "../assets/profile.jpg";
import editIcon from "../assets/edit_icon.png";
import cardCustomizationImg from "../media/cardcustomization.png";
import backgroundCustomizationImg from "../media/backgroundcustomization.png";
import border1 from "../media/Borders1.png";
import border2 from "../media/Borders2.png";
import border3 from "../media/Borders3.png";
import border4 from "../media/Borders4.png";
import border5 from "../media/Borders5.png";
import border6 from "../media/Borders6.png";
import { getProfileData, updateProfileData, getUserInventoryItems, unlockInventoryItem, setCustomisation, getCustomisation } from "../firebase/profile_functions";
import { useNavigate } from "react-router-dom";
import { getAllQuests } from "../firebase/general_quest_functions";
import QuestManager from "./QuestManager";

export default function ProfilePage({ mapInstanceRef, questCirclesRef }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [editedBio, setEditedBio] = useState("");
  const [editedProfilePic, setEditedProfilePic] = useState(profilePic);
  const [createdQuests, setCreatedQuests] = useState([]);

  // NEW: static inventory items visible to all users
  const [inventoryItems] = useState([
    { id: 'card-customization', name: 'Card Customization', image: cardCustomizationImg, color: 'hsl(30 60% 70%)' },
    { id: 'background-customization', name: 'Background Customization', image: backgroundCustomizationImg, color: 'hsl(42 55% 72%)' },

    // Six new square border blocks
    { id: 'border-1', name: 'Border 1', image: border1 },
    { id: 'border-2', name: 'Border 2', image: border2 },
    { id: 'border-3', name: 'Border 3', image: border3 },
    { id: 'border-4', name: 'Border 4', image: border4 },
    { id: 'border-5', name: 'Border 5', image: border5 },
    { id: 'border-6', name: 'Border 6', image: border6 }
  ]);
  // Quest Manager state
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [isQuestManagerOpen, setIsQuestManagerOpen] = useState(false);

  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  const handleCloseQuest = (questId) => {
    setCreatedQuests((prev) => prev.filter((q) => q.id !== questId));
  };

  const handleBackHome = () => {
    navigate("/");
  };

  function pastelizeHSL(hslString) {
    // Example input: "hsl(0 80% 40%)"
    const match = hslString.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
    if (!match) return hslString;
    const h = match[1];
    const origS = Number(match[2]);
    const origL = Number(match[3]);
    const s = Math.max(45, Math.min(65, Math.round(origS * 0.7))); // 45–65% saturation
    const l = Math.max(60, Math.min(80, Math.round(origL + 15)));  // 60–80% lightness
    return `hsl(${h} ${s}% ${l}%)`;
  }

  // Fetch data from Firebase when the component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const profileData = await getProfileData();
        setUser({
          ...profileData,
          username: profileData.Name,
          points: profileData.LeaderBoardPoints,
          questsCompleted: profileData.CompletedQuests.filter((quest) => quest.creatorID !== profileData.uid).length,
          questsInProgress: profileData.acceptedQuests.filter((quest) => quest.creatorID !== profileData.uid).length,
          level: profileData.Level,
          bio: profileData.Bio,
          profilePicture: profileData.profilePicture || profilePic,
          experience: profileData.Experience,
          spendablePoints: profileData.SpendablePoints,
          rank: 12, // Placeholder
        });
        setEditedUsername(profileData.Name);
        setEditedBio(profileData.Bio);

        const inventory = await getUserInventoryItems();
        setUnlockedItems(inventory);

        // Fetch customisation object
        const custom = await getCustomisation();
        if (custom.borderId) {
          const borderItem = inventoryItems.find(i => i.id === custom.borderId);
          setSelectedBorderImage(borderItem ? borderItem.image : null);
        }
        if (custom.cardColor) {
          setCardColor(custom.cardColor);
          document.documentElement.style.setProperty('--card-bg', gradientFromHex(custom.cardColor));
          document.documentElement.style.setProperty('--card-border', darkenHex(custom.cardColor, 22));
        }
        if (custom.backgroundColor) {
          setBgColor(custom.backgroundColor);
          setPageBgColor(custom.backgroundColor);
          document.body.style.background = custom.backgroundColor;
        }

        // Fetch all quests and filter by creatorId
        const allQuests = await getAllQuests();
        const userCreated = allQuests
          .filter(q => q.creatorId === profileData.uid)
          .map(q => ({
            ...q,
            location: q.location && typeof q.location._latitude === "number"
              ? { latitude: q.location._latitude, longitude: q.location._longitude }
              : q.location && typeof q.location.latitude === "number"
                ? { latitude: q.location.latitude, longitude: q.location.longitude }
                : null
          }));
        setCreatedQuests(userCreated);

        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateProfileData({
        uid: user.uid,
        Name: editedUsername,
        Bio: editedBio,
        ProfilePictureUrl: editedProfilePic
      });
      setUser({
        ...user,
        username: editedUsername,
        bio: editedBio,
        profilePicture: editedProfilePic,
      });
      setIsEditing(false);
    } catch (err) {
      alert("Failed to update profile. Please try again.");
      console.error(err);
    }
  };

  const handleCancel = () => {
    setEditedUsername(user.username);
    setEditedBio(user.bio);
    setEditedProfilePic(user.profilePicture);
    setIsEditing(false);
  };

  // Replaces previous handleProfilePicChange - supports both click-select and drag/drop
  const processFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEditedProfilePic(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleProfilePicChange = (e) => {
    // e can be from input change or drop event
    const file = e?.target?.files?.[0] || e?.dataTransfer?.files?.[0];
    if (file) processFile(file);
    setIsDragging(false);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // NEW: remove profile image and reset to default in public folder
  const handleRemoveImage = () => {
    setEditedProfilePic('/default.jpg');
    if (fileInputRef.current) {
      try {
        fileInputRef.current.value = null;
      } catch (err) {
        // ignore if not supported
      }
    }
  };

  // Background picker state
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [bgColor, setBgColor] = useState("#FFEEC8"); // default light beige hex
  const [pageBgColor, setPageBgColor] = useState(null);
  const prevBgColorRef = useRef(null);

  // Card picker state (new)
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [cardColor, setCardColor] = useState("#FFEAC8");
  const prevCardColorRef = useRef(null);

  // Selected border overlay for profile picture
  const [selectedBorderImage, setSelectedBorderImage] = useState(null);

  // small helper: darken hex by amount (0-100)
  const darkenHex = (hex, amount = 18) => {
    try {
      const raw = hex.replace("#", "");
      const r = Math.max(0, parseInt(raw.substring(0, 2), 16) - amount);
      const g = Math.max(0, parseInt(raw.substring(2, 4), 16) - amount);
      const b = Math.max(0, parseInt(raw.substring(4, 6), 16) - amount);
      const toHex = (v) => v.toString(16).padStart(2, "0");
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch {
      return "#90774c";
    }
  };

  // produce a subtle two-stop gradient from a base hex
  const gradientFromHex = (hex) => {
    const stop1 = hex;
    const stop2 = darkenHex(hex, 18);
    return `linear-gradient(135deg, ${stop1} 0%, ${stop2} 100%)`;
  };

  // Initialize CSS card variables on first load so page uses the current cardColor
  useEffect(() => {
    try {
      const root = getComputedStyle(document.documentElement);
      const existing = root.getPropertyValue('--card-bg').trim();
      if (!existing) {
        document.documentElement.style.setProperty('--card-bg', gradientFromHex(cardColor));
        document.documentElement.style.setProperty('--card-border', darkenHex(cardColor, 22));
        document.documentElement.style.setProperty('--card-text', '#2F1B14');
      }
    } catch (e) { /* ignore in non-browser tests */ }
  }, []);

  // unlocked items (by id). persisted only in memory for now.
  const [unlockedItems, setUnlockedItems] = useState({});

  // Purchase modal state
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseItem, setPurchaseItem] = useState(null);

  // simple cost map (points) — adjust as desired
  const ITEM_COSTS = {
    'card-customization': 200,
    'background-customization': 200,
    'border-1': 200,
    'border-2': 250,
    'border-3': 250,
    'border-4': 350,
    'border-5': 350,
    'border-6': 350
  };

  // Display names for purchase UI (customize these)
  const ITEM_DISPLAY_NAMES = {
    'card-customization': 'Card Customization Pack',
    'background-customization': 'Background Customization Pack',
    'border-1': 'Candy Border',
    'border-2': 'Golden Filigree Border',
    'border-3': 'Mineral Flora Border',
    'border-4': 'The Wits Adventure Border',
    'border-5': 'Seaside Shores Border',
    'border-6': 'Aquamarine Border'
  };

  // helper to check locked state
  const isItemLocked = (itemId) => {
    return !unlockedItems[itemId];
  };

  // Open purchase prompt for locked item
  const openPurchasePrompt = (item) => {
    setPurchaseItem(item);
    setShowPurchaseModal(true);
  };

  const closePurchasePrompt = () => {
    setShowPurchaseModal(false);
    setPurchaseItem(null);
  };

  const confirmPurchase = async () => {
    if (!purchaseItem) return closePurchasePrompt();

    const cost = ITEM_COSTS[purchaseItem.id] || 0;
    if ((user?.spendablePoints ?? 0) < cost) {
      alert("You do not have enough points to purchase this item.");
      closePurchasePrompt();
      return;
    }

    try {
      // Persist unlock and deduct points in Firestore
      const updatedInventory = await unlockInventoryItem(purchaseItem.id, cost);
      setUnlockedItems(updatedInventory);
      setUser(prev => prev ? { ...prev, spendablePoints: (prev.spendablePoints - cost) } : prev);

      // auto-equip borders if desired
      if (purchaseItem.id.startsWith('border-')) {
        setSelectedBorderImage(purchaseItem.image);
      }
    } catch (err) {
      alert(err.message || "Failed to unlock item.");
    }

    closePurchasePrompt();
  };

  // Open picker when inventory item clicked
  const handleInventoryClick = (item) => {
    // If item locked -> open purchase modal
    if (isItemLocked(item.id)) {
      openPurchasePrompt(item);
      return;
    }

    if (item.id === 'background-customization') {
      prevBgColorRef.current = pageBgColor || null;
      setBgColor(pageBgColor || "#FFEEC8");
      setShowBgPicker(true);
    } else if (item.id === 'card-customization') {
      // save previous card vars so Cancel can revert
      const root = getComputedStyle(document.documentElement);
      const currentCard = root.getPropertyValue('--card-bg').trim();
      const currentBorder = root.getPropertyValue('--card-border').trim();
      prevCardColorRef.current = { card: currentCard || null, border: currentBorder || null };
      // try to extract a hex from the current var, fallback to default
      const defaultHex = "#FFEAC8";
      const hexMatch = currentCard.match(/#([0-9A-Fa-f]{6})/);
      setCardColor(hexMatch ? `#${hexMatch[1]}` : defaultHex);
      setShowCardPicker(true);
    } else if (item.id && item.id.startsWith('border-')) {
      const newBorder = (selectedBorderImage === item.image ? null : item.image);
      setSelectedBorderImage(newBorder);
      // Persist equipped border id in Firestore
      setCustomisation({ borderId: newBorder ? item.id : null });
    }
  };

  const closeBgPicker = () => setShowBgPicker(false);
  const closeCardPicker = () => setShowCardPicker(false);

  // User changed the background colour in the picker — apply immediately (live preview)
  const handleBgColorChange = (hex) => {
    setBgColor(hex);
    setPageBgColor(hex);
    try { document.body.style.background = hex; } catch (e) { /* ignore */ }
  };

  // Card colour live preview — set a gradient string into --card-bg so CSS picks it up reliably
  const handleCardColorChange = (hex) => {
    setCardColor(hex);
    try {
      document.documentElement.style.setProperty('--card-bg', gradientFromHex(hex));
      document.documentElement.style.setProperty('--card-border', darkenHex(hex, 22));
    } catch (e) { /* ignore */ }
  };

  // Apply / confirm
  const confirmBgColor = async () => {
    setShowBgPicker(false);
    await setCustomisation({ backgroundColor: bgColor });
  };
  const cancelBgPicker = () => {
    const prev = prevBgColorRef.current;
    setPageBgColor(prev);
    try { document.body.style.background = prev || ""; } catch (e) { /* ignore */ }
    setShowBgPicker(false);
  };

  const confirmCardColor = async () => {
    setShowCardPicker(false);
    await setCustomisation({ cardColor });
  };
  const cancelCardPicker = () => {
    const prev = prevCardColorRef.current;
    if (prev) {
      try {
        if (prev.card) document.documentElement.style.setProperty('--card-bg', prev.card);
        if (prev.border) document.documentElement.style.setProperty('--card-border', prev.border);
      } catch (e) { }
    }
    setShowCardPicker(false);
  };

  if (loading) {
    return (
      <main className="profile-container">
        <div className="loading-message"><img src={process.env.PUBLIC_URL + '/loading.gif'} alt="Loading..." style={{ width: 60, height: 60 }} /></div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="profile-container">
        <div className="error-message">
          Error: {error}. Please try again later.
        </div>
      </main>
    );
  }

  // Quest Manager handlers
  const handleQuestClick = (quest) => {
    setSelectedQuest(quest);
    setIsQuestManagerOpen(true);
  };

  const handleCloseQuestManager = () => {
    setIsQuestManagerOpen(false);
    setSelectedQuest(null);
  };

  const handleAcceptSubmission = (submissionId, questId) => {
    console.log(`Accepted submission ${submissionId} for quest ${questId}`);
    // Add your accept submission logic here
  };

  const handleRejectSubmission = (submissionId, questId) => {
    console.log(`Rejected submission ${submissionId} for quest ${questId}`);
    // Add your reject submission logic here
  };


  const profilePicture = user.profilePicture || "/profile.png";

  return (
    <main className="profile-container" style={pageBgColor ? { background: pageBgColor } : undefined}>
      <div className="profile-layout">
        {/* Left Panel - Profile Card */}
        <section className="profile-card">
          <div className="profile-pic-container">
            <img
              src={profilePicture}
              alt={`${user.username}'s avatar`}
              className="profile-pic"
            />
            {selectedBorderImage && (
              <img
                src={selectedBorderImage}
                alt="Selected profile border"
                className="profile-border-overlay"
                aria-hidden="true"
              />
            )}
          </div>

          <div className="profile-name-section">
            <h2 className="profile-username">
              {user.username}
              <button className="edit-button" onClick={handleEditClick}>
                <img src={editIcon} alt="Edit profile" className="edit-icon" />
              </button>
            </h2>
            <p className="profile-bio">{user.bio}</p>
          </div>

          <div className="profile-info-section">
            <h3 className="info-title">INFO</h3>
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-label">Spendable points:</span>
                <span className="stat-value">{user.spendablePoints}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Quests Completed:</span>
                <span className="stat-value">{user.questsCompleted}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Quests In Progress:</span>
                <span className="stat-value">{user.questsInProgress}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">LeaderBoard Points</span>
                <span className="stat-value">{user.points}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Panel - Content Sections */}
        <div className="profile-right-panel">
          {/* Customization Inventory */}
          <section className="content-section">
            <h3 className="section-title">Customization Inventory</h3>
            <div className="section-content">
              {/* Inventory: square, image-only blocks (no text) */}
              <div className="inventory-grid" role="list" aria-label="Customization inventory">
                {inventoryItems.map(item => {
                  const isSelected = item.id?.startsWith?.('border-') && selectedBorderImage === item.image;
                  const locked = isItemLocked(item.id);
                  return (
                    <div
                      key={item.id}
                      role="listitem"
                      aria-label={item.name}
                      aria-pressed={isSelected}
                      className={`inventory-item ${isSelected ? 'selected-border' : ''} ${locked ? 'locked' : ''}`}
                      title={item.name}
                      onClick={() => handleInventoryClick(item)}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleInventoryClick(item); }}
                      style={{
                        backgroundImage: `url(${item.image})`,
                      }}
                      data-item-id={item.id}
                    >
                      {locked && (
                        <div className="locked-overlay" aria-hidden="true">
                          <span className="locked-emoji">🔒</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Created Quests */}
          <section className="content-section">
            <h3 className="section-title">View And Manage Created Quests</h3>
            <div className="section-content">
              {createdQuests.length === 0 ? (
                <p className="placeholder-text">You haven't created any quests yet.</p>
              ) : (
                <div className="emoji-grid" role="list" aria-label="Your created quests">
                  {createdQuests.map((quest, idx) => (
                    <div
                      key={quest.id}
                      className="emoji-item"
                      role="listitem"
                      aria-label={`Quest: ${quest.name}`}
                      title={quest.name}
                      style={{
                        background: pastelizeHSL(quest.color || "#ffeac8"),
                        borderColor: "#90774c",
                        color: "#2F1B14",
                        cursor: "pointer"
                      }}
                      onClick={() => handleQuestClick(quest)}
                    >
                      <span className="emoji-char" aria-hidden="true" style={{ fontSize: "2em" }}>
                        {quest.emoji || "🗺️"}
                      </span>
                      <div className="quest-name" style={{ fontSize: "0.9em", marginTop: "0.3em", fontWeight: 600 }}>
                        {quest.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Background RGB Picker Modal */}
      {showBgPicker && (
        <div className="bg-picker-overlay" onClick={cancelBgPicker}>
          <div className="bg-picker-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="bg-picker-title">Background Color</h3>
            <div className="bg-picker-body">
              <div className="bg-picker-controls compact" role="group" aria-label="Background color controls">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => handleBgColorChange(e.target.value)}
                  aria-label="Background color picker"
                  className="bg-color-input compact"
                />
                <input
                  type="text"
                  value={String(bgColor).toUpperCase()}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    const hex = v.startsWith("#") ? v : `#${v}`;
                    if (/^#([0-9A-Fa-f]{6})$/.test(hex)) {
                      handleBgColorChange(hex);
                    } else {
                      setBgColor(v);
                    }
                  }}
                  aria-label="Hex color"
                  className="bg-hex-input compact"
                />
              </div>
            </div>
            <div className="bg-picker-actions centered">
              <button className="modal-button cancel-button" onClick={cancelBgPicker}>Cancel</button>
              <button className="modal-button save-button" onClick={confirmBgColor}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Card Color Picker Modal (new) */}
      {showCardPicker && (
        <div className="bg-picker-overlay" onClick={cancelCardPicker}>
          <div className="bg-picker-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="bg-picker-title">Card Color</h3>
            <div className="bg-picker-body">
              <div className="bg-picker-controls compact" role="group" aria-label="Card color controls">
                <input
                  type="color"
                  value={cardColor}
                  onChange={(e) => handleCardColorChange(e.target.value)}
                  aria-label="Card color picker"
                  className="bg-color-input compact"
                />
                <input
                  type="text"
                  value={String(cardColor).toUpperCase()}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    const hex = v.startsWith("#") ? v : `#${v}`;
                    if (/^#([0-9A-Fa-f]{6})$/.test(hex)) {
                      handleCardColorChange(hex);
                    } else {
                      setCardColor(v);
                    }
                  }}
                  aria-label="Hex color"
                  className="bg-hex-input compact"
                />
              </div>
            </div>
            <div className="bg-picker-actions centered">
              <button className="modal-button cancel-button" onClick={cancelCardPicker}>Cancel</button>
              <button className="modal-button save-button" onClick={confirmCardColor}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content">
              <h2 className="modal-title">Edit Profile</h2>

              <div className="input-group">
                <label className="input-label">Username:</label>
                <input
                  type="text"
                  value={editedUsername}
                  onChange={(e) => setEditedUsername(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === ' ') {
                      e.stopPropagation(); // prevent global handlers from blocking space
                    }
                  }}
                  className="modal-input"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Bio:</label>
                <textarea
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === ' ') {
                      e.stopPropagation();
                    }
                  }}
                  className="modal-textarea"
                  rows="4"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Profile Picture:</label>

                {/* Image drop / select area (replaces plain file input) */}
                <div
                  className={`image-drop-area ${isDragging ? "drag_over" : ""}`}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleFileDrop}
                  role="button"
                  tabIndex={0}
                  aria-label="Select or drop profile image"
                >
                  {editedProfilePic ? (
                    <img
                      src={editedProfilePic}
                      alt="Profile preview"
                      className="image-preview"
                    />
                  ) : (
                    <div className="drop-placeholder">
                      Click or drop an image here to upload
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicChange}
                    style={{ display: "none" }}
                  />
                </div>
              </div>

              <div className="modal-buttons">
                <button onClick={handleSave} className="modal-button save-button">
                  Save
                </button>
                <button onClick={handleCancel} className="modal-button cancel-button">
                  Cancel
                </button>
                <button onClick={handleRemoveImage} className="modal-button remove-button">
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quest Manager Modal */}
      <QuestManager
        quest={selectedQuest}
        isOpen={isQuestManagerOpen}
        onClose={handleCloseQuestManager}
        onAccept={handleAcceptSubmission}
        onCloseQuest={handleCloseQuest}
      />

      {/* Purchase confirmation modal */}
      {showPurchaseModal && purchaseItem && (
        <div className="bg-picker-overlay" onClick={closePurchasePrompt}>
          <div className="bg-picker-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="bg-picker-title">{ITEM_DISPLAY_NAMES[purchaseItem.id] || purchaseItem.name}</h3>
            <div className="bg-picker-body" style={{ justifyContent: "center", padding: "8px 12px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ marginBottom: 12 }}>
                  <img src={purchaseItem.image} alt={purchaseItem.name} style={{ width: 84, height: 84, objectFit: "contain", borderRadius: 8, border: "3px solid #90774c", background: "#fff" }} />
                </div>
                <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, color: "#2F1B14", marginBottom: 8 }}>
                  Purchase this item for {ITEM_COSTS[purchaseItem.id] || 0} points?
                </div>
              </div>
            </div>
            <div className="bg-picker-actions centered" style={{ paddingTop: 6 }}>
              <button className="modal-button cancel-button" onClick={closePurchasePrompt}>No</button>
              <button className="modal-button save-button" onClick={confirmPurchase}>Yes</button>
            </div>
          </div>
        </div>
      )}

      {/* Back to Home button - fixed bottom-left */}
      <button
        type="button"
        className="back-home-btn"
        onClick={handleBackHome}
        aria-label="Back to home"
      >
        <img src="/return.svg" alt="Back" />
      </button>
    </main>
  );
}