"use client";

import { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

import type Player from "video.js/dist/types/player";

export type VideoJsPlayerInstance = Player;

type Source = {
  src: string;
  type?: string;
};

type Props = {
  sources: Source[];
  poster?: string;
  onReady?: (player: VideoJsPlayerInstance) => void;
};

export default function VideoJsPlayer({ sources, poster, onReady }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<VideoJsPlayerInstance | null>(null);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    if (!playerRef.current) {
      const player = (playerRef.current = videojs(
        videoRef.current,
        {
          controls: true,
          autoplay: true,
          preload: "auto",
          responsive: true,
          fill: true,
          playsinline: true,
          poster,
          sources,
        },
        () => {
          onReady?.(player);
        }
      ));
      return;
    }

    const player = playerRef.current;
    try {
      player.src(sources);
      if (poster) {
        player.poster(poster);
      }
    } catch (e) {
      // ignore
    }
  }, [onReady, poster, sources]);

  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div data-vjs-player className="w-full h-full">
      <video ref={videoRef} className="video-js vjs-big-play-centered w-full h-full" />
    </div>
  );
}
