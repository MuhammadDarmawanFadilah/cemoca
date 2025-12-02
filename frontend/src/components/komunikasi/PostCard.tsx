"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MediaCarousel from "./MediaCarousel";
import CommentSection from "./CommentSection";
import ReactionPicker from "./ReactionPicker";
import { PostKomunikasi, REACTION_TYPES } from "@/types/komunikasi";
import { imageAPI } from "@/lib/api";

interface PostCardProps {
  post: PostKomunikasi;
  currentUserId: number;
  currentUserBiografi?: any;
  onReaction: (postId: number, reactionType: string) => void;
  onDelete: (postId: number) => void;
}

export default function PostCard({ post, currentUserId, currentUserBiografi, onReaction, onDelete }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const isOwner = post.biografiId === currentUserId;

  const handleReaction = (reactionType: string) => {
    onReaction(post.postId, reactionType);
    setShowReactionPicker(false);
  };

  const handleDelete = () => {
    if (confirm("Apakah Anda yakin ingin menghapus post ini?")) {
      onDelete(post.postId);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Baru saja";
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} hari yang lalu`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} minggu yang lalu`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} bulan yang lalu`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={post.authorPhoto ? imageAPI.getImageUrl(post.authorPhoto) : undefined} 
                alt={post.authorName} 
              />
              <AvatarFallback>
                {post.authorName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{post.authorName}</p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{post.authorJurusan}</span>
                <span>•</span>
                <span>{post.authorAlumniTahun}</span>
                <span>•</span>
                <span>{formatTimeAgo(post.createdAt)}</span>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Share2 className="h-4 w-4 mr-2" />
                Bagikan
              </DropdownMenuItem>
              {isOwner && (
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600 dark:text-red-400"
                >
                  Hapus Post
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Post Content */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {post.konten}
        </div>

        {/* Media Content */}
        {post.media && post.media.length > 0 && (
          <MediaCarousel media={post.media} />
        )}

        {/* Reaction Summary */}
        {(post.likeCount > 0 || post.dislikeCount > 0) && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              {post.recentReactions.slice(0, 3).map((reaction, index) => (
                <div key={index} className="flex items-center space-x-1">
                  <span>{reaction.emoji}</span>
                  <span>{reaction.userName}</span>
                </div>
              ))}
              {post.likeCount + post.dislikeCount > 3 && (
                <span>dan {post.likeCount + post.dislikeCount - 3} lainnya</span>
              )}
            </div>
            
            {post.commentCount > 0 && (
              <span>{post.commentCount} komentar</span>
            )}
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Like Button */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReactionPicker(!showReactionPicker)}
                className={`flex items-center space-x-2 ${
                  post.userReaction === 'LIKE' ? 'text-blue-600' : ''
                }`}
              >
                <ThumbsUp className="h-4 w-4" />
                <span>{post.likeCount || 0}</span>
              </Button>
              
              {showReactionPicker && (
                <ReactionPicker
                  onReaction={handleReaction}
                  onClose={() => setShowReactionPicker(false)}
                  currentReaction={post.userReaction}
                />
              )}
            </div>

            {/* Dislike Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction('DISLIKE')}
              className={`flex items-center space-x-2 ${
                post.userReaction === 'DISLIKE' ? 'text-red-600' : ''
              }`}
            >
              <ThumbsDown className="h-4 w-4" />
              <span>{post.dislikeCount || 0}</span>
            </Button>

            {/* Comment Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{post.commentCount || 0}</span>
            </Button>

            {/* Share Button */}
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <Share2 className="h-4 w-4" />
              <span>Bagikan</span>
            </Button>
          </div>
        </div>        {/* Recent Comments Preview */}
        {post.recentComments && post.recentComments.length > 0 && !showComments && (
          <div className="space-y-2">
            {post.recentComments.slice(0, 2).map((comment) => (
              <div key={comment.commentId} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage 
                      src={comment.authorPhoto ? imageAPI.getImageUrl(comment.authorPhoto) : undefined} 
                      alt={comment.authorName} 
                    />
                    <AvatarFallback className="text-xs">
                      {comment.authorName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-xs font-medium">{comment.authorName}</p>
                    <p className="text-sm">{comment.konten}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {post.commentCount > 2 && (
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowComments(true)}
                className="text-blue-600 p-0 h-auto"
              >
                Lihat {post.commentCount - 2} komentar lainnya
              </Button>
            )}
          </div>
        )}{/* Full Comments Section */}        {showComments && (
          <CommentSection
            postId={post.postId}
            currentUserId={currentUserId}
            currentUserBiografi={currentUserBiografi}
          />
        )}
      </CardContent>
    </Card>
  );
}
