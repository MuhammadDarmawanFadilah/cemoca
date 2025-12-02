'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Eye, 
  Calendar,
  User,
  Tag,
  Heart,
  Share2,
  Download,
  AlertTriangle
} from 'lucide-react'
import { imageAPI } from '@/lib/api'

interface PreviewData {
  id: number
  judul: string
  ringkasan: string
  konten: string
  penulis: string
  kategori: string
  tags: string[]
  gambarUrl: string
  mediaLampiran: any[]
  featured: boolean
  status: string
  createdAt: string
  updatedAt: string
  jumlahLike: number
}

export default function PreviewBeritaPage() {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)

  useEffect(() => {
    // Get preview data from sessionStorage
    const data = sessionStorage.getItem('berita-preview')
    if (data) {
      try {
        const parsedData = JSON.parse(data)
        setPreviewData(parsedData)
      } catch (error) {
        console.error('Error parsing preview data:', error)
      }
    }
  }, [])

  if (!previewData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Data Preview Tidak Ditemukan</h2>
            <p className="text-muted-foreground mb-4">
              Silakan kembali ke halaman tambah berita dan coba lagi.
            </p>
            <Button onClick={() => window.close()}>
              Tutup Preview
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'UMUM': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'AKADEMIK': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'KARIR': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'ALUMNI': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'TEKNOLOGI': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
      'OLAHRAGA': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'KEGIATAN': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    }
    return colors[category as keyof typeof colors] || colors.UMUM
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                onClick={() => window.close()}
              >
                <ArrowLeft className="w-4 h-4" />
                Tutup Preview
              </Button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Preview Berita
                </h1>
                <p className="text-sm text-muted-foreground">
                  Tampilan seperti yang akan dilihat pengunjung
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-2">
                <Eye className="w-3 h-3" />
                Mode Preview
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <article className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-white/20 overflow-hidden">
            {/* Featured Badge */}
            {previewData.featured && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 text-sm font-medium">
                ⭐ Berita Unggulan
              </div>
            )}

            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge className={getCategoryColor(previewData.kategori)}>
                  {previewData.kategori}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(previewData.createdAt)}
                </Badge>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                {previewData.judul}
              </h1>

              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                {previewData.ringkasan}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span>Oleh: {previewData.penulis}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Heart className="w-4 h-4" />
                  <span>{previewData.jumlahLike} suka</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Main Image */}
            {previewData.gambarUrl && (
              <div className="p-6 pb-4">
                <div className="relative rounded-lg overflow-hidden">
                  <Image
                    src={imageAPI.getImageUrl(previewData.gambarUrl)}
                    alt={previewData.judul}
                    width={800}
                    height={400}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              <div className="prose prose-lg max-w-none dark:prose-invert">
                {previewData.konten.split('\n').map((paragraph, index) => (
                  paragraph.trim() && (
                    <p key={index} className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">
                      {paragraph}
                    </p>
                  )
                ))}
              </div>

              {/* Media Lampiran */}
              {previewData.mediaLampiran && previewData.mediaLampiran.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Media Lampiran</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {previewData.mediaLampiran.map((media, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        {media.type === 'IMAGE' ? (
                          <Image
                            src={imageAPI.getImageUrl(media.url)}
                            alt={media.caption || `Media ${index + 1}`}
                            width={400}
                            height={300}
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <video
                            src={imageAPI.getImageUrl(media.url)}
                            controls
                            className="w-full h-48"
                          >
                            Browser Anda tidak mendukung tag video.
                          </video>
                        )}
                        {media.caption && (
                          <div className="p-3 bg-gray-50 dark:bg-slate-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {media.caption}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Footer */}
            <div className="p-6">
              {/* Tags */}
              {previewData.tags && previewData.tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Tags:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {previewData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Heart className="w-4 h-4" />
                    Suka ({previewData.jumlahLike})
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Share2 className="w-4 h-4" />
                    Bagikan
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Unduh PDF
                </Button>
              </div>
            </div>
          </article>

          {/* Status Info */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">Informasi Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 font-medium">
                    {previewData.status === 'DRAFT' ? 'Draft' : 
                     previewData.status === 'PUBLISHED' ? 'Dipublikasikan' : 'Diarsipkan'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Dibuat:</span>
                  <span className="ml-2 font-medium">
                    {formatDate(previewData.createdAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
