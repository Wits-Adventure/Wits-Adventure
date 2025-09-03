import React from "react";
import "../css/TutorialPage.css";
  return (
    <div className="tutorial-page">
      {/* Left Section */}
      <div className="tutorial-section">
        <h1>Quest Type A</h1>
        <img
          src="https://via.placeholder.com/400x200"
          alt="Quest illustration A"
          className="tutorial-image"
        />
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
          dignissim, nunc eget ullamcorper fermentum, justo risus pretium elit,
          eget tempus nisl odio a sapien. 
        </p>
        <p>
          Add your quest details here. This scrollable area allows you to
          showcase the full tutorial with multiple paragraphs and illustrations.
        </p>
      </div>

      {/* Right Section */}
      <div className="tutorial-section">
        <h1>Quest Type B</h1>
        <img
          src="https://via.placeholder.com/400x200"
          alt="Quest illustration B"
          className="tutorial-image"
        />
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sit amet
          viverra justo. Suspendisse potenti. 
        </p>
        <p>
          You can scroll this section independently of the left one, making it
          easy to compare quests side by side in your fantasy tutorial.
        </p>
      </div>
    </div>
  );

