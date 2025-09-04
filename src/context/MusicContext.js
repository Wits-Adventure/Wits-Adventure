import React, { createContext, useContext, useState, useEffect, useRef } from "react";

const MusicContext = createContext();

export function useMusic() {
    return useContext(MusicContext);
}

export function MusicProvider({ children }) {
    const [isMusicPlaying, setIsMusicPlaying] = useState(
        () => localStorage.getItem("musicPlaying") === "true"
    );
    const audioRef = useRef(null);

    useEffect(() => {
        localStorage.setItem("musicPlaying", isMusicPlaying);
        if (!audioRef.current) {
            audioRef.current = new Audio(require("../media/Music.mp3")); // replace with your music file
            audioRef.current.loop = true;
        }
        if (isMusicPlaying) {
            audioRef.current.play();
        } else {
            audioRef.current.pause();
        }
    }, [isMusicPlaying]);

    const toggleMusic = () => setIsMusicPlaying((prev) => !prev);

    return (
        <MusicContext.Provider value={{ isMusicPlaying, toggleMusic }}>
            {children}
        </MusicContext.Provider>
    );
}