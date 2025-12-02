// Post types
export interface PostKomunikasi {
  postId: number;
  konten: string;
  biografiId: number;
  authorName: string;
  authorPhoto?: string;
  authorJurusan?: string;
  authorAlumniTahun?: string;
  media: MediaPost[];
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  userReaction?: string;
  recentReactions: ReactionSummary[];
  recentComments: PostComment[];
  status: string;
  createdAt: string;
  updatedAt: string;
  timeAgo?: string;
}

export interface MediaPost {
  mediaId: number;
  postId: number;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  mediaOrder: number;
  caption?: string;
  originalFileName?: string;
  fileSize?: number;
  mimeType?: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export interface ReactionSummary {
  reactionType: string;
  emoji: string;
  count?: number;
  userName?: string;
  userPhoto?: string;
}

export interface PostComment {
  commentId: number;
  postId: number;
  biografiId: number;
  parentCommentId?: number;
  authorName: string;
  authorPhoto?: string;
  authorJurusan?: string;
  authorAlumniTahun?: string;
  konten: string;
  likeCount: number;
  dislikeCount: number;
  replyCount: number;
  userReaction?: string;
  replies: PostComment[];
  status: string;
  createdAt: string;
  updatedAt: string;
  timeAgo?: string;
}

// Request types
export interface CreatePostRequest {
  konten: string;
  media: MediaUpload[];
}

export interface MediaUpload {
  mediaUrl: string;
  mediaType: string;
  mediaOrder?: number;
  caption?: string;
  originalFileName?: string;
  fileSize?: number;
  mimeType?: string;
  thumbnailUrl?: string;
}

export interface CreateCommentRequest {
  konten: string;
  parentCommentId?: number;
}

// Filter types
export interface PostFilters {
  jurusan: string;
  alumniTahun: string;
  searchKeyword: string;
}

// API Response types
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// Reaction types
export const REACTION_TYPES = {
  LIKE: '👍',
  DISLIKE: '👎'
} as const;

export type ReactionType = keyof typeof REACTION_TYPES;

// Statistics types
export interface CommunicationStats {
  totalPosts: number;
  activeMembers: number;
  todayPosts: number;
  onlineNow: number;
}

// Activity types
export interface RecentActivity {
  id: number;
  type: 'post' | 'comment' | 'reaction' | 'join';
  message: string;
  timeAgo: string;
  author?: string;
  icon?: string;
}
