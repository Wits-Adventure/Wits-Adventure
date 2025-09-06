import React, { useState, useRef, useEffect } from 'react';
import '../css/CreateQuestForm.css'; // reuse styling
import { useAuth } from '../context/AuthContext';
import { getUserData } from '../firebase/firebase';
import { submitQuestAttempt, fetchQuestSubmissions, removeSubmissionByUserId } from '../firebase/general_quest_functions';

// uses same css file as create quest form

export default function CompleteQuestForm({ isOpen, onClose, quest, showToast }) {
  const { currentUser } = useAuth();
  const [username, setUsername] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [hasSubmission, setHasSubmission] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previousImageUrl, setPreviousImageUrl] = useState(null);
  const [imageChanged, setImageChanged] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Reset image states when opening for a new quest
    setProofImage(null);
    setImagePreview(null);
    setImageChanged(false); // <-- reset flag
  }, [isOpen, quest]);

  useEffect(() => {
    const fetchUsernameAndSubmission = async () => {
      if (currentUser && quest) {
        try {
          const userData = await getUserData();
          setUsername(userData?.Name || 'User');
          const submissions = await fetchQuestSubmissions(quest.id);
          const userSubmission = submissions.find(sub => sub.userId === currentUser.uid);
          setHasSubmission(!!userSubmission);

          // Show previous image if exists and no new image uploaded
          if (userSubmission && !imagePreview) {
            setImagePreview(userSubmission.imageUrl);
            setProofImage(userSubmission.imageUrl);
            setPreviousImageUrl(userSubmission.imageUrl); // <-- track previous image
          } else {
            setPreviousImageUrl(null);
          }

        } catch (error) {
          console.error("Failed to fetch username or submissions:", error);
        }
      }
    };
    fetchUsernameAndSubmission();
  }, [currentUser, quest, imagePreview]);

  if (!isOpen || !quest) return null;

  const handleImageUpload = (file) => {
    if (file && file.type.startsWith('image/')) {
      setProofImage(file);
      setImageChanged(true); // <-- set flag
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      showToast && showToast('Please upload a valid image.', 4000, 'proof');
    }
  };

  const handleFileInputChange = (e) => {
    handleImageUpload(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    if (!currentUser) {
      showToast && showToast("You must be logged in to submit proof.", 4000, 'proof');
      setSubmitting(false);
      return;
    }

    // If updating and image hasn't changed, do nothing
    if (hasSubmission && !imageChanged) {
      showToast && showToast('You have not changed your proof image.', 4000, 'proof');
      setSubmitting(false);
      return;
    }

    // If user is replacing and leaves image blank, delete their submission
    if (!proofImage && hasSubmission) {
      try {
        await removeSubmissionByUserId(quest.id, currentUser.uid);
        showToast && showToast('Your previous submission has been deleted.', 4000, 'proof');
        onClose();
      } catch (error) {
        showToast && showToast('Failed to delete your previous submission.', 4000, 'proof');
        console.error(error);
      }
      setSubmitting(false);
      return;
    }

    if (!proofImage) {
      showToast && showToast('Please upload a proof image before submitting.', 4000, 'proof');
      setSubmitting(false);
      return;
    }

    try {
      await submitQuestAttempt(
        quest.id,
        currentUser.uid,
        proofImage,
        username
      );
      showToast && showToast('Your image is under review.', 4000, 'proof');
      onClose();
    } catch (error) {
      showToast && showToast('Failed to submit your proof. Please try again.', 4000, 'proof');
      console.error(error);
    }
    setSubmitting(false);
  };

  return (
    <div className="create-quest-portal open">
      <div className="create-quest-form">
        <h2>Submit Proof for {quest.name}</h2>
        <p>Placed by {quest.creatorName}</p>

        <form onSubmit={handleSubmit}>
          <div className="cq-image-section">
            <div
              className={`cq-image-dropzone ${imagePreview ? 'has-preview' : ''}`}
              onClick={() => fileInputRef.current.click()}
            >
              {imagePreview ? (
                <div className="cq-image-preview">
                  <img src={imagePreview} alt="Proof Preview" />
                  <button
                    type="button"
                    className="cq-image-clear-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProofImage(null);
                      setImagePreview(null);
                      setImageChanged(true); // <-- set flag
                    }}
                    title="Remove image"
                  >
                    &#10005;
                  </button>
                </div>
              ) : (
                <div className="cq-image-placeholder">
                  <p>Click or drag an image to upload</p>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />
          </div>

          <div className="cq-actions">
            <button type="button" onClick={onClose} className="cq-btn cq-cancel" disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className={`cq-btn${submitting ? ' disabled' : ''}`}
              disabled={submitting}
            >
              {hasSubmission ? "Update Submission" : "Submit Quest"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
