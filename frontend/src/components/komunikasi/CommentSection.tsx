"use client";

import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { PostComment } from "@/types/komunikasi";
import { komunikasiApi } from "@/services/komunikasiApi";
import { imageAPI } from "@/lib/api";

interface CommentItemProps {
  comment: PostComment;
  currentUserId: number;
  currentUserBiografi: any;
  postId: number;
  onReaction: (commentId: number, reactionType: string) => void;
  onReply: (commentId: number, replyContent: string) => void;
  onDelete: (commentId: number) => void;
  onReplyAdded: (parentCommentId: number, newReply: PostComment) => void;
  level?: number;
  expandedReplies?: Set<number>;
}

interface CommentSectionProps {
  postId: number;
  currentUserId: number;
  currentUserBiografi: any;
  initialCommentCount?: number;
}

function CommentItem({ comment, currentUserId, currentUserBiografi, postId, onReaction, onReply, onDelete, onReplyAdded, level = 0, expandedReplies }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(expandedReplies?.has(comment.commentId) || false);
  const [replyContent, setReplyContent] = useState("");
  const [replies, setReplies] = useState<PostComment[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const isOwner = comment.biografiId === currentUserId;
  const hasReplies = comment.replyCount > 0;
  const indentClass = level > 0 ? `ml-2 md:ml-4` : ""; // Reduced indentation

  // Update showReplies when expandedReplies changes
  useEffect(() => {
    if (expandedReplies?.has(comment.commentId)) {
      setShowReplies(true);
      if (hasReplies && replies.length === 0) {
        loadReplies();
      }
    }
  }, [expandedReplies, comment.commentId, hasReplies, replies.length]);

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

  const loadReplies = async () => {
    if (!hasReplies || replies.length > 0) return;
    
    try {
      setLoadingReplies(true);
      const repliesData = await komunikasiApi.getCommentReplies(comment.commentId, currentUserId);
      setReplies(repliesData);
    } catch (error) {
      console.error("Error loading replies:", error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleShowReplies = () => {
    if (!showReplies) {
      loadReplies();
    }
    setShowReplies(!showReplies);
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;

    try {
      const newReply = await komunikasiApi.createComment(
        postId, 
        { konten: replyContent, parentCommentId: comment.commentId },
        currentUserId
      );
      
      // Add reply to local state
      setReplies(prev => [...prev, newReply]);
      setReplyContent("");
      setShowReplyForm(false);
      
      // Keep replies expanded and notify parent
      setShowReplies(true);
      onReplyAdded(comment.commentId, newReply);
    } catch (error) {
      console.error("Error creating reply:", error);
    }
  };

  const handleReaction = (reactionType: string) => {
    onReaction(comment.commentId, reactionType);
  };

  // Function to handle reactions on replies
  const handleReplyReaction = async (replyId: number, reactionType: string) => {
    try {
      const updatedReply = await komunikasiApi.toggleCommentReaction(replyId, reactionType, currentUserId);
      
      // Update the local replies state
      setReplies(prev => prev.map(reply => 
        reply.commentId === replyId ? updatedReply : reply
      ));
      
      // Also notify parent component
      onReaction(replyId, reactionType);
    } catch (error) {
      console.error("Error toggling reply reaction:", error);
    }
  };

  return (
    <div className={`space-y-2 md:space-y-3 ${indentClass}`}>
      <div className="flex items-start space-x-2 md:space-x-3">
        <Avatar className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0">
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
        
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 md:p-3">
            <div className="flex items-center mb-1">
              <div className="flex items-center space-x-1 md:space-x-2">
                <p className="font-medium text-xs md:text-sm truncate max-w-[120px] md:max-w-none">{comment.authorName}</p>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
              </div>
            </div>            
            <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words">
              {comment.konten}
            </p>
          </div>

          {/* Comment Actions */}
          <div className="flex items-center flex-wrap gap-2 md:gap-4 mt-2">
            {/* Like Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction('LIKE')}
              className={`text-xs h-5 md:h-6 px-1 md:px-2 ${
                comment.userReaction === 'LIKE' ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <ThumbsUp className="h-3 w-3 mr-1" />
              {comment.likeCount || 0}
            </Button>

            {/* Dislike Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction('DISLIKE')}
              className={`text-xs h-5 md:h-6 px-1 md:px-2 ${
                comment.userReaction === 'DISLIKE' ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              <ThumbsDown className="h-3 w-3 mr-1" />
              {comment.dislikeCount || 0}
            </Button>
            
            {/* Reply Button - only show if level is less than 2 to prevent deep nesting */}
            {level < 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-xs h-5 md:h-6 px-1 md:px-2 text-gray-500"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Balas
              </Button>
            )}
            
            {/* Show/Hide Replies */}
            {hasReplies && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShowReplies}
                className="text-xs h-5 md:h-6 px-1 md:px-2 text-blue-600"
              >
                {showReplies ? `Sembunyikan ${comment.replyCount} balasan` : `Lihat ${comment.replyCount} balasan`}
              </Button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className="mt-2 md:mt-3 space-y-2">
              <div className="flex space-x-2">
                <Avatar className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0">
                  <AvatarImage 
                    src={currentUserBiografi?.foto ? imageAPI.getImageUrl(currentUserBiografi.foto) : undefined} 
                    alt="You" 
                  />
                  <AvatarFallback className="text-xs">
                    {currentUserBiografi?.namaLengkap
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Tulis balasan..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[60px] md:min-h-[80px] text-xs md:text-sm resize-none"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowReplyForm(false);
                        setReplyContent("");
                      }}
                      className="h-6 md:h-8 px-2 md:px-3 text-xs"
                    >
                      Batal
                    </Button>
                    <Button
                      onClick={handleReply}
                      disabled={!replyContent.trim()}
                      className="h-6 md:h-8 px-2 md:px-3 text-xs"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Balas
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Replies */}
          {showReplies && (
            <div className="mt-2 md:mt-3 space-y-2 md:space-y-3">
              {loadingReplies ? (
                <div className="text-center py-2">
                  <div className="inline-flex items-center text-xs text-gray-500">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400 mr-1"></div>
                    Memuat balasan...
                  </div>
                </div>
              ) : (
                replies.map((reply) => (
                  <CommentItem
                    key={reply.commentId}
                    comment={reply}
                    currentUserId={currentUserId}
                    currentUserBiografi={currentUserBiografi}
                    postId={postId}
                    onReaction={handleReplyReaction}
                    onReply={onReply}
                    onDelete={onDelete}
                    onReplyAdded={onReplyAdded}
                    level={level + 1}
                    expandedReplies={expandedReplies}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentSection({ postId, currentUserId, currentUserBiografi, initialCommentCount = 0 }: CommentSectionProps) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await komunikasiApi.getPostComments(postId, 0, 50, currentUserId);
      setComments(response.content);
      setCommentCount(response.totalElements);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCommentCount = async () => {
    try {
      const response = await komunikasiApi.getPostComments(postId, 0, 1, currentUserId);
      setCommentCount(response.totalElements);
    } catch (error) {
      console.error("Error loading comment count:", error);
    }
  };

  useEffect(() => {
    if (postId && currentUserId) {
      loadComments();
      loadCommentCount();
    }
  }, [postId, currentUserId]);

  const handleNewComment = async () => {
    if (!newComment.trim()) return;

    try {
      const comment = await komunikasiApi.createComment(
        postId,
        { konten: newComment },
        currentUserId
      );
      
      setComments(prev => [comment, ...prev]);
      setNewComment("");
      setCommentCount(prev => prev + 1);
    } catch (error) {
      console.error("Error creating comment:", error);
    }
  };

  const handleReaction = async (commentId: number, reactionType: string) => {
    try {
      const updatedComment = await komunikasiApi.toggleCommentReaction(commentId, reactionType, currentUserId);
      
      // Update comments state - handle both top-level comments and nested replies
      setComments(prev => prev.map(comment => {
        // Check if this is the target comment
        if (comment.commentId === commentId) {
          return updatedComment;
        }
        
        // Check if the target comment is in the replies
        if (comment.replies && comment.replies.length > 0) {
          const updatedReplies = comment.replies.map(reply => 
            reply.commentId === commentId ? updatedComment : reply
          );
          
          // Only update if a reply was actually changed
          if (updatedReplies.some((reply, index) => reply !== comment.replies![index])) {
            return { ...comment, replies: updatedReplies };
          }
        }
        
        return comment;
      }));
      
      // Also update the individual comment component's state if it exists
      // This is handled by the CommentItem component re-rendering with new props
      
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
  };

  const handleReplyAdded = (parentCommentId: number, newReply: PostComment) => {
    setExpandedReplies(prev => new Set([...prev, parentCommentId]));
    setCommentCount(prev => prev + 1);
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Comment Input */}
      <div className="flex space-x-2 md:space-x-3">
        <Avatar className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0">
          <AvatarImage 
            src={currentUserBiografi?.foto ? imageAPI.getImageUrl(currentUserBiografi.foto) : undefined} 
            alt="You" 
          />
          <AvatarFallback className="text-xs">
            {currentUserBiografi?.namaLengkap
              ?.split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <Textarea
            placeholder="Tulis komentar..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[60px] md:min-h-[80px] text-xs md:text-sm resize-none"
          />
          
          <div className="flex justify-end mt-2">
            <Button
              onClick={handleNewComment}
              disabled={!newComment.trim() || loading}
              className="h-6 md:h-8 px-2 md:px-3 text-xs"
            >
              <Send className="h-3 w-3 mr-1" />
              Kirim
            </Button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3 md:space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm md:text-base font-medium">
            Komentar ({commentCount})
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-6">
            <div className="inline-flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b border-gray-400 mr-2"></div>
              Memuat komentar...
            </div>
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-3 md:space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.commentId}
                comment={comment}
                currentUserId={currentUserId}
                currentUserBiografi={currentUserBiografi}
                postId={postId}
                onReaction={handleReaction}
                onReply={() => {}}
                onDelete={() => {}}
                onReplyAdded={handleReplyAdded}
                expandedReplies={expandedReplies}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <MessageCircle className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm md:text-base text-gray-500">Belum ada komentar</p>
            <p className="text-xs md:text-sm text-gray-400">Jadilah yang pertama berkomentar!</p>
          </div>
        )}
      </div>
    </div>
  );
}
