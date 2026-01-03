"use client";

import { useRef, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { videoReportAPI } from "@/lib/api";
import ReactPlayer from "react-player";
import { Download, SkipBack, SkipForward } from "lucide-react";

interface VideoData {
  id: number;
  name: string;
  status: string;
  videoUrl?: string;
  personalizedMessage?: string;
  message?: string;
  error?: string;
}

export default function VideoViewPage() {
  const params = useParams();
  const token = params.token as string;

  const playerRef = useRef<any>(null);
  
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVideo = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await videoReportAPI.getVideoByToken(token);
      
      if (data.error) {
        setError(data.error);
        setVideoData(null);
      } else {
        setVideoData(data);
      }
    } catch (err) {
      console.error("Error loading video:", err);
      setError("Gagal memuat video. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadVideo();
    }
  }, [token]);

  // Auto refresh if still processing
  useEffect(() => {
    if (videoData?.status === "PROCESSING") {
      const interval = setInterval(loadVideo, 5000);
      return () => clearInterval(interval);
    }
  }, [videoData?.status]);

  // Loading state - full screen spinner
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Memuat video...</p>
        </div>
      </div>
    );
  }

  // Error state - full screen error
  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
        <div className="text-center text-white max-w-md">
          <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-xl font-semibold mb-2">Video Tidak Tersedia</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={loadVideo}
            className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // Video ready - full screen video
  if (videoData?.videoUrl) {
    const seekBySeconds = (deltaSeconds: number) => {
      const player = playerRef.current;
      if (!player?.getCurrentTime || !player?.seekTo) {
        return;
      }
      const current = Number(player.getCurrentTime() ?? 0);
      const next = Math.max(0, current + deltaSeconds);
      player.seekTo(next, "seconds");
    };

    return (
      <div className="fixed inset-0 bg-black">
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => seekBySeconds(-10)}
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm text-white backdrop-blur hover:bg-white/20"
            aria-label="Back 10 seconds"
          >
            <SkipBack className="h-4 w-4" />
            Back
          </button>
          <button
            type="button"
            onClick={() => seekBySeconds(10)}
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm text-white backdrop-blur hover:bg-white/20"
            aria-label="Next 10 seconds"
          >
            <SkipForward className="h-4 w-4" />
            Next
          </button>
          <a
            href={videoData.videoUrl}
            target="_blank"
            rel="noreferrer"
            download
            className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-black hover:bg-gray-200"
            aria-label="Download video"
          >
            <Download className="h-4 w-4" />
            Download
          </a>
        </div>

        <div className="w-full h-full">
          <ReactPlayer
            ref={playerRef}
            url={videoData.videoUrl}
            playing
            controls
            width="100%"
            height="100%"
            playsinline
            config={{
              file: {
                attributes: {
                  className: "w-full h-full object-contain",
                },
              },
            }}
          />
        </div>
      </div>
    );
  }

  // Processing state - full screen processing message
  if (videoData?.status === "PROCESSING") {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
        <div className="text-center text-white max-w-md">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
          <h1 className="text-xl font-semibold mb-2">Video Sedang Diproses</h1>
          <p className="text-gray-400">
            Video untuk <span className="font-medium text-white">{videoData.name}</span> sedang dalam proses pembuatan.
          </p>
          <p className="text-gray-500 text-sm mt-4">Halaman akan otomatis diperbarui...</p>
        </div>
      </div>
    );
  }

  // Failed state
  if (videoData?.status === "FAILED") {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
        <div className="text-center text-white max-w-md">
          <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <h1 className="text-xl font-semibold mb-2 text-red-500">Video Gagal Dibuat</h1>
          <p className="text-gray-400">Maaf, terjadi kesalahan saat membuat video.</p>
        </div>
      </div>
    );
  }

  // Pending/other state
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
      <div className="text-center text-white max-w-md">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-xl font-semibold mb-2">Video Belum Tersedia</h1>
        <p className="text-gray-400">{videoData?.message || "Video akan segera tersedia. Silakan coba lagi nanti."}</p>
        <button 
          onClick={loadVideo}
          className="mt-6 px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
