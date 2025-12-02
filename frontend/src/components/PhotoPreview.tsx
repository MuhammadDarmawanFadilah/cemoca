"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Camera } from "lucide-react";
import Image from "next/image";

interface PhotoPreviewProps {
  currentPhoto?: string;
  onPhotoChange: (photo: string | null) => void;
  label?: string;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
}

export default function PhotoPreview({
  currentPhoto,
  onPhotoChange,
  label = "Foto Profil",
  maxSize = 5,
  acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
}: PhotoPreviewProps) {
  const [preview, setPreview] = useState<string | null>(currentPhoto || null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setError(null);

    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      setError(`Format file tidak didukung. Gunakan: ${acceptedTypes.map(type => type.split('/')[1]).join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Ukuran file terlalu besar. Maksimal ${maxSize}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      onPhotoChange(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removePhoto = () => {
    setPreview(null);
    onPhotoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">{label}</Label>
      
      <Card className={`border-2 border-dashed transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
      }`}>
        <CardContent className="p-6">
          {preview ? (
            // Photo Preview
            <div className="space-y-4">
              <div className="relative mx-auto w-40 h-40">
                <Image
                  src={preview}
                  alt="Preview foto"
                  fill
                  className="object-cover rounded-lg border"
                  sizes="160px"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-8 w-8 p-0"
                  onClick={removePhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={openFileDialog}
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Ganti Foto
                </Button>
              </div>
            </div>
          ) : (
            // Upload Area
            <div
              className="text-center py-8 cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={openFileDialog}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isDragging ? 'Lepaskan file di sini' : 'Upload foto profil'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Drag & drop atau klik untuk memilih file
                </p>
                <p className="text-xs text-muted-foreground">
                  Format: {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} • Maksimal {maxSize}MB
                </p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}
