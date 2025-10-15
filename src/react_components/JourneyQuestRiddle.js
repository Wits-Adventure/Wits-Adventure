import React, { useState, useEffect } from 'react';
import '../css/JourneyQuestRiddle.css';

const JourneyQuestRiddle = ({ journeyProgress, journeyQuests }) => {
    const [isMinimized, setIsMinimized] = useState(false);
    const [showShimmer, setShowShimmer] = useState(false);

    // Move useEffect before early returns to follow hooks rules
    const currentJourneyQuest = journeyQuests.find(
        jq => jq.id === journeyProgress.currentJourneyQuest
    );

    const currentStop = journeyProgress.currentJourneyStop;
    const riddle = currentJourneyQuest?.stops?.[currentStop]?.riddle || 'Continue your journey...';

    // Effect to automatically expand and trigger shimmer when quest is accepted or riddle changes
    useEffect(() => {
        if (journeyProgress.currentJourneyQuest && currentStop !== undefined) {
            // Automatically expand the riddle when:
            // 1. A new journey quest is accepted
            // 2. The riddle changes (new stop reached)
            setIsMinimized(false);

            // Trigger shimmer effect
            setShowShimmer(true);

            // Remove shimmer after 0.5s to match button hover duration
            const timer = setTimeout(() => {
                setShowShimmer(false);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [journeyProgress.currentJourneyQuest, currentStop, riddle]);

    // Early returns AFTER all hooks
    if (!journeyProgress.currentJourneyQuest) return null;
    if (!currentJourneyQuest) return null;

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    if (isMinimized) {
        return (
            <button
                className="journey-quest-riddle-minimized"
                onClick={toggleMinimize}
                aria-label="Expand journey quest riddle"
            >
                <span className="minimized-emoji">{currentJourneyQuest.emoji}</span>
            </button>
        );
    }

    return (
        <div className={`journey-quest-riddle ${showShimmer ? 'shimmer' : ''}`}>
            <button
                className="riddle-minimize-btn"
                onClick={toggleMinimize}
                aria-label="Minimize journey quest riddle"
            >
                −
            </button>
            <div className="riddle-header">
                <span className="quest-emoji">{currentJourneyQuest.emoji}</span>
                <span className="quest-name">{currentJourneyQuest.name}</span>
            </div>
            <div className="riddle-text">{riddle}</div>
            <div className="riddle-progress">
                Stop {currentStop + 1} of 3
            </div>
        </div>
    );
};

export default JourneyQuestRiddle;