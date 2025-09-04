import React, { useState, useRef, useEffect } from 'react';
import '../css/CreateQuestForm.css'; // reuse styling
import { useAuth } from '../context/AuthContext';
import { getUserData } from '../firebase/firebase';
import { submitQuestAttempt, fetchQuestSubmissions, removeSubmissionByUserId } from '../firebase/general_quest_functions';

export default function CompleteQuestForm({ isOpen, onClose, quest }) {
  const { currentUser } = useAuth();
  const [username, setUsername] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [hasSubmission, setHasSubmission] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUsernameAndSubmission = async () => {
      if (currentUser && quest) {
        try {
          const userData = await getUserData();
          setUsername(userData?.Name || 'User');
          const submissions = await fetchQuestSubmissions(quest.id);
          setHasSubmission(submissions.some(sub => sub.userId === currentUser.uid));
        } catch (error) {
          console.error("Failed to fetch username or submissions:", error);
        }
      }
    };
    fetchUsernameAndSubmission();
  }, [currentUser, quest]);

  if (!isOpen || !quest) return null;

  const handleImageUpload = (file) => {
    if (file && file.type.startsWith('image/')) {
      setProofImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      alert('Please upload a valid image.');
    }
  };

  const handleFileInputChange = (e) => {
    handleImageUpload(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert("You must be logged in to submit proof.");
      return;
    }

    // If user is replacing and leaves image blank, delete their submission
    if (!proofImage && hasSubmission) {
      try {
        await removeSubmissionByUserId(quest.id, currentUser.uid);
        alert('Your previous submission has been deleted.');
        onClose();
      } catch (error) {
        alert('Failed to delete your previous submission.');
        console.error(error);
      }
      return;
    }

    // If no image and no previous submission, do nothing
    if (!proofImage) {
      alert('Please upload a proof image before submitting.');
      return;
    }

    try {
      await submitQuestAttempt(quest.id, currentUser.uid, proofImage, username);
      alert(
        'Your image is under review. Feedback will be provided shortly on whether you have successfully completed the quest.'
      );
      onClose();
    } catch (error) {
      alert('Failed to submit your proof. Please try again.');
      console.error(error);
    }
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
            <button type="button" onClick={onClose} className="cq-btn cq-cancel">
              Cancel
            </button>
            <button type="submit" className="cq-btn">
              Submit Proof
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
