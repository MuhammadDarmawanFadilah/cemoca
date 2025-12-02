'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { getApiUrl } from '@/lib/config'
import UsulanStepperNew from '@/components/UsulanStepperNew'

interface FormData {
  judul: string;
  rencanaKegiatan: string;
  tanggalMulai: Date | null;
  tanggalSelesai: Date | null;
  durasiUsulan: Date | null;
  namaPengusul: string;
  emailPengusul: string;
  gambar: File | null;
}

export default function CreateUsulanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const formatDateToString = (date: Date | null): string => {
    if (!date) return ''
    return format(date, 'yyyy-MM-dd')
  }

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
    
    if (formData.tanggalMulai <= today) {
      toast.error('Tanggal mulai harus lebih dari hari ini', {
        duration: 5000,
        dismissible: true
      })
      return
    }
    
    if (formData.tanggalSelesai < today) {
      toast.error('Tanggal selesai tidak boleh kurang dari hari ini', {
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
    
    if (formData.durasiUsulan < today) {
      toast.error('Durasi usulan tidak boleh kurang dari hari ini', {
        dismissible: true,
        duration: 5000
      })
      return
    }
    
    if (!formData.namaPengusul.trim()) {
      toast.error('Nama pengusul tidak boleh kosong', {
        dismissible: true,
        duration: 5000
      })
      return
    }

    try {
      setLoading(true)
      
      const formDataToSend = new FormData()
      formDataToSend.append('judul', formData.judul)
      formDataToSend.append('rencanaKegiatan', formData.rencanaKegiatan)
      formDataToSend.append('tanggalMulai', formatDateToString(formData.tanggalMulai))
      formDataToSend.append('tanggalSelesai', formatDateToString(formData.tanggalSelesai))
      formDataToSend.append('durasiUsulan', formatDateToString(formData.durasiUsulan))
      formDataToSend.append('namaPengusul', formData.namaPengusul)
      formDataToSend.append('emailPengusul', formData.emailPengusul)
      
      if (formData.gambar) {
        formDataToSend.append('gambar', formData.gambar)
      }

      const response = await fetch(getApiUrl('/api/usulan'), {
        method: 'POST',
        body: formDataToSend
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create usulan')
      }

      const result = await response.json()
      toast.success('Usulan berhasil dibuat!', {
        dismissible: true,
        duration: 5000
      })
      router.push(`/usulan/${result.id}`)
    } catch (error: Error | unknown) {
      console.error('Error creating usulan:', error)
      const errorMessage = error instanceof Error ? error.message : 'Gagal membuat usulan'
      toast.error(errorMessage, {
        dismissible: true,
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 md:py-8">
        <UsulanStepperNew onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  )
}
