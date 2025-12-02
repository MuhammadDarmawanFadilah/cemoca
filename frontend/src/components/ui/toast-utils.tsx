"use client"

import { toast } from "sonner"
import { AlertCircle, XCircle, CheckCircle, Info } from "lucide-react"

interface ApiError {
  message: string
  type?: string
  status?: number
  details?: Record<string, any>
}

export const showErrorToast = (error: any) => {
  let message = "Terjadi kesalahan yang tidak diketahui"
  let title = "Error"
  
  if (error?.response?.data) {
    const apiError: ApiError = error.response.data
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
