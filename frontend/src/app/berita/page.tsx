'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import NewsSlideShow from '@/components/news-slideshow'
import { 
  Filter, 
  Grid3X3, 
  List, 
  Calendar, 
  Eye, 
  Clock,
  Tag,
  User,
  ArrowRight,
  TrendingUp,
  Star,
  Share2,
  Bookmark,
  Heart,
  FileText,
  Search,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { beritaAPI, Berita, getKategoriDisplay, formatBeritaDate, getBeritaKategories, imageAPI } from '@/lib/api'
import { getApiUrl } from '@/lib/config'
const categories = ["Semua", "AKADEMIK", "KARIR", "ALUMNI", "TEKNOLOGI", "OLAHRAGA", "KEGIATAN"]

// Custom CSS for hiding scrollbar
const scrollbarHideStyle = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

export default function BeritaPage() {  const router = useRouter()
  const searchParams = useSearchParams()
    const [beritaList, setBeritaList] = useState<Berita[]>([])
  const [filteredBerita, setFilteredBerita] = useState<Berita[]>([])
  const [popularBerita, setPopularBerita] = useState<Berita[]>([])
    const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(searchParams?.get('kategori') || 'Semua')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('terbaru')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const pageSize = 12

  // Check if screen is mobile and set view mode accordingly
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 640 // sm breakpoint
      setIsMobile(mobile)
      if (mobile) {
        setViewMode('list') // Force list view on mobile
      }
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // Load data on initial load
  useEffect(() => {
    console.log('Initial load')
    
    // Add timeout to prevent infinite loading
    const loadTimeout = setTimeout(() => {
      setLoading(false)
      setSearchLoading(false)
      setCategoryLoading(false)
      console.warn('Load timeout - setting loading to false')
    }, 10000) // 10 second timeout
    
    Promise.all([
      loadBeritaData().catch(err => console.error('Failed to load berita data:', err)),
      loadPopularBerita().catch(err => console.error('Failed to load popular berita:', err))
    ]).finally(() => {
      clearTimeout(loadTimeout)
    })
    
    return () => clearTimeout(loadTimeout)
  }, [])// Initialize from URL parameters on load
  useEffect(() => {
    const kategoriParam = searchParams?.get('kategori')
    const searchParam = searchParams?.get('search')
    
    if (kategoriParam && categories.includes(kategoriParam)) {
      setSelectedCategory(kategoriParam)
    }
    
    if (searchParam) {
      setSearchTerm(searchParam)
    }
  }, [searchParams])
  // Listen for navbar events
  useEffect(() => {    const handleNavbarCategoryChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { category } = customEvent.detail;
      console.log('Received navbar category change:', category);
      if (category) {
        setSelectedCategory(category);
        setCurrentPage(0);
        
        // Notify navbar about the change confirmation
        const confirmEvent = new CustomEvent('beritaCategoryChanged', { 
          detail: { category: category } 
        });
        window.dispatchEvent(confirmEvent);
        
        // Trigger category change
        setTimeout(() => {
          const categoryToUse = category === 'Semua' ? 'Semua' : category;
          handleCategoryChange(categoryToUse);
        }, 100);
      }
    };

    const handleNavbarSearchChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { searchTerm } = customEvent.detail;
      console.log('Received navbar search change:', searchTerm);
      setSearchTerm(searchTerm);
      setCurrentPage(0);
      // Trigger search
      setTimeout(() => {
        if (searchTerm.trim()) {
          handleSearch();
        } else {
          handleClearSearch();
        }
      }, 100);
    };

    window.addEventListener('navbarCategoryChange', handleNavbarCategoryChange);
    window.addEventListener('navbarSearchChange', handleNavbarSearchChange);

    return () => {
      window.removeEventListener('navbarCategoryChange', handleNavbarCategoryChange);
      window.removeEventListener('navbarSearchChange', handleNavbarSearchChange);
    };
  }, []); // Remove dependencies to avoid circular calls

  const loadBeritaData = async (isSearch = false, isCategory = false) => {
    console.log('=== loadBeritaData CALLED ===');
    console.log('isSearch:', isSearch, 'isCategory:', isCategory);
    
    try {
      if (isSearch) {
        setSearchLoading(true)
      } else if (isCategory) {
        setCategoryLoading(true)
      } else {
        setLoading(true)
      }
      
      // Get parameters from URL - this is the single source of truth
      const urlKategori = searchParams?.get('kategori')
      const currentSearch = searchParams?.get('search') || undefined
      
      // Only use kategori if it exists in URL AND is not "Semua"
      const currentKategori = urlKategori && urlKategori !== 'Semua' ? urlKategori : undefined
      
      console.log('=== API CALL PARAMETERS ===');
      console.log('URL kategori:', urlKategori)
      console.log('selectedCategory state:', selectedCategory)
      console.log('final currentKategori for API:', currentKategori)
      console.log('currentSearch:', currentSearch)
      
      const params = {
        page: currentPage,
        size: pageSize,
        kategori: currentKategori,
        search: currentSearch,
        sortBy: sortBy === 'terbaru' ? 'createdAt' : sortBy === 'terlama' ? 'createdAt' : sortBy === 'terpopuler' ? 'jumlahView' : 'jumlahLike',
        sortDir: sortBy === 'terlama' ? 'asc' : 'desc'
      }

      console.log('Final API params:', params)
      
      const response = await beritaAPI.getPublishedBerita(params)
      console.log('API response received:', {
        content: response.content?.length,
        totalPages: response.totalPages,
        totalElements: response.totalElements
      });
      
      setBeritaList(response.content || [])
      setFilteredBerita(response.content || [])
      setTotalPages(response.totalPages || 0)
    } catch (error) {
      console.error('Error loading berita:', error)
      // Set empty state on error to prevent infinite loading
      setBeritaList([])
      setFilteredBerita([])
      setTotalPages(0)
      toast.error('Gagal memuat berita. Backend mungkin tidak tersedia.')
    } finally {
      // Always reset loading states
      setLoading(false)
      setSearchLoading(false)
      setCategoryLoading(false)
    }
  }
  const loadPopularBerita = async () => {
    try {
      const popular = await beritaAPI.getPopularBerita(5)
      setPopularBerita(popular || [])
    } catch (error) {
      console.error('Error loading popular berita:', error)
      // Set empty array on error to prevent loading issues
      setPopularBerita([])
      // Don't show toast for popular berita error since it's not critical
    }
  }

  const formatDate = (dateString: string) => {
    return formatBeritaDate(dateString)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  const handleLike = async (id: number) => {
    try {
      await beritaAPI.likeBerita(id)
      // Update local state
      setBeritaList(prev => prev.map(berita => 
        berita.id === id 
          ? { ...berita, jumlahLike: berita.jumlahLike + 1 }
          : berita
      ))
      setFilteredBerita(prev => prev.map(berita => 
        berita.id === id 
          ? { ...berita, jumlahLike: berita.jumlahLike + 1 }
          : berita      ))
      toast.success("Berita disukai!")
    } catch (error) {
      console.error('Error liking berita:', error)
      toast.error("Gagal menyukai berita")
    }
  }
  
  const handleCategoryChange = async (category: string) => {
    console.log(`Category selected: ${category}`)
    console.log(`Current selectedCategory state: ${selectedCategory}`)
    
    // Prevent multiple rapid clicks
    if (categoryLoading) return
    
    // Set category loading state
    setCategoryLoading(true)
      try {
      // Update the state
      setSelectedCategory(category)
      console.log(`Setting selectedCategory to: ${category}`)
      setCurrentPage(0) // Reset pagination
      
      // Notify navbar about category change
      const event = new CustomEvent('beritaCategoryChanged', { 
        detail: { category: category } 
      });
      window.dispatchEvent(event);
      
      // Call API directly without URL change
      const params = {
        page: 0,
        size: pageSize,
        kategori: category === 'Semua' ? undefined : category,
        search: searchTerm.trim() || undefined,
        sortBy: sortBy === 'terbaru' ? 'createdAt' : sortBy === 'terlama' ? 'createdAt' : sortBy === 'terpopuler' ? 'jumlahView' : 'jumlahLike',
        sortDir: sortBy === 'terlama' ? 'asc' : 'desc'
      }

      console.log('Filter API params:', params)
      
      const response = await beritaAPI.getPublishedBerita(params)
      console.log('Filter API response:', response)
      
      setBeritaList(response.content || [])
      setFilteredBerita(response.content || [])
      setTotalPages(response.totalPages || 0)
      
    } catch (error) {
      console.error('Error filtering berita:', error)
      toast.error('Gagal memfilter berita')
    } finally {
      setCategoryLoading(false)
    }
  }
  
  const handleSearch = async () => {
    // Prevent multiple rapid clicks
    if (searchLoading) return
    
    setSearchLoading(true)
    
    try {
      setCurrentPage(0) // Reset pagination
      
      // Call API directly without URL change
      const params = {
        page: 0,
        size: pageSize,
        kategori: selectedCategory === 'Semua' ? undefined : selectedCategory,
        search: searchTerm.trim() || undefined,
        sortBy: sortBy === 'terbaru' ? 'createdAt' : sortBy === 'terlama' ? 'createdAt' : sortBy === 'terpopuler' ? 'jumlahView' : 'jumlahLike',
        sortDir: sortBy === 'terlama' ? 'asc' : 'desc'
      }

      console.log('Search API params:', params)
      
      const response = await beritaAPI.getPublishedBerita(params)
      console.log('Search API response:', response)
      
      setBeritaList(response.content || [])
      setFilteredBerita(response.content || [])
      setTotalPages(response.totalPages || 0)
      
      if (response.content?.length === 0 && searchTerm.trim()) {
        toast.info(`Tidak ada berita ditemukan untuk "${searchTerm.trim()}"`)
      }
      
    } catch (error) {
      console.error('Error searching berita:', error)
      toast.error('Gagal mencari berita')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleClearSearch = async () => {
    setSearchTerm('')
    setCurrentPage(0)
    
    try {
      const params = {
        page: 0,
        size: pageSize,
        kategori: selectedCategory === 'Semua' ? undefined : selectedCategory,
        search: undefined,
        sortBy: sortBy === 'terbaru' ? 'createdAt' : sortBy === 'terlama' ? 'createdAt' : sortBy === 'terpopuler' ? 'jumlahView' : 'jumlahLike',
        sortDir: sortBy === 'terlama' ? 'asc' : 'desc'
      }

      const response = await beritaAPI.getPublishedBerita(params)
      setBeritaList(response.content || [])
      setFilteredBerita(response.content || [])
      setTotalPages(response.totalPages || 0)
    } catch (error) {
      console.error('Error clearing search:', error)
      toast.error('Gagal membersihkan pencarian')
    }
  }

  const handleResetAllFilters = async () => {
    setSearchTerm('')
    setSelectedCategory('Semua')
    setSortBy('terbaru')
    setCurrentPage(0)
    
    try {
      const params = {
        page: 0,
        size: pageSize,
        kategori: undefined,
        search: undefined,
        sortBy: 'createdAt',
        sortDir: 'desc'
      }

      const response = await beritaAPI.getPublishedBerita(params)
      setBeritaList(response.content || [])
      setFilteredBerita(response.content || [])
      setTotalPages(response.totalPages || 0)
      
      toast.success('Filter direset')
    } catch (error) {
      console.error('Error resetting filters:', error)
      toast.error('Gagal mereset filter')
    }
  }

  const handleSortChange = async (sort: string) => {
    try {
      setSortBy(sort)
      setCurrentPage(0) // Reset to first page
      
      // Call API directly with new sort
      const params = {
        page: 0,
        size: pageSize,
        kategori: selectedCategory === 'Semua' ? undefined : selectedCategory,
        search: searchTerm.trim() || undefined,
        sortBy: sort === 'terbaru' ? 'createdAt' : sort === 'terlama' ? 'createdAt' : sort === 'terpopuler' ? 'jumlahView' : 'jumlahLike',
        sortDir: sort === 'terlama' ? 'asc' : 'desc'
      }

      console.log('Sort API params:', params)
      
      const response = await beritaAPI.getPublishedBerita(params)
      console.log('Sort API response:', response)
      
      setBeritaList(response.content || [])
      setFilteredBerita(response.content || [])
      setTotalPages(response.totalPages || 0)
      
    } catch (error) {
      console.error('Error sorting berita:', error)
      toast.error('Gagal mengurutkan berita')
    }
  }

  const handlePageChange = async (newPage: number) => {
    try {
      setCurrentPage(newPage)
      
      const params = {
        page: newPage,
        size: pageSize,
        kategori: selectedCategory === 'Semua' ? undefined : selectedCategory,
        search: searchTerm.trim() || undefined,
        sortBy: sortBy === 'terbaru' ? 'createdAt' : sortBy === 'terlama' ? 'createdAt' : sortBy === 'terpopuler' ? 'jumlahView' : 'jumlahLike',
        sortDir: sortBy === 'terlama' ? 'asc' : 'desc'
      }

      console.log('Pagination API params:', params)
      
      const response = await beritaAPI.getPublishedBerita(params)
      setBeritaList(response.content || [])
      setFilteredBerita(response.content || [])
      setTotalPages(response.totalPages || 0)
      
      // Scroll to top after page change
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
    } catch (error) {
      console.error('Error changing page:', error)
      toast.error('Gagal memuat halaman')
    }
  }

  return (
    <>
      {/* Inject custom CSS */}
      <style jsx>{scrollbarHideStyle}</style>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">      {/* Hero Section dengan Slideshow */}
      <section className="relative">
        <div className="container mx-auto px-4 py-2 sm:py-8">
          <div className="text-center mb-2 sm:mb-8">
            <h1 className="text-xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1 sm:mb-4">
              Berita Alumni
            </h1>         
          </div>          {/* Show popular berita slideshow */}
          {popularBerita.length > 0 && (
            <div className="mb-1 sm:mb-2">
              <NewsSlideShow berita={popularBerita} />
            </div>
          )}
        </div>
      </section>      {/* Filter dan Search Section */}
      <section className="container mx-auto px-4 py-1 sm:py-2"><Card className="bg-white/70 backdrop-blur-sm dark:bg-gray-900/70 border-0 shadow-lg">
          <CardContent className="p-2 sm:p-4">
            <div className="space-y-2 sm:space-y-3">              {/* Mobile Compact Layout */}
              <div className="block sm:hidden">
                {/* Category Header - Mobile */}
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Kategori Berita
                  </h4>
                </div>
                  {/* Category Pills - Horizontal Scroll */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
                  {categories.map((category) => (
                    <Badge 
                      key={category} 
                      variant={selectedCategory === category ? "default" : "outline"}
                      className={`cursor-pointer hover:bg-primary/90 transition-colors flex-shrink-0 text-sm px-3 py-2 whitespace-nowrap font-medium ${
                        selectedCategory === category 
                          ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-md' 
                          : 'bg-white/80 text-gray-700 border-gray-300 hover:bg-blue-50'
                      } ${categoryLoading ? 'opacity-50' : ''}`}
                      onClick={() => !categoryLoading && handleCategoryChange(category)}
                    >
                      {categoryLoading && selectedCategory === category ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent mr-2"></div>
                          {category}
                        </span>
                      ) : (
                        category
                      )}
                    </Badge>
                  ))}
                </div>{/* Compact Controls Row */}
                <div className="space-y-2">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Cari berita..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch();
                        }
                      }}
                      className="pl-10 pr-10 h-10 text-base rounded-lg border-2 focus:border-blue-500"
                      disabled={searchLoading}
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearSearch}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      >
                        <X className="text-gray-400 hover:text-gray-600 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Controls Row */}
                  <div className="flex gap-2 items-center">
                    {/* Search Button */}
                    <Button 
                      onClick={handleSearch} 
                      disabled={searchLoading}
                      className="flex-1 h-10 text-base font-medium"
                    >
                      {searchLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border border-current border-t-transparent mr-2" />
                      ) : (
                        <Search className="h-4 w-4 mr-2" />
                      )}
                      Cari
                    </Button>
                    
                    {/* Sort */}
                    <Select value={sortBy} onValueChange={handleSortChange}>
                      <SelectTrigger className="w-20 h-10 text-sm font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="terbaru" className="text-sm">Terbaru</SelectItem>
                        <SelectItem value="terlama" className="text-sm">Terlama</SelectItem>
                        <SelectItem value="terpopuler" className="text-sm">Populer</SelectItem>
                        <SelectItem value="terbanyak" className="text-sm">Disukai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden sm:block space-y-4">
              
              {/* Category Filter Row */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Kategori Berita
                </h3>                <div className="flex flex-wrap gap-2 justify-center max-w-full overflow-x-auto pb-2">
                  {categories.map((category) => (
                    <Badge 
                      key={category} 
                      variant={selectedCategory === category ? "default" : "outline"}
                      className={`cursor-pointer hover:bg-primary/90 transition-colors flex-shrink-0 text-xs xs:text-sm px-3 py-2 ${
                        selectedCategory === category 
                          ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-md' 
                          : 'bg-white/80 text-gray-700 border-gray-300 hover:bg-blue-50'
                      } ${categoryLoading ? 'opacity-50' : ''}`}
                      onClick={() => !categoryLoading && handleCategoryChange(category)}
                    >
                      {categoryLoading && selectedCategory === category ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent mr-2"></div>
                          {category}
                        </span>
                      ) : (
                        category
                      )}
                    </Badge>
                  ))}
                </div>
              </div>              {/* Search and Controls Row */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Pencarian & Pengaturan
                  </h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                  
                  {/* Search Bar */}
                  <div className="flex gap-2 flex-1 max-w-md">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Cari berita..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSearch();
                          }
                        }}
                        className="pl-10 pr-3 h-10 text-sm w-full"
                        disabled={searchLoading}
                      />
                      {searchTerm && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearSearch}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </Button>
                      )}
                    </div>
                    <Button 
                      onClick={handleSearch} 
                      disabled={searchLoading}
                      className="h-10 px-4 text-sm flex-shrink-0"
                    >
                      {searchLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border border-current border-t-transparent" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline ml-2">Cari</span>
                    </Button>
                  </div>
                    {/* View Mode & Sort Controls */}
                  <div className="flex gap-3 justify-center sm:justify-end">
                    {/* View Mode - Desktop Only */}
                    <div className="hidden sm:flex items-center border rounded-md overflow-hidden">
                      <Button 
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        className="rounded-none h-10 px-4"
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid3X3 className="w-4 h-4" />
                        <span className="hidden md:inline ml-2">Grid</span>
                      </Button>
                      <Button 
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        className="rounded-none h-10 px-4"
                        onClick={() => setViewMode('list')}
                      >
                        <List className="w-4 h-4" />
                        <span className="hidden md:inline ml-2">List</span>
                      </Button>
                    </div>

                    {/* Sort By */}
                    <Select value={sortBy} onValueChange={handleSortChange}>
                      <SelectTrigger className="w-40 h-10 text-sm">
                        <SelectValue placeholder="Urutkan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="terbaru" className="text-sm">Terbaru</SelectItem>
                        <SelectItem value="terlama" className="text-sm">Terlama</SelectItem>
                        <SelectItem value="terpopuler" className="text-sm">Terpopuler</SelectItem>
                        <SelectItem value="terbanyak" className="text-sm">Like Terbanyak</SelectItem>
                      </SelectContent>
                    </Select>                  </div>
                </div>
              </div>
              
            </div>
            </div>
          </CardContent>
        </Card>
      </section>{/* Main Content */}
      <section className="container mx-auto px-4 py-8">
        {/* Category Loading Overlay */}
        {categoryLoading && (
          <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-30 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium">Memfilter kategori...</span>
            </div>
          </div>
        )}

        {/* Search Loading Overlay */}
        {searchLoading && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium">Mencari berita...</span>
            </div>
          </div>
        )}
          {loading ? (
          <div className="flex flex-col justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Memuat berita...</p>
            <p className="mt-2 text-sm text-gray-500">Jika loading terlalu lama, backend mungkin belum aktif</p>
          </div>
        ) : filteredBerita.length === 0 ? (
          <Card className="bg-white/70 backdrop-blur-sm dark:bg-gray-900/70 border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Tidak ada berita ditemukan</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {searchTerm || selectedCategory !== 'Semua' 
                  ? 'Coba ubah kata kunci pencarian atau filter yang digunakan'
                  : 'Backend server mungkin belum aktif atau tidak ada berita tersedia'}
              </p>
              {(!searchTerm && selectedCategory === 'Semua') && (
                <div className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <p>Pastikan backend server berjalan di http://localhost:8181</p>
                  <p className="mt-1">Atau coba refresh halaman setelah beberapa saat</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (          <div className={
            // Mobile: always list view, Desktop: based on viewMode
            `space-y-4 sm:space-y-0 ${
              viewMode === 'grid'
                ? "sm:grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 sm:gap-6"
                : "sm:space-y-6"
            }`
          }>
            {filteredBerita.map((berita) => (
              <Card
                key={berita.id}
                className={`group hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm dark:bg-gray-900/90 border-0 overflow-hidden ${
                  // Mobile: always list layout, Desktop: based on viewMode
                  'flex flex-row sm:flex-row'
                } ${
                  viewMode === 'grid' ? 'sm:flex sm:flex-col' : 'sm:flex sm:flex-row'
                }`}
              >
                {/* Image Section */}
                <div className={`relative ${
                  // Mobile: compact square image, Desktop: based on viewMode  
                  'w-24 h-24 sm:flex-shrink-0'
                } ${
                  viewMode === 'grid' 
                    ? 'sm:w-full sm:h-48' 
                    : 'sm:w-48 sm:h-32'
                }`}>
                  <Image
                    src={berita.gambarUrl ? getApiUrl(`/api/images/${berita.gambarUrl}`) : "/api/placeholder/400/300"}
                    alt={berita.judul}
                    fill
                    className={`object-cover group-hover:scale-105 transition-transform duration-300 bg-gray-100 dark:bg-gray-800 ${
                      viewMode === 'grid'
                        ? 'rounded-lg sm:rounded-t-lg sm:rounded-b-none'
                        : 'rounded-lg sm:rounded-l-lg sm:rounded-r-none'
                    }`}
                  />
                  <div className={`absolute top-1 left-1 sm:top-2 sm:left-2 ${viewMode === 'grid' ? 'hidden sm:flex' : 'hidden sm:flex'}`}>
                    <Badge variant="secondary" className="bg-white/90 text-gray-900 text-xs px-2 py-1">
                      {getKategoriDisplay(berita.kategori)}
                    </Badge>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-3 sm:p-4 flex-1 min-w-0">
                  {/* Mobile: Category badge + date compact */}
                  <div className="flex items-center justify-between mb-2 sm:hidden">
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      {getKategoriDisplay(berita.kategori)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatDate(berita.createdAt)}
                    </span>
                  </div>
                  
                  {/* Desktop: Date and Author */}
                  <div className="items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3 hidden sm:flex">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(berita.createdAt)}</span>
                    <span>•</span>
                    <User className="w-4 h-4" />
                    <span>{berita.penulis || 'Admin'}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
                    <Link href={`/berita/${berita.id}`}>
                      {berita.judul}
                    </Link>
                  </h3>

                  {/* Summary - Mobile shows only 1 line */}
                  <p className="text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 line-clamp-1 sm:line-clamp-2 text-sm leading-relaxed">
                    {berita.ringkasan}
                  </p>

                  {/* Stats and Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{formatNumber(berita.jumlahView)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{formatNumber(berita.jumlahLike)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(berita.id)}
                        className="text-gray-500 hover:text-red-500 h-6 w-6 sm:h-8 sm:w-8 p-0"
                      >
                        <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-blue-500 h-6 w-6 sm:h-8 sm:w-8 p-0"
                      >
                        <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" asChild className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                        <Link href={`/berita/${berita.id}`}>
                          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              Sebelumnya
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(0, Math.min(totalPages - 5, currentPage - 2)) + i;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum + 1}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              Selanjutnya
            </Button>
          </div>
        )}      </section>
    </div>
    </>
  )
}
