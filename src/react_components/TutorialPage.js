import React, { useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import "../css//TutorialPage.css";
import LoactionQuest from "../media/LoactionQuest.jpg";
import bg from "../media/bg.jpg";
import CreateQuest from "../media/CreateQuest.png";
import crowned from "../media/crowned.png";
import journey from "../media/jourrney_0.png";
import bell from "../media/belltut.png";

export default function TutorialPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // The Ethereal scripts are loaded globally via public/index.html
  }, []);

  const handleBackHome = () => {
    if (navigate) navigate("/");
    else window.location.href = '/';
  };

  return (
    <div id="page-wrapper" className="is-preload">
      <style dangerouslySetInnerHTML={{
        __html: `
          body {
            overflow-y: auto;
          }
          body:after {
            background-image: url(${bg}), url('/assets/ethereal/images/overlay.png');
            background-repeat: no-repeat, repeat-x;
            background-size: cover, 128px 128px;
            background-attachment: fixed;
            background-color: #e1e6e1;
          }
        `
      }} />
      <div id="wrapper">
        <div className="banner-slider">
          <section className="panel banner right">
            <div className="content color3 span-3-75">
              <h1 className="major" >Location Quests</h1>
              <p>
                Location Quests will take you an adventure to find hidden locations inscribed by your friends and rivals!
              </p>
              <p>
               Take pictures of locations around campus and place them on the map to be discovered by others. Submit and receive
               submissions - you will receive points upon completing quests, based on it's radius, and the questmaker will receive points in turn
              </p>
            </div>
            <div className="image filtered span-3-75" data-position="75% 75%">
              <img src={LoactionQuest} alt="Location Quest" />
            </div>
          </section>

          <section className="panel banner createq">

            <div className="image filtered span-5-75" data-position="75% 75%">
              <img src={CreateQuest} alt="Create Quest" />
            </div>
          </section>

          <section className="panel banner management">
            <div className="content crowned span-2-75">
              <p>
                Upload submissions to quests by selecting them on the map or through your questbook. 
              </p>
              <p>
               On your profile you'll find your created quests, select one to review submissions. 
               Upon your confirmation, the quest is closed - the winner receives their reward, and you get some compensation too!
              </p>
            </div>
          </section>

          <section className="panel banner journey">
            <div className="content span-3-75">
              <h1 className="major">Journey Quests</h1>
              <p>
                Journey Quests are special events where adventurers must solve a series of riddles - combining their wits to find the next piece of the puzzle to win unique rewards. 
              </p>
            </div>
            <div className="image filtered span-5-75" data-position="25% 25%">
              <img src={crowned} alt="Journey Quest" />
            </div>
          </section>

             <section className="panel banner createq">
            <div className="image filtered span-2-75" data-position="40% 75%">
              <img src={journey} alt="journey" />
            </div>
          </section>

           <section className="panel banner final">
            <div className="content color3 span-3-75">
              <p>
               Journey quests are uniquely denoted by their header - "Journey"
              </p>
              <p>
               Journey Quests can be completed by multiple adventurers, making them ideal for teamwork and group exploration!
              </p>
              <p>
                Upon reaching the next location hinted in the riddle, ring the bell to test your guess. If you were right, the next part of the riddle will be revealed to you
              </p>
              <p>
                (NOTE || Desired journey quest must be equipped in questbook)
              </p>
            </div>
          </section>

          <section className="panel banner createq">
            <div className="image filtered span-2-75" data-position="40% 75%">
              <img src={bell} alt="bell" />
            </div>
          </section>
        </div>
      </div>
      <button
        type="button"
        className="back-home-btn"
        onClick={handleBackHome}
        aria-label="Back to home"
      >
        <img src="/return.svg" alt="Back" />
      </button>
    </div>
  );
}

