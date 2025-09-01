import React, { useState, useRef, useEffect } from 'react';
import '../css/CreateQuestForm.css'; // reuse styling
import { useAuth } from '../context/AuthContext';
import { getUserData } from '../firebase/firebase';

export default function CompleteQuestForm({ isOpen, onClose, quest }) {
  const { currentUser } = useAuth();
  const [username, setUsername] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUsername = async () => {
      if (currentUser) {
        try {
          const userData = await getUserData();
          setUsername(userData?.Name || 'User');
        } catch (error) {
          console.error("Failed to fetch username:", error);
        }
      }
    };
    fetchUsername();
  }, [currentUser]);

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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert("You must be logged in to submit proof.");
      return;
    }

    if (!proofImage) {
      alert('Please upload a proof image before submitting.');
      return;
    }

    // Instead of submitting to Firebase, just show an alert
    alert(
      'Your image is under review. Feedback will be provided shortly on whether you have successfully completed the quest.'
    );
    onClose();
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


/*import React, { useState, useRef, useEffect } from 'react';
import '../css/CreateQuestForm.css'; // reuse styling
import { useAuth } from '../context/AuthContext';
import { getUserData } from '../firebase/firebase';
// import { submitQuestProof } from '../firebase/general_quest_functions'; // COMMENTED OUT

export default function CompleteQuestForm({ isOpen, onClose, quest }) {
  const { currentUser } = useAuth();
  const [username, setUsername] = useState('');
  // const [proofImage, setProofImage] = useState(null); // COMMENTED OUT
  // const [imagePreview, setImagePreview] = useState(null); // COMMENTED OUT
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUsername = async () => {
      if (currentUser) {
        try {
          const userData = await getUserData();
          setUsername(userData?.Name || 'User');
          console.log("Fetched username:", userData?.Name);
        } catch (error) {
          console.error("Failed to fetch username:", error);
        }
      }
    };
    fetchUsername();
  }, [currentUser]);

  if (!isOpen || !quest) return null;

  
  
  const handleImageUpload = (file) => {
    console.log("Selected file:", file);
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
  

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert("You must be logged in to submit proof.");
      return;
    }

    
    if (!proofImage) {
      alert('Please upload a proof image before submitting.');
      return;
    }

    try {
      const submissionId = await submitQuestProof(quest.id, currentUser.uid, proofImage);
      console.log("Submission successful, ID:", submissionId);
      alert('Quest proof submitted!');
      onClose();
    } catch (error) {
      console.error("Failed to submit quest proof:", error);
      alert("Failed to submit proof. Check console for errors.");
    }
    

    // NEW: simple alert instead of actual image submission
    alert(
      `Your image for "${quest.name}" is under review. Feedback will be provided shortly regarding whether you have successfully completed the quest.`
    );
    onClose();
  };

  return (
    <div className="create-quest-portal open">
      <div className="create-quest-form">
        <h2>Submit Proof for {quest.name}</h2>
        <p>Placed by {quest.creatorName}</p>

        <form onSubmit={handleSubmit}>
          <div className="cq-image-section">
            <div
              className={`cq-image-dropzone`}
              onClick={() => fileInputRef.current.click()}
            >
              <div className="cq-image-placeholder">
                <p>Click or drag an image to upload</p>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              // onChange={handleFileInputChange} // COMMENTED OUT
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
}*/
