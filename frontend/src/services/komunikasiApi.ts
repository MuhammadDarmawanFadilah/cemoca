import { 
  PostKomunikasi, 
  PostComment, 
  CreatePostRequest, 
  CreateCommentRequest, 
  PageResponse,
  ReactionSummary 
} from '@/types/komunikasi';
import { ApiClient } from './apiClient';

class KomunikasiApi {
  // ========== POST OPERATIONS ==========
  
  async getFeedPosts(page = 0, size = 10, currentUserId?: number): Promise<PageResponse<PostKomunikasi>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (currentUserId) {
      params.append('currentUserId', currentUserId.toString());
    }

    return ApiClient.get<PageResponse<PostKomunikasi>>(`/komunikasi/feed?${params}`);
  }

  async getPopularPosts(page = 0, size = 10, currentUserId?: number): Promise<PageResponse<PostKomunikasi>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (currentUserId) {
      params.append('currentUserId', currentUserId.toString());
    }

    return ApiClient.get<PageResponse<PostKomunikasi>>(`/komunikasi/popular?${params}`);
  }

  async getTrendingPosts(page = 0, size = 10, currentUserId?: number): Promise<PageResponse<PostKomunikasi>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (currentUserId) {
      params.append('currentUserId', currentUserId.toString());
    }

    return ApiClient.get<PageResponse<PostKomunikasi>>(`/komunikasi/trending?${params}`);
  }

  async searchPosts(keyword: string, page = 0, size = 10, currentUserId?: number): Promise<PageResponse<PostKomunikasi>> {
    const params = new URLSearchParams({
      keyword,
      page: page.toString(),
      size: size.toString(),
    });
    
    if (currentUserId) {
      params.append('currentUserId', currentUserId.toString());
    }

    return ApiClient.get<PageResponse<PostKomunikasi>>(`/komunikasi/search?${params}`);
  }

  async getPostsByUser(biografiId: number, page = 0, size = 10, currentUserId?: number): Promise<PageResponse<PostKomunikasi>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (currentUserId) {
      params.append('currentUserId', currentUserId.toString());
    }

    return ApiClient.get<PageResponse<PostKomunikasi>>(`/komunikasi/user/${biografiId}?${params}`);
  }

  async getUserPosts(biografiId: number, page = 0, size = 10, currentUserId?: number): Promise<PageResponse<PostKomunikasi>> {
    return this.getPostsByUser(biografiId, page, size, currentUserId);
  }

  async getPostById(postId: number, currentUserId?: number): Promise<PostKomunikasi> {
    const params = new URLSearchParams();
    
    if (currentUserId) {
      params.append('currentUserId', currentUserId.toString());
    }

    return ApiClient.get<PostKomunikasi>(`/komunikasi/post/${postId}?${params}`);
  }

  async createPost(request: CreatePostRequest, biografiId: number): Promise<PostKomunikasi> {
    return ApiClient.post<PostKomunikasi>(`/komunikasi/post?biografiId=${biografiId}`, request);
  }

  async deletePost(postId: number, biografiId: number): Promise<{ message: string }> {
    const result = await ApiClient.delete<{ message: string }>(`/komunikasi/post/${postId}?biografiId=${biografiId}`);
    return result || { message: 'Post deleted successfully' };
  }

  // ========== REACTION OPERATIONS ==========
  
  async togglePostReaction(postId: number, reactionType: string, biografiId: number): Promise<PostKomunikasi> {
    return ApiClient.post<PostKomunikasi>(`/komunikasi/post/${postId}/reaction?reactionType=${reactionType}&biografiId=${biografiId}`, {});
  }

  async getPostReactions(postId: number): Promise<ReactionSummary[]> {
    return ApiClient.get<ReactionSummary[]>(`/komunikasi/post/${postId}/reactions`);
  }

  // ========== COMMENT OPERATIONS ==========
  
  async getPostComments(postId: number, page = 0, size = 10, currentUserId?: number): Promise<PageResponse<PostComment>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (currentUserId) {
      params.append('currentUserId', currentUserId.toString());
    }

    return ApiClient.get<PageResponse<PostComment>>(`/komunikasi/post/${postId}/comments?${params}`);
  }

  async getCommentReplies(commentId: number, currentUserId?: number): Promise<PostComment[]> {
    const params = new URLSearchParams();
    
    if (currentUserId) {
      params.append('currentUserId', currentUserId.toString());
    }

    return ApiClient.get<PostComment[]>(`/komunikasi/comment/${commentId}/replies?${params}`);
  }

  async createComment(postId: number, request: CreateCommentRequest, biografiId: number): Promise<PostComment> {
    return ApiClient.post<PostComment>(`/komunikasi/post/${postId}/comment?biografiId=${biografiId}`, request);
  }

  async deleteComment(commentId: number, biografiId: number): Promise<{ message: string }> {
    const result = await ApiClient.delete<{ message: string }>(`/komunikasi/comment/${commentId}?biografiId=${biografiId}`);
    return result || { message: 'Comment deleted successfully' };
  }

  async toggleCommentReaction(commentId: number, reactionType: string, biografiId: number): Promise<PostComment> {
    return ApiClient.post<PostComment>(`/komunikasi/comment/${commentId}/reaction?reactionType=${reactionType}&biografiId=${biografiId}`, {});
  }

  // ========== MEDIA OPERATIONS ==========
  async uploadMedia(file: File): Promise<{ filename: string; url: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return ApiClient.postFormData<{ filename: string; url: string; message: string }>('/komunikasi/upload', formData);
  }

  // ========== UTILITY OPERATIONS ==========
  
  async getReactionTypes(): Promise<Record<string, string>> {
    return ApiClient.get<Record<string, string>>('/komunikasi/reactions/types');
  }

  async getStats(): Promise<{
    totalPosts: number;
    activeMembers: number;
    todayPosts: number;
    onlineNow: number;
  }> {
    return ApiClient.get<{
      totalPosts: number;
      activeMembers: number;
      todayPosts: number;
      onlineNow: number;
    }>('/komunikasi/stats');
  }

  async getTrendingTopics(): Promise<string[]> {
    return ApiClient.get<string[]>('/komunikasi/trending-topics');
  }
}

export const komunikasiApi = new KomunikasiApi();
