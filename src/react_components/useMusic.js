import { useState, useRef, useEffect } from 'react';
import musicFile from '../media/Music.mp3';

const useMusic = (showToast) => {
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef(null);

  const toggleMusic = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(musicFile);
      audioRef.current.loop = true;
    }

    if (isMusicPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsMusicPlaying(false);
     
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsMusicPlaying(true);
         
        })
        .catch(error => {
          console.error('Error playing music:', error);
          showToast('Failed to play music');
        });
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return { isMusicPlaying, toggleMusic };
};

export default useMusic;