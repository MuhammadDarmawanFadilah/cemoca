"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, X } from "lucide-react";

interface PhotoUploadProps {
  value?: string;
  onChange: (value: string) => void;
  preview?: string;
  onPreviewChange?: (preview: string) => void;
}

export default function PhotoUpload({ value, onChange, preview, onPreviewChange }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar yang diperbolehkan');
      return;
    }    // Validate file size (max 5MB)
    const maxSize = parseInt(process.env.NEXT_PUBLIC_MAX_IMAGE_SIZE || '5242880');
    const maxSizeMB = process.env.NEXT_PUBLIC_UPLOAD_MAX_SIZE_MB || '5';
    if (file.size > maxSize) {
      alert(`Ukuran file maksimal ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        if (onPreviewChange) {
          onPreviewChange(preview);
        }
      };
      reader.readAsDataURL(file);      // Upload to backend
      const formData = new FormData();
      formData.append('file', file);

      const uploadEndpoint = process.env.NEXT_PUBLIC_IMAGE_UPLOAD_ENDPOINT || '/api/images/upload';
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      onChange(result.url || result.filename);    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = process.env.NEXT_PUBLIC_UPLOAD_ERROR_MSG || 'Gagal mengupload foto. Silakan coba lagi.';
      alert(errorMsg);
    } finally {
      setUploading(false);
    }
  };  const clearPhoto = () => {
    onChange('');
    if (onPreviewChange) {
      onPreviewChange('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const displayImage = (() => {
    if (preview && preview.trim() !== "") return preview;
    if (value && value.trim() !== "") {
      const imageEndpoint = process.env.NEXT_PUBLIC_IMAGE_SERVE_ENDPOINT || '/api/images';
      return `${imageEndpoint}/${value}`;
    }
    return null;
  })();

  return (
    <div className="space-y-4">
      <Label>Foto Profil</Label>
      
      <div className="flex items-center gap-4">
        <Avatar className="h-24 w-24">
          {displayImage ? (
            <AvatarImage src={displayImage} alt="Profile photo" />
          ) : null}
          <AvatarFallback className="bg-muted">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Mengupload...' : 'Pilih Foto'}
          </Button>
            {(value && value.trim() !== "") || (preview && preview.trim() !== "") ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearPhoto}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
              Hapus
            </Button>          ) : null}
          
          <p className="text-xs text-muted-foreground">
            Format: JPG, PNG, max 5MB
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
