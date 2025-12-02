'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { config, getApiUrl } from '@/lib/config'
import { ArrowLeft, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import UsulanStepperEdit from '@/components/UsulanStepperEdit'

interface Usulan {
  id: number
  judul: string
  rencanaKegiatan: string
  tanggalMulai: string
  tanggalSelesai: string
  durasiUsulan: string
  gambarUrl?: string
  namaPengusul: string
  emailPengusul?: string
  status: string
}

interface FormData {
  judul: string;
  rencanaKegiatan: string;
  tanggalMulai: Date | null;
  tanggalSelesai: Date | null;
  durasiUsulan: Date | null;
  gambar: File | null;
}

export default function EditUsulanPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [usulan, setUsulan] = useState<Usulan | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load usulan detail
  const loadUsulan = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`/api/usulan/${id}`))
      
      if (!response.ok) {
        throw new Error('Usulan not found')
      }
      
      const data = await response.json()
      setUsulan(data)
    } catch (error) {
      console.error('Error loading usulan:', error)
      toast.error('Usulan tidak ditemukan', {
        dismissible: true,
        duration: 5000
      })
      router.push('/usulan')
    } finally {
      setLoading(false)
    }
  }

  // Check if user has permission to edit this usulan
  const checkEditPermission = () => {
    if (!isAuthenticated || !user || !usulan) {
      return false
    }
    
    // Admin can edit
    const isAdmin = user.role?.roleName === 'ADMIN'
    
    // Proposer can edit
    const isProposer = usulan.emailPengusul && user.email === usulan.emailPengusul
    
    return isAdmin || isProposer
  }

  const formatDateToString = (date: Date | null): string => {
    if (!date) return ''
    return format(date, 'yyyy-MM-dd')
  }

  // Handle submit form
  const handleSubmit = async (formData: FormData) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Validation
    if (!formData.judul.trim()) {
      toast.error('Judul tidak boleh kosong', {
        duration: 5000,
        dismissible: true
      })
      return
    }
    
    if (!formData.rencanaKegiatan.trim()) {
      toast.error('Rencana kegiatan tidak boleh kosong', {
        duration: 5000,
        dismissible: true
      })
      return
    }
    
    if (!formData.tanggalMulai || !formData.tanggalSelesai) {
      toast.error('Tanggal mulai dan selesai harus diisi', {
        duration: 5000,
        dismissible: true
      })
      return
    }    
    
    if (formData.tanggalMulai > formData.tanggalSelesai) {
      toast.error('Tanggal selesai tidak boleh lebih awal dari tanggal mulai', {
        duration: 5000,
        dismissible: true
      })
      return
    }
    
    if (!formData.durasiUsulan) {
      toast.error('Durasi usulan harus diisi', {
        duration: 5000,
        dismissible: true
      })
      return
    }

    try {
      setSaving(true)
      
      const formDataToSend = new FormData()
      formDataToSend.append('judul', formData.judul)
      formDataToSend.append('rencanaKegiatan', formData.rencanaKegiatan)
      formDataToSend.append('tanggalMulai', formatDateToString(formData.tanggalMulai))
      formDataToSend.append('tanggalSelesai', formatDateToString(formData.tanggalSelesai))
      formDataToSend.append('durasiUsulan', formatDateToString(formData.durasiUsulan))
      
      if (formData.gambar) {
        formDataToSend.append('gambar', formData.gambar)
      }

      const response = await fetch(getApiUrl(`/api/usulan/${id}`), {
        method: 'PUT',
        body: formDataToSend
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update usulan')
      }

      toast.success('Usulan berhasil diperbarui!', {
        dismissible: true,
        duration: 5000
      })
      router.push(`/usulan/${id}`)
    } catch (error: Error | unknown) {
      console.error('Error updating usulan:', error)
      const errorMessage = error instanceof Error ? error.message : 'Gagal memperbarui usulan'
      toast.error(errorMessage, {
        dismissible: true,
        duration: 5000
      })
    } finally {
      setSaving(false)
    }
  }
  
  useEffect(() => {
    if (id) {
      loadUsulan()
    }
  }, [id])

  useEffect(() => {
    // Redirect if user doesn't have permission
    if (!loading && usulan && !checkEditPermission()) {
      toast.error('Anda tidak memiliki izin untuk mengedit usulan ini')
      router.push(`/usulan/${id}`)
    }
  }, [usulan, isAuthenticated, user, loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-300 rounded mb-6"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                <div className="h-4 bg-gray-300 rounded w-4/6"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!usulan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-500 text-lg mb-4">Usulan tidak ditemukan</p>
            <Link href="/usulan">
              <Button>Kembali ke Daftar Usulan</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }
  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">        {/* Enhanced Header with Breadcrumb */}
        <div className="bg-white/80 backdrop-blur-md dark:bg-gray-900/80 shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              {/* Navigation with Breadcrumb */}
              <div className="flex items-center space-x-4">
                <Link 
                  href="/usulan" 
                  className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Daftar Usulan</span>
                  <span className="sm:hidden">Kembali</span>
                </Link>
                
                <div className="text-gray-300 dark:text-gray-600">/</div>
                
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800">
                  <Edit className="h-3 w-3 mr-1" />
                  Edit Usulan
                </Badge>
              </div>

              {/* Right side controls */}
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="hidden sm:flex items-center space-x-1">
                  <span className="text-xs">ID: {id}</span>
                </Badge>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>        {/* Main Content with Enhanced Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Stepper Component */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <UsulanStepperEdit 
              usulan={usulan} 
              onSubmit={handleSubmit} 
              loading={saving} 
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
