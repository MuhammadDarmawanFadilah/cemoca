"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Download,
  Maximize2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MediaPost } from "@/types/komunikasi";

interface MediaCarouselProps {
  media: MediaPost[];
}

export default function MediaCarousel({ media }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [showFullscreenControls, setShowFullscreenControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [fullscreenControlsTimeout, setFullscreenControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  // Reset video state when changing media
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [currentIndex]);
  // Auto-hide controls after 3 seconds
  const handleMouseEnter = () => {
    setShowControls(true);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 2000);
    setControlsTimeout(timeout);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    setControlsTimeout(timeout);
  };

  // Fullscreen controls auto-hide
  const handleFullscreenMouseEnter = () => {
    setShowFullscreenControls(true);
    if (fullscreenControlsTimeout) {
      clearTimeout(fullscreenControlsTimeout);
    }
  };

  const handleFullscreenMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowFullscreenControls(false);
    }, 2000);
    setFullscreenControlsTimeout(timeout);
  };

  const handleFullscreenMouseMove = () => {
    setShowFullscreenControls(true);
    if (fullscreenControlsTimeout) {
      clearTimeout(fullscreenControlsTimeout);
    }
    const timeout = setTimeout(() => {
      setShowFullscreenControls(false);
    }, 2000);
    setFullscreenControlsTimeout(timeout);
  };

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
      if (fullscreenControlsTimeout) {
        clearTimeout(fullscreenControlsTimeout);
      }
    };
  }, [controlsTimeout, fullscreenControlsTimeout]);

  if (!media || media.length === 0) {
    return null;
  }
  
  const currentMedia = media[currentIndex];
  const hasMultiple = media.length > 1;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };  const handleVideoClick = () => {
    // Only handle video controls for the active video
    if (showFullscreen && fullscreenVideoRef.current) {
      if (fullscreenVideoRef.current.paused) {
        fullscreenVideoRef.current.play();
        setIsPlaying(true);
      } else {
        fullscreenVideoRef.current.pause();
        setIsPlaying(false);
      }
    } else if (!showFullscreen && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Video event handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickPercent = clickX / rect.width;
      const newTime = clickPercent * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFullscreen = () => {
    // Sync current time from normal video to state before switching
    if (videoRef.current) {
      const currentVideoTime = videoRef.current.currentTime;
      setCurrentTime(currentVideoTime);
      videoRef.current.pause();
    }
    setIsPlaying(false);
    setShowFullscreen(true);
  };

  const handleCloseFullscreen = () => {
    // Sync current time from fullscreen video back to normal video
    if (fullscreenVideoRef.current && videoRef.current) {
      const fullscreenTime = fullscreenVideoRef.current.currentTime;
      videoRef.current.currentTime = fullscreenTime;
      setCurrentTime(fullscreenTime);
      fullscreenVideoRef.current.pause();
    }
    setIsPlaying(false);
    setShowFullscreen(false);
  };
  const renderMediaItem = (mediaItem: MediaPost, isFullscreen = false) => {
    const getContainerClass = () => {
      if (isFullscreen) {
        return "w-full h-full flex items-center justify-center bg-black";
      }
      
      if (mediaItem.mediaType === 'IMAGE') {
        return "relative w-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center";
      }
      
      return "relative w-full max-h-96 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden";
    };
    
    const containerClass = getContainerClass();

    switch (mediaItem.mediaType) {      case 'IMAGE':
        return (
          <div className={containerClass}>
            <div className="relative group">
              <img
                src={mediaItem.mediaUrl}
                alt={mediaItem.caption || "Post image"}
                className={isFullscreen 
                  ? "max-w-full max-h-full object-contain" 
                  : "max-w-full h-auto object-contain rounded-lg"
                }
                loading="lazy"
                style={isFullscreen ? {} : { maxHeight: '500px' }}
              />
              
              {/* Navigation Arrows for Images - Show when multiple media and on hover */}
              {hasMultiple && !isFullscreen && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToPrevious}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white/5 backdrop-blur-sm text-white/80 hover:bg-white/15 hover:text-white border-0 h-10 w-10 p-0 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToNext}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/5 backdrop-blur-sm text-white/80 hover:bg-white/15 hover:text-white border-0 h-10 w-10 p-0 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}
              
              {/* Fullscreen Button for Images */}
              {!isFullscreen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFullscreen();
                  }}
                  className="absolute top-3 right-3 bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 border-0 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
              
              {/* Navigation Arrows for Images in Fullscreen */}
              {hasMultiple && isFullscreen && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToPrevious}
                    className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/5 backdrop-blur-sm text-white/80 hover:bg-white/15 hover:text-white border-0 h-14 w-14 p-0 z-10 rounded-full transition-all duration-200 opacity-70 hover:opacity-100"
                  >
                    <ChevronLeft className="h-7 w-7" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToNext}
                    className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/5 backdrop-blur-sm text-white/80 hover:bg-white/15 hover:text-white border-0 h-14 w-14 p-0 z-10 rounded-full transition-all duration-200 opacity-70 hover:opacity-100"
                  >
                    <ChevronRight className="h-7 w-7" />
                  </Button>
                </>
              )}
              
              {mediaItem.caption && !isFullscreen && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent text-white p-3 text-sm rounded-b-lg">
                  {mediaItem.caption}
                </div>
              )}

              {/* Caption for Fullscreen Images */}
              {mediaItem.caption && isFullscreen && (
                <div className="absolute bottom-16 left-0 right-0 text-center z-10">
                  <div className="inline-block bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm max-w-3xl mx-auto">
                    {mediaItem.caption}
                  </div>
                </div>
              )}
            </div>
          </div>
        );case 'VIDEO':
        return (
          <div 
            className={containerClass}
            onMouseEnter={isFullscreen ? handleFullscreenMouseEnter : handleMouseEnter}
            onMouseLeave={isFullscreen ? handleFullscreenMouseLeave : handleMouseLeave}
            onMouseMove={isFullscreen ? handleFullscreenMouseMove : handleMouseMove}
          >
            <video
              ref={isFullscreen ? fullscreenVideoRef : videoRef}
              src={mediaItem.mediaUrl}
              className={isFullscreen ? "max-w-full max-h-full object-contain cursor-pointer" : "w-full h-full object-contain cursor-pointer"}
              poster={mediaItem.thumbnailUrl}
              muted={isMuted}
              onClick={handleVideoClick}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onLoadedMetadata={isFullscreen ? () => {
                if (fullscreenVideoRef.current) {
                  setDuration(fullscreenVideoRef.current.duration);
                  // Sync time from normal video to fullscreen video
                  if (videoRef.current) {
                    fullscreenVideoRef.current.currentTime = videoRef.current.currentTime;
                  }
                }
              } : handleLoadedMetadata}
              onTimeUpdate={() => {
                if (isFullscreen && fullscreenVideoRef.current) {
                  setCurrentTime(fullscreenVideoRef.current.currentTime);
                } else if (!isFullscreen && videoRef.current) {
                  setCurrentTime(videoRef.current.currentTime);
                }
              }}
            />

            {/* Video Controls Bar - Normal View */}
            {duration > 0 && (showControls || !isPlaying) && !isFullscreen && (
              <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3 transition-all duration-300 ${
                showControls || !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}>
                <div className="flex items-center space-x-3">
                  {/* Progress Bar */}
                  <span className="text-white text-xs font-medium drop-shadow">{formatTime(currentTime)}</span>
                  <div 
                    className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer backdrop-blur-sm"
                    onClick={handleProgressClick}
                  >
                    <div 
                      className="h-full bg-white/80 rounded-full transition-all duration-150"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                  <span className="text-white text-xs font-medium drop-shadow">{formatTime(duration)}</span>
                  
                  {/* Volume Control */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute();
                    }}
                    className="h-7 w-7 p-0 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border-0"
                  >
                    {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                  </Button>

                  {/* Fullscreen Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFullscreen();
                    }}
                    className="h-7 w-7 p-0 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border-0"
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Video Controls Bar - Fullscreen View */}
            {duration > 0 && (showFullscreenControls || !isPlaying) && isFullscreen && (
              <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 transition-all duration-300 z-20 ${
                showFullscreenControls || !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}>
                <div className="flex items-center space-x-4">
                  {/* Progress Bar */}
                  <span className="text-white text-sm font-medium drop-shadow">{formatTime(currentTime)}</span>
                  <div 
                    className="flex-1 h-2 bg-white/20 rounded-full cursor-pointer backdrop-blur-sm"
                    onClick={(e) => {
                      if (fullscreenVideoRef.current && duration > 0) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const clickPercent = clickX / rect.width;
                        const newTime = clickPercent * duration;
                        fullscreenVideoRef.current.currentTime = newTime;
                        setCurrentTime(newTime);
                      }
                    }}
                  >
                    <div 
                      className="h-full bg-white/90 rounded-full transition-all duration-150"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                  <span className="text-white text-sm font-medium drop-shadow">{formatTime(duration)}</span>
                  
                  {/* Volume Control */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (fullscreenVideoRef.current) {
                        fullscreenVideoRef.current.muted = !isMuted;
                        setIsMuted(!isMuted);
                      }
                    }}
                    className="h-9 w-9 p-0 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border-0"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Caption - Only show when controls are hidden or no video duration */}
            {mediaItem.caption && !isFullscreen && (duration === 0 || (!showControls && isPlaying)) && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent text-white p-3 text-sm">
                {mediaItem.caption}
              </div>
            )}

            {/* Fullscreen Caption - Show when controls are hidden */}
            {mediaItem.caption && isFullscreen && (!showFullscreenControls && isPlaying) && (
              <div className="absolute bottom-16 left-0 right-0 text-center z-10">
                <div className="inline-block bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm max-w-3xl mx-auto">
                  {mediaItem.caption}
                </div>
              </div>
            )}
          </div>
        );

      case 'DOCUMENT':
        return (
          <div className={isFullscreen ? "w-full h-full flex items-center justify-center" : "bg-gray-100 dark:bg-gray-800 rounded-lg p-6 text-center"}>
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Download className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-sm">{mediaItem.originalFileName}</p>
                <p className="text-xs text-gray-500">
                  {mediaItem.fileSize ? `${(mediaItem.fileSize / 1024 / 1024).toFixed(2)} MB` : ''}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(mediaItem.mediaUrl, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Main Media Display */}
      <div className="relative">
        {renderMediaItem(currentMedia)}        {/* Navigation Arrows - Softer and more user-friendly */}
        {hasMultiple && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevious}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white/5 backdrop-blur-sm text-white/80 hover:bg-white/15 hover:text-white border-0 h-10 w-10 p-0 rounded-full transition-all duration-200 opacity-60 hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNext}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/5 backdrop-blur-sm text-white/80 hover:bg-white/15 hover:text-white border-0 h-10 w-10 p-0 rounded-full transition-all duration-200 opacity-60 hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}{/* Fullscreen Dialog */}
        {(currentMedia.mediaType === 'IMAGE' || currentMedia.mediaType === 'VIDEO') && (
          <Dialog open={showFullscreen} onOpenChange={handleCloseFullscreen}>
            <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black">
              <div className="relative w-full h-full">
                {renderMediaItem(currentMedia, true)}
                  {/* Fullscreen Navigation Arrows - Softer and more user-friendly */}
                {hasMultiple && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToPrevious}
                      className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/5 backdrop-blur-sm text-white/80 hover:bg-white/15 hover:text-white border-0 h-14 w-14 p-0 z-10 rounded-full transition-all duration-200 opacity-70 hover:opacity-100"
                    >
                      <ChevronLeft className="h-7 w-7" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToNext}
                      className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/5 backdrop-blur-sm text-white/80 hover:bg-white/15 hover:text-white border-0 h-14 w-14 p-0 z-10 rounded-full transition-all duration-200 opacity-70 hover:opacity-100"
                    >
                      <ChevronRight className="h-7 w-7" />
                    </Button>
                  </>
                )}                {/* Fullscreen Media Counter - Softer styling */}
                {hasMultiple && (
                  <div className="absolute top-6 left-6 z-10">
                    <Badge variant="secondary" className="bg-white/10 backdrop-blur-sm text-white/90 border-0 px-3 py-1 text-sm">
                      {currentIndex + 1} / {media.length}
                    </Badge>
                  </div>
                )}
                  {/* Close button for fullscreen - Softer styling */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseFullscreen}
                  className="absolute top-6 right-6 bg-white/10 backdrop-blur-sm text-white/80 hover:bg-white/20 hover:text-white border-0 h-12 w-12 p-0 z-10 rounded-full transition-all duration-200 text-xl font-light"
                >
                  ×
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}        {/* Media Counter - Softer styling */}
        {hasMultiple && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-white/10 backdrop-blur-sm text-white/90 border-0 px-2 py-1 text-xs">
              {currentIndex + 1} / {media.length}
            </Badge>
          </div>
        )}
      </div>

      {/* Media Thumbnails */}
      {hasMultiple && (
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          {media.map((mediaItem, index) => (
            <button
              key={mediaItem.mediaId}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                index === currentIndex 
                  ? 'border-blue-500' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              {mediaItem.mediaType === 'IMAGE' ? (
                <img
                  src={mediaItem.mediaUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : mediaItem.mediaType === 'VIDEO' ? (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative">
                  {mediaItem.thumbnailUrl ? (
                    <img
                      src={mediaItem.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Play className="h-4 w-4 text-gray-500" />
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <Play className="h-3 w-3 text-white" />
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Download className="h-4 w-4 text-gray-500" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
