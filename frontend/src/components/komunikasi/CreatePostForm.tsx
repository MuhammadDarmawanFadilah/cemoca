"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ImageIcon, 
  Video, 
  X, 
  Upload, 
  Send,
  AlertCircle,
  Loader2
} from "lucide-react";
import { CreatePostRequest, MediaUpload, PostKomunikasi } from "@/types/komunikasi";
import { komunikasiApi } from "@/services/komunikasiApi";
import { useAuth } from "@/contexts/AuthContext";
import { imageAPI } from "@/lib/api";

interface CreatePostFormProps {
  onPostCreated: (post: PostKomunikasi) => void;
  currentUserId: number;
  currentUserBiografi?: any;
}

interface MediaPreviewItem extends MediaUpload {
  id: string;
  file?: File;
  preview?: string;
}

export default function CreatePostForm({ onPostCreated, currentUserId, currentUserBiografi }: CreatePostFormProps) {
  const [content, setContent] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaPreviewItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
  const userBiografi = currentUserBiografi || user?.biografi;
  
  // Temporary debug - remove after fixing
  React.useEffect(() => {
    console.log('CreatePostForm Debug:');
    console.log('- currentUserBiografi:', currentUserBiografi);
    console.log('- userBiografi:', userBiografi);
    console.log('- userBiografi?.foto:', userBiografi?.foto);
    console.log('- userBiografi?.fotoProfil:', userBiografi?.fotoProfil);
    if (userBiografi?.foto) {
      console.log('- foto URL:', imageAPI.getImageUrl(userBiografi.foto));
    }
    if (userBiografi?.fotoProfil) {
      console.log('- fotoProfil URL:', imageAPI.getImageUrl(userBiografi.fotoProfil));
    }
  }, [currentUserBiografi, userBiografi]);

  const handleSubmit = async () => {
    if (!content.trim() && mediaItems.length === 0) {
      setError("Silakan masukkan teks atau upload media");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {      // Upload media files first
      const uploadedMedia: MediaUpload[] = [];
      
      for (let index = 0; index < mediaItems.length; index++) {
        const mediaItem = mediaItems[index];
        if (mediaItem.file) {
          const uploadResponse = await komunikasiApi.uploadMedia(mediaItem.file);
          uploadedMedia.push({
            mediaUrl: uploadResponse.url,
            mediaType: mediaItem.mediaType,
            mediaOrder: index + 1,
            caption: mediaItem.caption,
            originalFileName: mediaItem.file.name,
            fileSize: mediaItem.file.size,
            mimeType: mediaItem.file.type
          });
        }
      }

      // Create post
      const createPostRequest: CreatePostRequest = {
        konten: content.trim(),
        media: uploadedMedia
      };

      const newPost = await komunikasiApi.createPost(createPostRequest, currentUserId);
      
      // Reset form
      setContent("");
      setMediaItems([]);
      setIsExpanded(false);
      
      // Notify parent
      onPostCreated(newPost);
      
    } catch (error) {
      console.error('Error creating post:', error);
      setError("Gagal membuat post. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError("Ukuran file tidak boleh lebih dari 10MB");
        return;
      }

      const mediaType = file.type.startsWith('image/') ? 'IMAGE' : 
                       file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';

      const reader = new FileReader();
      reader.onload = (e) => {
        const newMedia: MediaPreviewItem = {
          id: Date.now().toString() + Math.random(),
          mediaUrl: e.target?.result as string,
          mediaType: mediaType as 'IMAGE' | 'VIDEO',
          caption: "",
          file: file,
          preview: e.target?.result as string
        };

        setMediaItems(prev => [...prev, newMedia]);
      };

      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeMedia = (mediaId: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== mediaId));
  };

  const updateMediaCaption = (mediaId: string, caption: string) => {
    setMediaItems(prev => prev.map(item => 
      item.id === mediaId ? { ...item, caption } : item
    ));
  };

  return (    <Card className="mb-6">
      <CardContent className="pt-6">        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={userBiografi?.foto ? imageAPI.getImageUrl(userBiografi.foto) : 
                   userBiografi?.fotoProfil ? imageAPI.getImageUrl(userBiografi.fotoProfil) : undefined}
              alt={userBiografi?.namaLengkap || "User"} 
            />
            <AvatarFallback className="bg-blue-500 text-white">
              {userBiografi?.namaLengkap ? 
                userBiografi.namaLengkap.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 
                "U"
              }
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="Apa yang ingin Anda bagikan dengan alumni lainnya?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              className="min-h-[60px] resize-none border-none shadow-none focus-visible:ring-0 text-base"
              rows={isExpanded ? 4 : 2}
            />

            {/* Media Preview */}
            {mediaItems.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {mediaItems.map((media) => (
                  <div key={media.id} className="relative group">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      {media.mediaType === 'IMAGE' ? (
                        <img
                          src={media.preview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={media.preview}
                          className="w-full h-full object-cover"
                          controls={false}
                        />
                      )}
                      
                      {/* Remove button */}
                      <button
                        onClick={() => removeMedia(media.id)}
                        className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action bar */}
            {isExpanded && (
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    <ImageIcon className="h-4 w-4 mr-1" />
                    Foto
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-green-600 hover:bg-green-50"
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Video
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsExpanded(false);
                      setContent("");
                      setMediaItems([]);
                      setError("");
                    }}
                  >
                    Batal
                  </Button>
                  
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || (!content.trim() && mediaItems.length === 0)}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-1" />
                        Posting
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
