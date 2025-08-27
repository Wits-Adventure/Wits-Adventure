import React, { useState, useEffect } from "react";
import "../css/QuestManager.css";
import quest1 from '../media/quest-submission-1.jpg';
import quest2 from '../media/quest-submission-2.jpg';
import quest3 from '../media/quest-submission-3.jpg';
import { closeQuestAndRemoveFromUsers } from "../firebase/general_quest_functions";

export default function QuestManager({ quest, isOpen, onClose, onAccept, onReject, onCloseQuest }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoadStates, setImageLoadStates] = useState({});
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsConfirmingClose(false);
    }
  }, [isOpen]);

  // Mock submission data - replace with actual data from your backend
  const mockSubmissions = [
    {
      id: 1,
      userId: "user123",
      userName: "Adventure Seeker",
      imageUrl: quest1,
      timestamp: "2025-01-15T10:30:00Z",
      description: "Completed the dragon quest!"
    },
    {
      id: 2,
      userId: "user456",
      userName: "Quest Master",
      imageUrl: quest2,
      timestamp: "2025-01-14T15:45:00Z",
      description: "Found the ancient artifact"
    },
    {
      id: 3,
      userId: "user789",
      userName: "Brave Explorer",
      imageUrl: quest3,
      timestamp: "2025-01-13T09:15:00Z",
      description: "Defeated the boss monster"
    }
  ];

  const [submissions, setSubmissions] = useState(mockSubmissions);

  // Clamp the index when the list shrinks/changes
  useEffect(() => {
    const len = submissions.length;
    if (len === 0 && currentImageIndex !== 0) {
      setCurrentImageIndex(0);
    } else if (len > 0 && currentImageIndex >= len) {
      setCurrentImageIndex(len - 1);
    }
  }, [submissions.length, currentImageIndex]);

  if (!isOpen || !quest) return null;

  // Derive safe index and current submission
  const listLength = submissions.length;
  const hasSubmissions = listLength > 0;
  const safeIndex = hasSubmissions ? Math.min(currentImageIndex, listLength - 1) : 0;
  const currentSubmission = hasSubmissions ? submissions[safeIndex] : undefined;

  const handlePrevious = () => {
    if (!hasSubmissions) return;
    setCurrentImageIndex(prev =>
      prev === 0 ? listLength - 1 : prev - 1
    );
  };

  const handleNext = () => {
    if (!hasSubmissions) return;
    setCurrentImageIndex(prev =>
      (prev + 1) % listLength
    );
  };

  const handleAccept = () => {
    if (!currentSubmission) return;
    if (onAccept) onAccept(currentSubmission.id, quest.id);
    removeSubmissionAt(safeIndex);
  };

  const handleReject = () => {
    if (!currentSubmission) return;
    if (onReject) onReject(currentSubmission.id, quest.id);
    removeSubmissionAt(safeIndex);
  };

  // Confirm and close quest (remove from menu)
  const openConfirmClose = () => setIsConfirmingClose(true);
  const cancelCloseQuest = () => setIsConfirmingClose(false);
  const confirmCloseQuest = async () => {
    if (typeof onCloseQuest === 'function') onCloseQuest(quest.id);
    await closeQuestAndRemoveFromUsers(quest.id); // <-- call the new function
    if (typeof onClose === 'function') onClose();
    setIsConfirmingClose(false);
  };

  // Remove current item, clean load state
  const removeSubmissionAt = (indexToRemove) => {
    setSubmissions(prev => {
      if (!prev.length) return prev;
      const removed = prev[indexToRemove];
      const next = prev.filter((_, i) => i !== indexToRemove);

      setImageLoadStates(states => {
        const { [removed?.id]: _omit, ...rest } = states;
        return rest;
      });

      return next; // index clamped by effect above
    });
  };

  const handleImageLoad = (submissionId) => {
    setImageLoadStates(prev => ({
      ...prev,
      [submissionId]: 'loaded'
    }));
  };

  const handleImageError = (e, submissionId) => {
    setImageLoadStates(prev => ({
      ...prev,
      [submissionId]: 'error'
    }));
    e.target.src = '/placeholder-quest-image.jpg';
  };

  return (
    <div className="quest-manager-overlay" onClick={onClose}>
      <div className="quest-manager-modal" onClick={(e) => e.stopPropagation()}>

        {/* Top Section - Image Display */}
        <div className="quest-manager-top-section">
          <div className="submission-image-container">
            {hasSubmissions ? (
              <>
                {imageLoadStates[currentSubmission?.id] === 'error' ? (
                  <div className="image-placeholder">
                    <span className="placeholder-icon">📷</span>
                    <p>Image not available</p>
                  </div>
                ) : (
                  <img
                    src={currentSubmission.imageUrl}
                    alt={`Submission by ${currentSubmission?.userName ?? 'Unknown'}`}
                    className="submission-image"
                    onLoad={() => handleImageLoad(currentSubmission.id)}
                    onError={(e) => handleImageError(e, currentSubmission.id)}
                    style={{
                      opacity: imageLoadStates[currentSubmission?.id] === 'loaded' ? 1 : 0.8
                    }}
                  />
                )}

                {/* Image Navigation */}
                {listLength > 1 && (
                  <>
                    <button
                      className="nav-button nav-button-prev"
                      onClick={handlePrevious}
                      aria-label="Previous submission"
                    >
                      ‹
                    </button>
                    <button
                      className="nav-button nav-button-next"
                      onClick={handleNext}
                      aria-label="Next submission"
                    >
                      ›
                    </button>
                  </>
                )}

                {/* Image Counter */}
                <div className="image-counter">
                  {safeIndex + 1} / {listLength}
                </div>
              </>
            ) : (
              <div className="no-submissions">
                <span className="no-submissions-icon">📷</span>
                <p>No submissions yet</p>
              </div>
            )}
          </div>

          {/* Accept/Reject Buttons */}
          <div className="action-buttons-container">
            <button
              className="action-button accept-button"
              onClick={handleAccept}
              disabled={!hasSubmissions}
              aria-label="Accept submission"
            >
              <span className="action-icon">✓</span>
            </button>
            <button
              className="action-button reject-button"
              onClick={handleReject}
              disabled={!hasSubmissions}
              aria-label="Reject submission"
            >
              <span className="action-icon">✗</span>
            </button>
          </div>
        </div>

        {/* Bottom Section - Submission Details */}
        <div className="quest-manager-bottom-section">
          {hasSubmissions ? (
            <div className="submission-details">
              <div className="submission-header">
                <h4 className="submission-user">
                  Submitted by: {currentSubmission.userName}
                </h4>
                <span className="submission-timestamp">
                  {new Date(currentSubmission.timestamp).toLocaleDateString()}
                </span>
              </div>
              {currentSubmission.description && (
                <p className="submission-description">
                  {currentSubmission.description}
                </p>
              )}
            </div>
          ) : (
            <div className="no-submissions-details">
              <h4 className="quest-name">{quest.name}</h4>
              <p className="waiting-message">
                Waiting for adventurers to complete this quest...
              </p>
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="quest-manager-controls">
          <button
            className="control-button map-button"
            onClick={() => {
              // Add view on map functionality here
              console.log("View on map clicked for quest:", quest.id);
            }}
          >
            View On Map
          </button>
          <button
            className="control-button close-button"
            onClick={openConfirmClose}
          >
            CLOSE QUEST
          </button>
        </div>

        {isConfirmingClose && (
          <div className="confirm-dialog-backdrop" role="dialog" aria-modal="true" onClick={cancelCloseQuest}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <h3 className="confirm-title">Close Quest?</h3>
              <p className="confirm-message">
                Are you sure you want to close “{quest?.name ?? 'this quest'}”? This will remove it from the map and your menu.
              </p>
              <div className="confirm-actions">
                <button className="control-button confirm-cancel-button" onClick={cancelCloseQuest}>
                  No, keep quest
                </button>
                <button className="control-button confirm-confirm-button" onClick={confirmCloseQuest}>
                  Yes, close quest
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}