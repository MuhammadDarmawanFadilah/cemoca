'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { config, getApiUrl, getImageUrl } from '@/lib/config'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel'
import { Calendar, User, Eye, ArrowRight } from 'lucide-react'
import Autoplay from "embla-carousel-autoplay"

import { Berita } from '@/lib/api'

interface NewsSlideShowProps {
  className?: string
  berita?: Berita[]
}

export default function NewsSlideShow({ className = "", berita }: NewsSlideShowProps) {
  const [featuredNews, setFeaturedNews] = useState<Berita[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [api, setApi] = useState<CarouselApi>()
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  )
  
  useEffect(() => {
    if (berita && berita.length > 0) {
      setFeaturedNews(berita)
      setLoading(false)
    } else {
      // If no berita provided, show empty state or load from API
      setFeaturedNews([])
      setLoading(false)
    }
  }, [berita])

  useEffect(() => {
    if (!api) return

    const updateCurrentSlide = () => {
      setCurrentSlide(api.selectedScrollSnap())
    }

    updateCurrentSlide()
    api.on("select", updateCurrentSlide)

    return () => {
      api.off("select", updateCurrentSlide)
    }
  }, [api])

  const fetchFeaturedNews = async () => {
    try {
      setLoading(true)
      // Mock data - replace with actual API call
      const mockData: Berita[] = [
        {
          id: 1,
          judul: "Inovasi Teknologi AI dalam Pendidikan: Masa Depan Pembelajaran Digital",
          ringkasan: "Artificial Intelligence mengubah paradigma pendidikan dengan personalisasi pembelajaran yang adaptif dan interaktif.",
          konten: "AI content...",
          penulis: "Dr. Ahmad Santoso",          kategori: "TEKNOLOGI",
          createdAt: "2024-05-30T00:00:00Z",
          updatedAt: "2024-05-30T00:00:00Z",
          gambarUrl: `${process.env.NEXT_PUBLIC_PLACEHOLDER_IMAGE_ENDPOINT || '/api/placeholder'}/800/400`,
          jumlahView: 1250,
          jumlahLike: 0,
          status: "PUBLISHED"
        },
        {
          id: 2,
          judul: "Job Fair Cemoca 2024: Menghubungkan Talenta dengan Industri Terdepan",
          ringkasan: "Event tahunan yang mempertemukan member terbaik dengan perusahaan multinasional dan startup teknologi.",
          konten: "Job fair content...",
          penulis: "Siti Rahayu",          kategori: "KEGIATAN",
          createdAt: "2024-05-29T00:00:00Z",
          updatedAt: "2024-05-29T00:00:00Z",
          gambarUrl: `${process.env.NEXT_PUBLIC_PLACEHOLDER_IMAGE_ENDPOINT || '/api/placeholder'}/800/400`,
          jumlahView: 890,
          jumlahLike: 0,
          status: "PUBLISHED"
        },
        {
          id: 3,
          judul: "Prestasi Gemilang Tim Robotika di Kompetisi Internasional RoboCup 2024",
          ringkasan: "Tim robotika universitas berhasil meraih juara pertama dalam kategori Humanoid Robot Competition.",
          konten: "Robotika content...",
          penulis: "Prof. Budi Wijaya",
          kategori: "OLAHRAGA",          createdAt: "2024-05-28T00:00:00Z",
          updatedAt: "2024-05-28T00:00:00Z",
          gambarUrl: `${process.env.NEXT_PUBLIC_PLACEHOLDER_IMAGE_ENDPOINT || '/api/placeholder'}/800/400`,
          jumlahView: 2100,
          jumlahLike: 0,
          status: "PUBLISHED"
        },
        {
          id: 4,
          judul: "Program Beasiswa Merit Scholarship 2024 untuk Mahasiswa Berprestasi",
          ringkasan: "Membuka kesempatan emas bagi mahasiswa untuk melanjutkan studi dengan dukungan penuh biaya pendidikan.",
          konten: "Beasiswa content...",
          penulis: "Dr. Linda Sari",
          kategori: "AKADEMIK",
          createdAt: "2024-05-27T00:00:00Z",          updatedAt: "2024-05-27T00:00:00Z",
          gambarUrl: `${process.env.NEXT_PUBLIC_PLACEHOLDER_IMAGE_ENDPOINT || '/api/placeholder'}/800/400`,
          jumlahView: 1650,
          jumlahLike: 0,
          status: "PUBLISHED"
        },
        {
          id: 5,
          judul: "Seminar Nasional: Transformasi Digital dalam Era Industry 4.0",
          ringkasan: "Diskusi mendalam tentang strategi adaptasi industri menghadapi revolusi teknologi digital.",
          konten: "Seminar content...",
          penulis: "Prof. Andi Kusuma",
          kategori: "AKADEMIK",          createdAt: "2024-05-26T00:00:00Z",
          updatedAt: "2024-05-26T00:00:00Z",
          gambarUrl: `${process.env.NEXT_PUBLIC_PLACEHOLDER_IMAGE_ENDPOINT || '/api/placeholder'}/800/400`,
          jumlahView: 980,
          jumlahLike: 0,
          status: "PUBLISHED"
        }
      ]
      setFeaturedNews(mockData)
    } catch (error) {
      console.error('Error fetching featured news:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M'
    } else if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K'
    }
    return views.toString()
  }

  const getCategoryColor = (kategori: string) => {
    const colors = {
      'TEKNOLOGI': 'bg-blue-500',
      'EVENT': 'bg-purple-500',
      'PRESTASI': 'bg-yellow-500',
      'BEASISWA': 'bg-red-500',
      'AKADEMIK': 'bg-green-500',
      'ALUMNI': 'bg-indigo-500',
      'KARIR': 'bg-orange-500'
    }
    return colors[kategori as keyof typeof colors] || 'bg-gray-500'
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="relative h-[500px] bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-2xl animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    )
  }
  return (    <div className={`${className}`}>
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent>
          {featuredNews.map((berita) => (
            <CarouselItem key={berita.id}>              <Card className="border-0 shadow-2xl overflow-hidden bg-white dark:bg-slate-900">
                <div className="relative h-[300px] sm:h-[500px] md:h-[600px]">
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    <Image
                      src={berita.gambarUrl ? getImageUrl(berita.gambarUrl) : `${config.placeholderImageEndpoint}/400/300`}
                      alt={berita.judul}
                      fill
                      className="object-contain bg-black"
                      priority
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 flex items-end">
                    <div className="w-full p-4 sm:p-6 md:p-12">
                      <div className="max-w-4xl">                        {/* Category Badge - Hidden on mobile */}
                        <Badge className={`${getCategoryColor(berita.kategori)} text-white border-0 mb-2 sm:mb-4 text-xs sm:text-sm px-2 sm:px-3 py-1 hidden sm:inline-flex`}>
                          {berita.kategori}
                        </Badge>

                        {/* Title - More compact on mobile */}
                        <h1 className="text-lg sm:text-3xl md:text-5xl font-bold text-white mb-2 sm:mb-4 leading-tight line-clamp-2">
                          {berita.judul}
                        </h1>

                        {/* Summary - Hidden on mobile */}
                        <p className="hidden sm:block text-gray-200 text-lg md:text-xl mb-6 leading-relaxed max-w-3xl line-clamp-2">
                          {berita.ringkasan}
                        </p>

                        {/* Meta Information - Hidden on mobile */}
                        <div className="hidden sm:flex flex-wrap items-center gap-3 sm:gap-6 mb-4 sm:mb-6 text-gray-300">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <User className="w-3 h-3 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm md:text-base">{berita.penulis || 'Admin'}</span>
                          </div>
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <Calendar className="w-3 h-3 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm md:text-base">{formatDate(berita.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <Eye className="w-3 h-3 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm md:text-base">{formatViews(berita.jumlahView)} views</span>
                          </div>
                        </div>

                        {/* Read More Button */}
                        <Link href={`/berita/${berita.id}`}>
                          <Button 
                            className="bg-white text-black hover:bg-gray-100 transition-all duration-300 text-sm sm:text-lg px-4 sm:px-8 py-2 sm:py-3 rounded-full group"
                          >
                            Baca Selengkapnya
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Slide Number Indicator */}
                  <div className="absolute top-3 sm:top-6 right-3 sm:right-6">
                    <div className="bg-black/50 backdrop-blur-sm text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                      {featuredNews.findIndex(item => item.id === berita.id) + 1} / {featuredNews.length}
                    </div>
                  </div>
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
          {/* Navigation Arrows */}
        <CarouselPrevious className="left-2 sm:left-6 w-8 h-8 sm:w-12 sm:h-12 bg-white/20 hover:bg-white/30 border-white/30 text-white backdrop-blur-sm" />
        <CarouselNext className="right-2 sm:right-6 w-8 h-8 sm:w-12 sm:h-12 bg-white/20 hover:bg-white/30 border-white/30 text-white backdrop-blur-sm" />
      </Carousel>      {/* Slide Indicators */}
      <div className="flex justify-center mt-2 space-x-2">
        {featuredNews.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors duration-300 ${
              currentSlide === index 
                ? 'bg-blue-500' 
                : 'bg-gray-300 dark:bg-gray-600 hover:bg-blue-400'
            }`}
            onClick={() => {
              api?.scrollTo(index)
            }}
          />
        ))}
      </div>
    </div>
  )
}
