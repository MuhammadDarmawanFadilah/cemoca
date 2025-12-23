"use client"

import { toast } from "sonner"
import { AlertCircle, XCircle, CheckCircle, Info } from "lucide-react"

interface ApiError {
  message: string
  type?: string
  status?: number
  details?: Record<string, any>
}

interface ImportErrorRow {
  rowNumber?: number
  column?: string
  message?: string
  rawValue?: string
}

interface ImportResultLike {
  success?: boolean
  errors?: ImportErrorRow[]
  createdCount?: number
  updatedCount?: number
}

function isImportResultLike(data: any): data is ImportResultLike {
  return !!data && typeof data === 'object' && Array.isArray((data as any).errors) && typeof (data as any).success === 'boolean'
}

function formatImportErrorsForToast(data: ImportResultLike) {
  const errors = data.errors || []
  const count = errors.length
  if (count === 0) return 'Import gagal'
  const first = errors[0] || {}
  const row = first.rowNumber ? `Baris ${first.rowNumber}` : 'Baris -'
  const col = first.column ? first.column : 'Kolom -'
  const msg = first.message ? first.message : 'Error'
  const raw = first.rawValue ? ` (Value: ${String(first.rawValue).slice(0, 120)})` : ''
  const more = count > 1 ? ` (+${count - 1} error lain)` : ''
  return `${row} • ${col} • ${msg}${raw}${more}`
}

export const showErrorToast = (error: any) => {
  let message = "Terjadi kesalahan yang tidak diketahui"
  let title = "Error"
  
  if (isImportResultLike(error)) {
    title = 'Import Gagal'
    message = formatImportErrorsForToast(error)
  } else if (isImportResultLike(error?.response?.data)) {
    title = 'Import Gagal'
    message = formatImportErrorsForToast(error.response.data)
  } else if (error?.response) {
    const status: number | undefined = error.response.status
    const data = error.response.data

    if (typeof data === 'string') {
      message = data || message
    } else if (data && typeof data === 'object') {
      const apiError: ApiError = data
      message = apiError.message || message

      // Customize title based on error type
      switch (apiError.type) {
        case "DUPLICATE_RESOURCE":
          title = "Data Sudah Ada"
          break
        case "RESOURCE_NOT_FOUND":
          title = "Data Tidak Ditemukan"
          break
        case "VALIDATION_ERROR":
          title = "Data Tidak Valid"
          break
        case "INTERNAL_ERROR":
          title = "Kesalahan Server"
          break
        default:
          title = "Error"
      }
    }

    if (title === 'Error' && typeof status === 'number') {
      if (status === 400) title = 'Data Tidak Valid'
      else if (status === 401) title = 'Tidak Diizinkan'
      else if (status === 403) title = 'Akses Ditolak'
      else if (status === 404) title = 'Data Tidak Ditemukan'
      else if (status >= 500) title = 'Kesalahan Server'
    }
  } else if (error?.message) {
    message = error.message
  } else if (typeof error === "string") {
    message = error
  }

  toast.error(title, {
    description: message,
    icon: <XCircle className="h-4 w-4" />,
    duration: parseInt(process.env.NEXT_PUBLIC_TOAST_ERROR_DURATION || '5000'),
  })
}

export const showSuccessToast = (message: string, title: string = "Berhasil") => {
  toast.success(title, {
    description: message,
    icon: <CheckCircle className="h-4 w-4" />,
    duration: parseInt(process.env.NEXT_PUBLIC_TOAST_SUCCESS_DURATION || '3000'),
  })
}

export const showInfoToast = (message: string, title: string = "Info") => {
  toast.info(title, {
    description: message,
    icon: <Info className="h-4 w-4" />,
    duration: parseInt(process.env.NEXT_PUBLIC_TOAST_INFO_DURATION || '4000'),
  })
}

export const showWarningToast = (message: string, title: string = "Peringatan") => {
  toast.warning(title, {
    description: message,
    icon: <AlertCircle className="h-4 w-4" />,
    duration: parseInt(process.env.NEXT_PUBLIC_TOAST_WARNING_DURATION || '4000'),
  })
}
