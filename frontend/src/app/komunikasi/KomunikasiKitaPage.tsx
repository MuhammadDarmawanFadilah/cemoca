"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  TrendingUp, 
  Clock, 
  Users, 
  Search,
  Plus,
  Filter,
  MessageCircle,
  Heart,
  User
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import CreatePostModal from "@/components/komunikasi/CreatePostModal";
import CreatePostForm from "@/components/komunikasi/CreatePostForm";
import PostCard from "@/components/komunikasi/PostCard";
import PostFilters from "@/components/komunikasi/PostFilters";
import { komunikasiApi } from "@/services/komunikasiApi";
import { biografiAPI } from "@/lib/api";
import { 
  PostKomunikasi, 
  PostFilters as PostFiltersType, 
  CommunicationStats, 
  RecentActivity 
} from "@/types/komunikasi";

export default function KomunikasiKitaPage() {  const [posts, setPosts] = useState<PostKomunikasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("postingku");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [currentUserBiografi, setCurrentUserBiografi] = useState<any>(null);
  const [stats, setStats] = useState<CommunicationStats>({
    activeMembers: 0,
    totalPosts: 0,
    todayPosts: 0,
    onlineNow: 0
  });
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [filters, setFilters] = useState<PostFiltersType>({
    jurusan: "",
    alumniTahun: "",
    searchKeyword: ""
  });

  const { user, isAuthenticated } = useAuth();
  
  // Get current user's biografi ID
  const currentUserId = user?.biografi?.biografiId;  // Set current user biografi from auth context
  useEffect(() => {
    if (user?.biografi) {      setCurrentUserBiografi(user.biografi);
      
      // Fetch complete biografi data to ensure we have all fields including foto
      const fetchCompleteUserBiografi = async () => {        try {
          const completeUserBiografi = await biografiAPI.getMyBiografi();
          if (completeUserBiografi) {            setCurrentUserBiografi(completeUserBiografi);
          }
        } catch (error) {
          console.error('Error fetching complete user biografi:', error);
        }
      };
      
      fetchCompleteUserBiografi();
    }  }, [user]);

  // Define functions before useEffect
  const loadStats = useCallback(async () => {
    try {
      // Load real statistics from API
      const statsData = await komunikasiApi.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
      // Fallback to default values
      setStats({
        activeMembers: 0,
        totalPosts: 0,
        todayPosts: 0,
        onlineNow: 0
      });
    }
  }, []);

  const loadTrendingTopics = useCallback(async () => {
    try {
      const topics = await komunikasiApi.getTrendingTopics();
      setTrendingTopics(topics.length > 0 ? topics : ["#Alumni2024", "#Kedokteran", "#Networking"]);
    } catch (error) {
      console.error('Error loading trending topics:', error);
      setTrendingTopics(["#Alumni2024", "#Kedokteran", "#Networking"]);
    }
  }, []);

  const loadRecentActivities = useCallback(async () => {
    try {
      // In a real app, this would be an API call to get recent activities
      // For now, we'll generate based on recent posts
      const response = await komunikasiApi.getFeedPosts(0, 5, currentUserId!);
      const activities: RecentActivity[] = response.content.map((post, index) => ({
        id: post.postId,
        type: 'post' as const,
        message: `Post baru dari ${post.authorName}`,
        timeAgo: post.timeAgo || `${(index + 1) * 2} menit yang lalu`,
        author: post.authorName
      }));
      
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error loading recent activities:', error);
      setRecentActivities([]);
    }
  }, [currentUserId]);  const loadPosts = useCallback(async (page = 0, append = false) => {
    if (!currentUserId) return;
    
    try {
      setLoading(true);
      let response;
        switch (activeTab) {
        case "feed":
          response = await komunikasiApi.getFeedPosts(page, 10, currentUserId);
          break;
        case "popular":
          response = await komunikasiApi.getPopularPosts(page, 10, currentUserId);
          break;
        case "trending":
          response = await komunikasiApi.getTrendingPosts(page, 10, currentUserId);
          break;
        case "postingku":
          response = await komunikasiApi.getUserPosts(currentUserId, page, 10, currentUserId);
          break;
        default:
          response = await komunikasiApi.getFeedPosts(page, 10, currentUserId);
      }

      if (append) {
        setPosts(prev => [...prev, ...response.content]);
      } else {
        setPosts(response.content);
      }
      
      setHasMorePosts(!response.last);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, activeTab, filters]);// All hooks must be called before any early returns
  useEffect(() => {
    if (isAuthenticated && currentUserId) {
      loadPosts();
      loadStats();
      loadTrendingTopics();
      loadRecentActivities();
    }
  }, [activeTab, filters, isAuthenticated, currentUserId, loadPosts, loadStats, loadTrendingTopics, loadRecentActivities]);

  // Early return if not authenticated or no biografi
  if (!isAuthenticated || !currentUserId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Komunikasi Kita</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 dark:text-gray-400">
                Silakan login terlebih dahulu dan lengkapi data biografi Anda untuk mengakses fitur Komunikasi Kita.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );  }
  const handleCreatePost = async (newPost: PostKomunikasi) => {
    // Add the new post to the beginning of the list
    setPosts(prev => [newPost, ...prev]);
    setShowCreateModal(false);
    
    // If we're on "postingku" tab, reload posts to ensure proper sorting and data
    if (activeTab === "postingku") {
      // Small delay to allow backend to properly save
      setTimeout(() => {
        loadPosts(0, false);
      }, 500);
    }
  };
  const handleReaction = async (postId: number, reactionType: string) => {
    try {
      await komunikasiApi.togglePostReaction(postId, reactionType, currentUserId!);
      // Refresh posts to get updated reactions
      loadPosts(0, false);
    } catch (error) {
      console.error('Error reacting to post:', error);
    }
  };

  const handleDeletePost = async (postId: number) => {
    try {
      await komunikasiApi.deletePost(postId, currentUserId!);
      setPosts(prev => prev.filter(post => post.postId !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleLoadMore = () => {
    if (hasMorePosts && !loading) {
      loadPosts(currentPage + 1, true);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(0);
    setPosts([]);
  };
  const handleFiltersChange = (newFilters: PostFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(0);
    setPosts([]);
  };
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Komunikasi Kita
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1 md:mt-2 text-sm md:text-base">
                Media sosial eksklusif untuk member Cemoca
              </p>
            </div>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 w-full md:w-auto"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Buat Post
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs */}            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
                <TabsList className="grid w-full md:max-w-lg grid-cols-4">
                  <TabsTrigger value="feed">Feed</TabsTrigger>
                  <TabsTrigger value="popular">Popular</TabsTrigger>
                  <TabsTrigger value="trending">Trending</TabsTrigger>
                  <TabsTrigger value="postingku">Postingku</TabsTrigger>
                </TabsList>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 w-full md:w-auto"
                >
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </div>              {/* Filters */}
              {showFilters && (
                <div className="mb-6">
                  <PostFilters
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                  />
                </div>
              )}

              {/* Create Post Form - Only visible on postingku tab */}              {activeTab === "postingku" && (
                <div className="mb-6">
                  <CreatePostForm 
                    currentUserId={currentUserId!}
                    currentUserBiografi={currentUserBiografi}
                    onPostCreated={(newPost) => {
                      setPosts(prev => [newPost, ...prev]);
                      loadStats(); // Refresh stats after new post
                    }}
                  />
                </div>
              )}

              {/* Posts Content */}              <TabsContent value="feed" className="space-y-4">
                {loading && posts.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : posts.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        Belum ada post untuk ditampilkan. Jadilah yang pertama membuat post!
                      </p>
                    </CardContent>
                  </Card>
                ) : (                  <>
                    {posts.map((post) => (
                      <PostCard 
                        key={post.postId} 
                        post={post} 
                        currentUserId={currentUserId!}
                        currentUserBiografi={currentUserBiografi}
                        onReaction={handleReaction}
                        onDelete={handleDeletePost}
                      />
                    ))}
                    
                    {hasMorePosts && (
                      <div className="text-center">
                        <Button 
                          variant="outline" 
                          onClick={handleLoadMore}
                          disabled={loading}
                        >
                          {loading ? "Loading..." : "Load More"}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="popular" className="space-y-4">
                {loading && posts.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : posts.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        Belum ada post populer untuk ditampilkan.
                      </p>
                    </CardContent>
                  </Card>                ) : (
                  <>
                    {posts.map((post) => (
                      <PostCard 
                        key={post.postId} 
                        post={post} 
                        currentUserId={currentUserId!}
                        currentUserBiografi={currentUserBiografi}
                        onReaction={handleReaction}
                        onDelete={handleDeletePost}
                      />
                    ))}
                    
                    {hasMorePosts && (
                      <div className="text-center">
                        <Button 
                          variant="outline" 
                          onClick={handleLoadMore}
                          disabled={loading}
                        >
                          {loading ? "Loading..." : "Load More"}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="trending" className="space-y-4">
                {loading && posts.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : posts.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        Belum ada post trending untuk ditampilkan.
                      </p>
                    </CardContent>
                  </Card>                ) : (                  <>
                    {posts.map((post) => (
                      <PostCard 
                        key={post.postId} 
                        post={post} 
                        currentUserId={currentUserId!}
                        currentUserBiografi={currentUserBiografi}
                        onReaction={handleReaction}
                        onDelete={handleDeletePost}
                      />
                    ))}
                    
                    {hasMorePosts && (
                      <div className="text-center">
                        <Button 
                          variant="outline" 
                          onClick={handleLoadMore}
                          disabled={loading}
                        >
                          {loading ? "Loading..." : "Load More"}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>              <TabsContent value="postingku" className="space-y-4">
                {loading && posts.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : posts.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        Belum ada postingan Anda. Gunakan form di atas untuk membuat post baru.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {posts.map((post) => (
                      <PostCard 
                        key={post.postId} 
                        post={post} 
                        currentUserId={currentUserId!}
                        currentUserBiografi={currentUserBiografi}
                        onReaction={handleReaction}
                        onDelete={handleDeletePost}
                      />
                    ))}
                    
                    {hasMorePosts && (
                      <div className="text-center">
                        <Button 
                          variant="outline" 
                          onClick={handleLoadMore}
                          disabled={loading}
                        >
                          {loading ? "Loading..." : "Load More"}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>{/* Sidebar */}
          <div className="space-y-4 md:space-y-6 order-first lg:order-last">
            {/* Statistics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Statistik
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-gray-600 dark:text-gray-300">Member Aktif</span>
                    <Badge variant="secondary" className="text-xs">{stats.activeMembers.toLocaleString()}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-gray-600 dark:text-gray-300">Total Post</span>
                    <Badge variant="secondary" className="text-xs">{stats.totalPosts.toLocaleString()}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-gray-600 dark:text-gray-300">Post Hari Ini</span>
                    <Badge variant="secondary" className="text-xs">{stats.todayPosts.toLocaleString()}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-gray-600 dark:text-gray-300">Online Sekarang</span>
                    <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                      {stats.onlineNow}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trending Topics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5" />
                  Trending Topics
                </CardTitle>
              </CardHeader>              <CardContent>
                <div className="flex flex-wrap gap-2 lg:flex-col lg:space-y-2">
                  {trendingTopics.map((topic, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs md:text-sm font-medium text-blue-700 dark:text-blue-300 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      onClick={() => setFilters(prev => ({ ...prev, searchKeyword: topic }))}
                    >
                      {topic}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity - Hidden on mobile, visible on desktop */}
            <Card className="hidden lg:block">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5" />
                  Aktivitas Terkini
                </CardTitle>
              </CardHeader><CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3 text-sm">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((activity, index) => (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            activity.type === 'post' ? 'bg-green-600' :
                            activity.type === 'comment' ? 'bg-blue-600' :
                            activity.type === 'reaction' ? 'bg-red-600' :
                            'bg-orange-600'
                          }`}></div>
                          <div>
                            <p className="text-gray-900 dark:text-white">{activity.message}</p>
                            <p className="text-gray-500 dark:text-gray-400">{activity.timeAgo}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Belum ada aktivitas terbaru</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>      {/* Create Post Modal */}
      <CreatePostModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={handleCreatePost}
        currentUserId={currentUserId!}
        currentUserBiografi={currentUserBiografi}
      />
    </div>
  );
}
