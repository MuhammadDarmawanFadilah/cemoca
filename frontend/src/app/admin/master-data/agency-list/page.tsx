
'use client'

import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { showErrorToast, showSuccessToast, showWarningToast } from "@/components/ui/toast-utils"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AdminPageHeader } from "@/components/AdminPageHeader"
import { ServerPagination } from "@/components/ServerPagination"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  masterDataAPI,
  type MasterAgencyAgentImportResult,
  type MasterAgencyAgentListFilters,
  type MasterAgencyAgentRequest,
  type MasterAgencyAgentResponse,
} from "@/lib/api"
import { getCompanyCodeFromLocalStorage, setCompanyProfileToLocalStorage } from "@/lib/companyProfileLocal"
import { useAuth } from "@/contexts/AuthContext"
import { Upload, Plus, MoreHorizontal, Edit, Trash2, Users, RefreshCcw, Code, Filter, ChevronDown, ChevronUp, FileSpreadsheet, FileDown } from "lucide-react"

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

function formatImportWarning(result: MasterAgencyAgentImportResult, fallback: string) {
  const count = result.errors?.length || 0
  if (count <= 0) return fallback

  const first = result.errors[0]
  const row = first?.rowNumber ? `Baris ${first.rowNumber}` : `Baris -`
  const col = first?.column ? `${first.column}` : `Kolom -`
  const msg = first?.message ? `${first.message}` : `Error`
  const raw = first?.rawValue ? ` (Value: ${String(first.rawValue).slice(0, 120)})` : ``
  const more = count > 1 ? ` (+${count - 1} error lain)` : ``
  return `${row} • ${col} • ${msg}${raw}${more}`
}

export default function AgencyListPage() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [mounted, setMounted] = useState(false)
  const [tableLoading, setTableLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const busy = tableLoading || actionLoading

  const isAdminOnly = user?.role?.roleName === 'ADMIN'

  const [items, setItems] = useState<MasterAgencyAgentResponse[]>([])

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [draftFullName, setDraftFullName] = useState('')
  const [draftRankCode, setDraftRankCode] = useState('')
  const [draftPhoneNo, setDraftPhoneNo] = useState('')
  const [draftCreatedBy, setDraftCreatedBy] = useState('')
  const [draftStatus, setDraftStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  const [appliedFullName, setAppliedFullName] = useState('')
  const [appliedRankCode, setAppliedRankCode] = useState('')
  const [appliedPhoneNo, setAppliedPhoneNo] = useState('')
  const [appliedCreatedBy, setAppliedCreatedBy] = useState('')
  const [appliedIsActive, setAppliedIsActive] = useState<boolean | undefined>(undefined)

  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isToggleOpen, setIsToggleOpen] = useState(false)
  const [selected, setSelected] = useState<MasterAgencyAgentResponse | null>(null)

  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const importFileInputRef = useRef<HTMLInputElement | null>(null)
  const [importResult, setImportResult] = useState<MasterAgencyAgentImportResult | null>(null)
  const [importCompanyCode, setImportCompanyCode] = useState("")
  const [importRemoveExisting, setImportRemoveExisting] = useState(false)
  const [isConfirmExcelReplaceOpen, setIsConfirmExcelReplaceOpen] = useState(false)

  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const csvFileInputRef = useRef<HTMLInputElement | null>(null)
  const [csvImportResult, setCsvImportResult] = useState<MasterAgencyAgentImportResult | null>(null)
  const [csvCompanyCode, setCsvCompanyCode] = useState("")
  const [csvRemoveExisting, setCsvRemoveExisting] = useState(false)
  const [isConfirmCsvReplaceOpen, setIsConfirmCsvReplaceOpen] = useState(false)

  const [isApiImportOpen, setIsApiImportOpen] = useState(false)
  const [apiCompanyCode, setApiCompanyCode] = useState("")
  const [apiJson, setApiJson] = useState("")
  const [apiImportResult, setApiImportResult] = useState<MasterAgencyAgentImportResult | null>(null)

  const [companyCode, setCompanyCode] = useState("")

  const [formData, setFormData] = useState<MasterAgencyAgentRequest>({
    agentCode: "",
    fullName: "",
    phoneNo: "",
    rankCode: "",
    rankTitle: "",
    shortName: "",
    birthday: undefined,
    gender: undefined,
    genderTitle: "",
    appointmentDate: undefined,
    isActive: true,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const cc = getCompanyCodeFromLocalStorage(userId)
    setCompanyCode(cc)
    setApiCompanyCode(cc)
  }, [mounted, userId])

  useEffect(() => {
    if (mounted) void loadData()
  }, [mounted, currentPage, pageSize, appliedFullName, appliedRankCode, appliedPhoneNo, appliedCreatedBy, appliedIsActive, companyCode])

  const loadData = async () => {
    const cc = isAdminOnly ? '' : (companyCode || getCompanyCodeFromLocalStorage(userId)).trim()
    
    if (!isAdminOnly && !cc) {
      setItems([])
      setTotalElements(0)
      setTotalPages(0)
      return
    }

    try {
      setTableLoading(true)
      const filters: MasterAgencyAgentListFilters = {
        fullName: appliedFullName || undefined,
        rankCode: appliedRankCode || undefined,
        phoneNo: appliedPhoneNo || undefined,
        createdBy: appliedCreatedBy || undefined,
        isActive: appliedIsActive,
      }

      const res = await masterDataAPI.agencyList.getAll(cc || undefined, filters, undefined, currentPage, pageSize, "createdAt", "desc")

      setItems(res.content || [])
      setTotalElements(res.totalElements || 0)
      setTotalPages(res.totalPages || 0)

      if ((res.totalPages ?? 0) > 0 && currentPage > (res.totalPages ?? 0) - 1) {
        setCurrentPage(0)
      }
    } catch (e) {
      showErrorToast(e)
    } finally {
      setTableLoading(false)
    }
  }

  const onSearch = (e?: FormEvent) => {
    e?.preventDefault()
    setAppliedFullName(draftFullName.trim())
    setAppliedRankCode(draftRankCode.trim())
    setAppliedPhoneNo(draftPhoneNo.trim())
    setAppliedCreatedBy(draftCreatedBy.trim())
    setAppliedIsActive(draftStatus === 'ALL' ? undefined : (draftStatus === 'ACTIVE'))
    setCurrentPage(0)
  }

  const onReset = () => {
    setDraftFullName('')
    setDraftRankCode('')
    setDraftPhoneNo('')
    setDraftCreatedBy('')
    setDraftStatus('ALL')
    setAppliedFullName('')
    setAppliedRankCode('')
    setAppliedPhoneNo('')
    setAppliedCreatedBy('')
    setAppliedIsActive(undefined)
    setCurrentPage(0)
  }

  const activeFilterCount =
    (appliedFullName ? 1 : 0) +
    (appliedRankCode ? 1 : 0) +
    (appliedPhoneNo ? 1 : 0) +
    (appliedCreatedBy ? 1 : 0) +
    (appliedIsActive !== undefined ? 1 : 0)

  const resetForm = () => {
    setSelected(null)
    setFormData({
      agentCode: "",
      fullName: "",
      phoneNo: "",
      rankCode: "",
      rankTitle: "",
      shortName: "",
      birthday: undefined,
      gender: undefined,
      genderTitle: "",
      appointmentDate: undefined,
      isActive: true,
    })
  }

  const openCreate = () => {
    resetForm()
    setIsCreateOpen(true)
  }

  const openEdit = (item: MasterAgencyAgentResponse) => {
    setSelected(item)
    if (isAdminOnly && item.companyCode) {
      setCompanyCode(item.companyCode)
    }
    setFormData({
      agentCode: item.agentCode,
      fullName: item.fullName,
      shortName: item.shortName || "",
      birthday: item.birthday || undefined,
      gender: item.gender || undefined,
      genderTitle: item.genderTitle || "",
      phoneNo: item.phoneNo,
      rankCode: item.rankCode,
      rankTitle: item.rankTitle || "",
      appointmentDate: item.appointmentDate || undefined,
      isActive: item.isActive,
    })
    setIsEditOpen(true)
  }

  const openDelete = (item: MasterAgencyAgentResponse) => {
    setSelected(item)
    setIsDeleteOpen(true)
  }

  const openToggle = (item: MasterAgencyAgentResponse) => {
    setSelected(item)
    setIsToggleOpen(true)
  }

  const validateForm = () => {
    if (!formData.agentCode?.trim()) return "Agent Code harus diisi"
    if (!formData.fullName?.trim()) return "Full Name harus diisi"
    if (!formData.phoneNo?.trim()) return "Phone no harus diisi"
    if (!formData.rankCode?.trim()) return "Rank Code harus diisi"
    if (!formData.rankTitle?.trim()) return "Rank Full Title harus diisi"
    if (!formData.gender) return "Gender harus dipilih"
    return null
  }

  const submitCreate = async () => {
    const cc = (companyCode || getCompanyCodeFromLocalStorage(userId)).trim()
    if (!cc) {
      showErrorToast(isAdminOnly ? "Company Code wajib diisi" : "Company Code wajib diisi (Profile)")
      return
    }

    const err = validateForm()
    if (err) {
      showErrorToast(err)
      return
    }

    try {
      setActionLoading(true)
      await masterDataAPI.agencyList.create(cc, {
        ...formData,
        agentCode: formData.agentCode.trim(),
        fullName: formData.fullName.trim(),
        phoneNo: formData.phoneNo.trim(),
        rankCode: formData.rankCode.trim(),
        rankTitle: formData.rankTitle.trim(),
        shortName: formData.shortName?.trim() || undefined,
        genderTitle: formData.genderTitle?.trim() || undefined,
        birthday: formData.birthday || undefined,
        appointmentDate: formData.appointmentDate || undefined,
      })
      showSuccessToast('Agent berhasil ditambahkan')
      setIsCreateOpen(false)
      resetForm()
      await loadData()
    } catch (e) {
      showErrorToast(e)
    } finally {
      setActionLoading(false)
    }
  }

  const submitEdit = async () => {
    if (!selected) return

    const cc = (companyCode || getCompanyCodeFromLocalStorage(userId)).trim()
    if (!cc) {
      showErrorToast(isAdminOnly ? "Company Code wajib diisi" : "Company Code wajib diisi (Profile)")
      return
    }

    const err = validateForm()
    if (err) {
      showErrorToast(err)
      return
    }

    try {
      setActionLoading(true)
      await masterDataAPI.agencyList.update(cc, selected.id, {
        ...formData,
        agentCode: formData.agentCode.trim(),
        fullName: formData.fullName.trim(),
        phoneNo: formData.phoneNo.trim(),
        rankCode: formData.rankCode.trim(),
        rankTitle: formData.rankTitle.trim(),
        shortName: formData.shortName?.trim() || undefined,
        genderTitle: formData.genderTitle?.trim() || undefined,
        birthday: formData.birthday || undefined,
        appointmentDate: formData.appointmentDate || undefined,
      })
      showSuccessToast('Agent berhasil diperbarui')
      setIsEditOpen(false)
      resetForm()
      await loadData()
    } catch (e) {
      showErrorToast(e)
    } finally {
      setActionLoading(false)
    }
  }

  const submitDelete = async () => {
    if (!selected) return

    const cc = (companyCode || getCompanyCodeFromLocalStorage(userId)).trim()
    if (!cc) {
      showErrorToast("Company Code wajib diisi (Profile)")
      return
    }

    try {
      setActionLoading(true)
      await masterDataAPI.agencyList.delete(cc, selected.id)
      showSuccessToast('Agent berhasil dihapus')
      setIsDeleteOpen(false)
      setSelected(null)
      await loadData()
    } catch (e) {
      showErrorToast(e)
    } finally {
      setActionLoading(false)
    }
  }

  const submitToggle = async () => {
    if (!selected) return

    const cc = (companyCode || getCompanyCodeFromLocalStorage(userId)).trim()
    if (!cc) {
      showErrorToast("Company Code wajib diisi (Profile)")
      return
    }

    try {
      setActionLoading(true)
      await masterDataAPI.agencyList.toggleActive(cc, selected.id)
      showSuccessToast(`Status agent berhasil ${selected.isActive ? 'dinonaktifkan' : 'diaktifkan'}`)
      setIsToggleOpen(false)
      await loadData()
    } catch (e) {
      showErrorToast(e)
    } finally {
      setActionLoading(false)
    }
  }

  const submitImportInternal = async () => {
    const selectedFile = importFile ?? importFileInputRef.current?.files?.[0] ?? null
    if (!selectedFile) {
      showErrorToast("File Excel harus dipilih")
      return
    }

    const cc = (importCompanyCode || "").trim()
    if (!cc) {
      showErrorToast("Company Code wajib diisi")
      return
    }

    try {
      setActionLoading(true)
      setImportResult(null)
      if (importFile !== selectedFile) {
        setImportFile(selectedFile)
      }
      const res = await masterDataAPI.agencyList.importExcel(cc, selectedFile, importRemoveExisting)
      setImportResult(res)
      if (res.success && (!res.errors || res.errors.length === 0)) {
        showSuccessToast(`Import berhasil (created: ${res.createdCount}, updated: ${res.updatedCount})`)
      } else {
        showWarningToast(formatImportWarning(res, "Import Excel gagal"), "Import Excel")
      }
      if (res.success) {
        persistCompanyCode(cc)
      }
      await loadData()
    } catch (e) {
      showErrorToast(e)
    } finally {
      setActionLoading(false)
    }
  }

  const submitImport = async () => {
    const selectedFile = importFile ?? importFileInputRef.current?.files?.[0] ?? null
    if (!selectedFile) {
      showErrorToast("File Excel harus dipilih")
      return
    }
    if (importRemoveExisting) {
      setIsConfirmExcelReplaceOpen(true)
      return
    }
    await submitImportInternal()
  }

  const submitCsvImportInternal = async () => {
    const selectedFile = csvFile ?? csvFileInputRef.current?.files?.[0] ?? null
    if (!selectedFile) {
      showErrorToast("File CSV harus dipilih")
      return
    }

    const cc = (csvCompanyCode || "").trim()
    if (!cc) {
      showErrorToast("Company Code wajib diisi")
      return
    }

    try {
      setActionLoading(true)
      setCsvImportResult(null)
      if (csvFile !== selectedFile) {
        setCsvFile(selectedFile)
      }
      const res = await masterDataAPI.agencyList.importCsv(cc, selectedFile, csvRemoveExisting)
      setCsvImportResult(res)
      if (res.success && (!res.errors || res.errors.length === 0)) {
        showSuccessToast(`Import CSV berhasil (created: ${res.createdCount}, updated: ${res.updatedCount})`)
      } else {
        showWarningToast(formatImportWarning(res, "Import CSV gagal"), "Import CSV")
      }
      if (res.success) {
        persistCompanyCode(cc)
      }
      await loadData()
    } catch (e) {
      showErrorToast(e)
    } finally {
      setActionLoading(false)
    }
  }

  const submitCsvImport = async () => {
    const selectedFile = csvFile ?? csvFileInputRef.current?.files?.[0] ?? null
    if (!selectedFile) {
      showErrorToast("File CSV harus dipilih")
      return
    }
    if (csvRemoveExisting) {
      setIsConfirmCsvReplaceOpen(true)
      return
    }
    await submitCsvImportInternal()
  }

  const resetImport = () => {
    setImportFile(null)
    setImportResult(null)
    setImportRemoveExisting(false)
    setIsConfirmExcelReplaceOpen(false)
    if (importFileInputRef.current) {
      importFileInputRef.current.value = ""
    }
  }

  const persistCompanyCode = (cc: string) => {
    const trimmed = (cc || "").trim()
    if (!trimmed) return
    setCompanyCode(trimmed)
    setApiCompanyCode(trimmed)
    setCompanyProfileToLocalStorage({ companyCode: trimmed }, userId)
    setCompanyProfileToLocalStorage({ companyCode: trimmed })
  }

  const openExcelImport = () => {
    const cc = getCompanyCodeFromLocalStorage(userId)
    setImportCompanyCode(cc)
    resetImport()
    setIsImportOpen(true)
  }

  const resetCsvImport = () => {
    setCsvFile(null)
    setCsvImportResult(null)
    setCsvRemoveExisting(false)
    setIsConfirmCsvReplaceOpen(false)
    if (csvFileInputRef.current) {
      csvFileInputRef.current.value = ""
    }
  }

  const openCsvImport = () => {
    const cc = getCompanyCodeFromLocalStorage(userId)
    setCsvCompanyCode(cc)
    resetCsvImport()
    setIsCsvImportOpen(true)
  }

  const downloadTemplate = async (kind: 'excel' | 'csv') => {
    try {
      setActionLoading(true)
      const token = localStorage.getItem('auth_token')
      const url = kind === 'excel'
        ? masterDataAPI.agencyList.getTemplateExcelUrl()
        : masterDataAPI.agencyList.getTemplateCsvUrl()

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      })

      if (!response.ok) {
        throw new Error('Gagal download template')
      }

      const blob = await response.blob()
      const disposition = response.headers.get('content-disposition') || ''
      const m = /filename="?([^";]+)"?/i.exec(disposition)
      const filename = m?.[1] || (kind === 'excel' ? 'agency_list_template.xlsx' : 'agency_list_template.csv')

      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(blobUrl)
      document.body.removeChild(a)
    } catch (e) {
      showErrorToast(e)
    } finally {
      setActionLoading(false)
    }
  }

  const resetApiImport = () => {
    setApiJson("")
    setApiImportResult(null)
  }

  const openApiImport = () => {
    const cc = getCompanyCodeFromLocalStorage(userId)
    setCompanyCode(cc)
    setApiCompanyCode(cc)
    resetApiImport()
    setIsApiImportOpen(true)
  }

  const submitApiImport = async () => {
    const fallbackCompanyCode = (apiCompanyCode || "").trim()
    if (!fallbackCompanyCode && !apiJson.trim()) {
      showErrorToast("Company Code wajib diisi")
      return
    }

    const fallbackRemoveExisting = false

    let items: MasterAgencyAgentRequest[] = []
    let companyCode = fallbackCompanyCode
    let removeExisting = fallbackRemoveExisting

    try {
      const parsed = JSON.parse(apiJson || "") as unknown
      if (Array.isArray(parsed)) {
        items = parsed as MasterAgencyAgentRequest[]
      } else if (parsed && typeof parsed === 'object') {
        const obj = parsed as any
        const cc = String(obj.companyCode ?? obj.company_code ?? "").trim()
        if (cc) companyCode = cc

        const re = obj.removeExisting ?? obj.remove_existing
        if (typeof re === 'boolean') {
          removeExisting = re
        } else if (typeof re === 'string') {
          const v = re.trim().toLowerCase()
          if (v === 'true') removeExisting = true
          if (v === 'false') removeExisting = false
        }

        const data = obj.items ?? obj.data
        if (Array.isArray(data)) {
          items = data as MasterAgencyAgentRequest[]
        } else {
          showErrorToast("Format JSON tidak valid. Gunakan { company_code, remove_existing, items: [] }")
          return
        }
      } else {
        showErrorToast("Format JSON tidak valid")
        return
      }
    } catch {
      showErrorToast("JSON tidak valid")
      return
    }

    if (!companyCode) {
      showErrorToast("Company Code wajib diisi")
      return
    }

    if (!items || items.length === 0) {
      showErrorToast("Items kosong")
      return
    }

    try {
      setActionLoading(true)
      setApiImportResult(null)
      const res = await masterDataAPI.agencyList.importApi(companyCode, items, undefined, removeExisting)
      setApiImportResult(res)
      if (res.success && (!res.errors || res.errors.length === 0)) {
        showSuccessToast(`Import API berhasil (created: ${res.createdCount}, updated: ${res.updatedCount})`)
      } else {
        showWarningToast(formatImportWarning(res, "Import API gagal"), "Import API")
      }
      if (res.success) {
        persistCompanyCode(companyCode)
      }
      await loadData()
    } catch (e) {
      showErrorToast(e)
    } finally {
      setActionLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-muted-foreground">Memuat halaman...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mx-auto w-full max-w-6xl space-y-4 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold md:text-2xl">Agency List</h1>
              <p className="text-sm text-muted-foreground">Master Data Agency List</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Tambah Agent
            </Button>
            <Button
              variant="outline"
              onClick={() => openExcelImport()}
            >
              <Upload className="h-4 w-4" />
              Import Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => openCsvImport()}
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => openApiImport()}
            >
              <Code className="h-4 w-4" />
              Import API
            </Button>
            <Button variant="outline" onClick={() => void loadData()}>
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Daftar Agent</CardTitle>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 ? (
                  <Badge variant="secondary" className="w-fit">{activeFilterCount} filter aktif</Badge>
                ) : null}
                <Button type="button" variant="outline" size="sm" onClick={() => setFiltersOpen((v) => !v)}>
                  <Filter className="h-4 w-4" />
                  {filtersOpen ? "Sembunyikan filter" : "Tampilkan filter"}
                  {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isAdminOnly && !companyCode.trim() && (
              <div className="rounded-md border bg-muted/20 px-4 py-3 text-sm font-semibold text-foreground">
                Company Code belum diisi. Silakan isi di <a className="underline" href="/profile">Profile</a> agar data Agency List bisa ditampilkan.
              </div>
            )}

            <div className="flex items-center justify-between">
              <Badge variant="secondary">{totalElements} data</Badge>
            </div>

            {filtersOpen ? (
              <Card className="border-dashed">
                <CardContent className="pt-4">
                  <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" onSubmit={onSearch}>
                    <div className="space-y-1">
                      <div className="text-[11px] text-muted-foreground">Full Name</div>
                      <Input
                        placeholder="Cari full name..."
                        value={draftFullName}
                        onChange={(e) => setDraftFullName(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-muted-foreground">Rank (Code)</div>
                      <Input
                        placeholder="Cari rank code..."
                        value={draftRankCode}
                        onChange={(e) => setDraftRankCode(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-muted-foreground">Phone no</div>
                      <Input
                        placeholder="Cari phone..."
                        value={draftPhoneNo}
                        onChange={(e) => setDraftPhoneNo(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-muted-foreground">Created By</div>
                      <Input
                        placeholder="Cari created by..."
                        value={draftCreatedBy}
                        onChange={(e) => setDraftCreatedBy(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-muted-foreground">Status</div>
                      <Select value={draftStatus} onValueChange={(v) => setDraftStatus(v as 'ALL' | 'ACTIVE' | 'INACTIVE')}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Semua</SelectItem>
                          <SelectItem value="ACTIVE">Aktif</SelectItem>
                          <SelectItem value="INACTIVE">Nonaktif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end justify-end gap-2 sm:col-span-2 lg:col-span-5">
                      <Button type="submit" size="sm" className="w-full sm:w-auto">
                        Search
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={onReset}>
                        Reset
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : null}

            {tableLoading ? (
              <div className="py-10">
                <LoadingSpinner text="Memuat data..." />
              </div>
            ) : (
              <div className="rounded-md border bg-background">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent Code</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Rank (Code)</TableHead>
                      <TableHead>Phone no</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                          Tidak ada data
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs">{item.agentCode}</TableCell>
                          <TableCell className="font-medium">{item.fullName}</TableCell>
                          <TableCell>
                            <div className="font-medium">{item.rankCode}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[260px]">{item.rankTitle || '-'}</div>
                          </TableCell>
                          <TableCell>{item.phoneNo}</TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{item.createdBy || '-'}</div>
                            <div className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.isActive ? "default" : "destructive"}>
                              {item.isActive ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(item)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openToggle(item)}>
                                  <RefreshCcw className="h-4 w-4 mr-2" />
                                  {item.isActive ? "Nonaktifkan" : "Aktifkan"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => openDelete(item)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            <ServerPagination
              currentPage={currentPage}
              totalPages={Math.max(totalPages, 1)}
              totalElements={totalElements}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(0) }}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Tambah Agent</DialogTitle>
            <DialogDescription>Input manual agent</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isAdminOnly && (
              <div className="space-y-2 md:col-span-2">
                <Label>Company Code <span className="text-destructive">*</span></Label>
                <Input 
                  value={companyCode} 
                  onChange={(e) => setCompanyCode(e.target.value)} 
                  placeholder="Masukkan Company Code"
                />
                <div className="text-xs text-muted-foreground">Wajib diisi untuk ADMIN. Tentukan company mana yang akan ditambahkan agent.</div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Agent Code</Label>
              <Input value={formData.agentCode || ''} onChange={(e) => setFormData((p) => ({ ...p, agentCode: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={formData.fullName || ''} onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Phone no</Label>
              <Input value={formData.phoneNo || ''} onChange={(e) => setFormData((p) => ({ ...p, phoneNo: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Rank Code</Label>
              <Input value={formData.rankCode || ''} onChange={(e) => setFormData((p) => ({ ...p, rankCode: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Rank Full Title</Label>
              <Input value={formData.rankTitle || ''} onChange={(e) => setFormData((p) => ({ ...p, rankTitle: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Short Name</Label>
              <Input value={formData.shortName || ''} onChange={(e) => setFormData((p) => ({ ...p, shortName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Birthday</Label>
              <Input
                type="date"
                value={formData.birthday || ''}
                onChange={(e) => setFormData((p) => ({ ...p, birthday: e.target.value || undefined }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select
                value={formData.gender || ''}
                onValueChange={(v) => setFormData((p) => ({ ...p, gender: (v === 'MALE' || v === 'FEMALE') ? v : undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gender Title</Label>
              <Input value={formData.genderTitle || ''} onChange={(e) => setFormData((p) => ({ ...p, genderTitle: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Appointment Date</Label>
              <Input
                type="date"
                value={formData.appointmentDate || ''}
                onChange={(e) => setFormData((p) => ({ ...p, appointmentDate: e.target.value || undefined }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border px-4 py-2 md:col-span-2">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Aktif</div>
                <div className="text-xs text-muted-foreground">Status agent</div>
              </div>
              <Switch
                checked={formData.isActive !== false}
                onCheckedChange={(checked) => setFormData((p) => ({ ...p, isActive: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={actionLoading}>Batal</Button>
            <Button onClick={() => void submitCreate()} disabled={actionLoading}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
            <DialogDescription>Perbarui data agent</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isAdminOnly && (
              <div className="space-y-2 md:col-span-2">
                <Label>Company Code <span className="text-destructive">*</span></Label>
                <Input 
                  value={companyCode} 
                  onChange={(e) => setCompanyCode(e.target.value)} 
                  placeholder="Masukkan Company Code"
                  disabled
                />
                <div className="text-xs text-muted-foreground">Company Code tidak bisa diubah saat edit.</div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Agent Code</Label>
              <Input value={formData.agentCode || ''} onChange={(e) => setFormData((p) => ({ ...p, agentCode: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={formData.fullName || ''} onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Phone no</Label>
              <Input value={formData.phoneNo || ''} onChange={(e) => setFormData((p) => ({ ...p, phoneNo: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Rank Code</Label>
              <Input value={formData.rankCode || ''} onChange={(e) => setFormData((p) => ({ ...p, rankCode: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Rank Full Title</Label>
              <Input value={formData.rankTitle || ''} onChange={(e) => setFormData((p) => ({ ...p, rankTitle: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Short Name</Label>
              <Input value={formData.shortName || ''} onChange={(e) => setFormData((p) => ({ ...p, shortName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Birthday</Label>
              <Input
                type="date"
                value={formData.birthday || ''}
                onChange={(e) => setFormData((p) => ({ ...p, birthday: e.target.value || undefined }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select
                value={formData.gender || ''}
                onValueChange={(v) => setFormData((p) => ({ ...p, gender: (v === 'MALE' || v === 'FEMALE') ? v : undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gender Title</Label>
              <Input value={formData.genderTitle || ''} onChange={(e) => setFormData((p) => ({ ...p, genderTitle: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Appointment Date</Label>
              <Input
                type="date"
                value={formData.appointmentDate || ''}
                onChange={(e) => setFormData((p) => ({ ...p, appointmentDate: e.target.value || undefined }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border px-4 py-2 md:col-span-2">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Aktif</div>
                <div className="text-xs text-muted-foreground">Status agent</div>
              </div>
              <Switch
                checked={formData.isActive !== false}
                onCheckedChange={(checked) => setFormData((p) => ({ ...p, isActive: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={actionLoading}>Batal</Button>
            <Button onClick={() => void submitEdit()} disabled={actionLoading}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open)
          if (!open) setSelected(null)
        }}
        title="Hapus Agent"
        description={`Hapus agent: ${selected?.fullName || '-'}?`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
        onConfirm={() => {
          setIsDeleteOpen(false)
          setSelected(null)
          void submitDelete()
        }}
        onCancel={() => {
          setIsDeleteOpen(false)
          setSelected(null)
        }}
        loading={actionLoading}
      />

      <ConfirmationDialog
        open={isToggleOpen}
        onOpenChange={(open) => {
          setIsToggleOpen(open)
          if (!open) setSelected(null)
        }}
        title="Ubah Status"
        description={`Ubah status agent: ${selected?.fullName || '-'}?`}
        confirmText="Konfirmasi"
        cancelText="Batal"
        variant="toggle"
        onConfirm={() => {
          setIsToggleOpen(false)
          setSelected(null)
          void submitToggle()
        }}
        onCancel={() => {
          setIsToggleOpen(false)
          setSelected(null)
        }}
        loading={actionLoading}
      />

      <ConfirmationDialog
        open={isConfirmExcelReplaceOpen}
        onOpenChange={setIsConfirmExcelReplaceOpen}
        title="Hapus Data & Timpa (Excel)"
        description="Apakah anda yakin untuk menghapus data sekarang? Data tidak dapat dikembalikan."
        confirmText="Ya, hapus dan timpa"
        cancelText="Batal"
        variant="destructive"
        onConfirm={() => {
          setIsConfirmExcelReplaceOpen(false)
          void submitImportInternal()
        }}
        onCancel={() => setIsConfirmExcelReplaceOpen(false)}
        loading={actionLoading}
      />

      <ConfirmationDialog
        open={isConfirmCsvReplaceOpen}
        onOpenChange={setIsConfirmCsvReplaceOpen}
        title="Hapus Data & Timpa (CSV)"
        description="Apakah anda yakin untuk menghapus data sekarang? Data tidak dapat dikembalikan."
        confirmText="Ya, hapus dan timpa"
        cancelText="Batal"
        variant="destructive"
        onConfirm={() => {
          setIsConfirmCsvReplaceOpen(false)
          void submitCsvImportInternal()
        }}
        onCancel={() => setIsConfirmCsvReplaceOpen(false)}
        loading={actionLoading}
      />

      <Dialog
        open={isImportOpen}
        onOpenChange={(o) => {
          if (!o && isConfirmExcelReplaceOpen) {
            return
          }
          setIsImportOpen(o)
          if (!o) {
            setIsConfirmExcelReplaceOpen(false)
            resetImport()
          }
        }}
      >
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Import Excel</DialogTitle>
            <DialogDescription>Upload file Excel Agency List.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Company Code <span className="text-destructive">*</span></Label>
                <Input value={importCompanyCode} onChange={(e) => setImportCompanyCode(e.target.value)} placeholder="Masukkan Company Code" />
                <div className="text-xs text-muted-foreground">
                  {isAdminOnly ? 'Wajib diisi oleh ADMIN. Tentukan company mana yang akan di-import.' : 'Wajib diisi. Otomatis terisi dari profile Anda.'}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Template</Label>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => void downloadTemplate('excel')} disabled={actionLoading}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Download Template Excel
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">Gunakan template agar kolom sesuai.</div>
              </div>
            </div>

            <div className="flex items-start space-x-2 rounded-md border p-3">
              <Checkbox
                id="excel-remove-existing"
                checked={importRemoveExisting}
                onCheckedChange={(checked) => setImportRemoveExisting(Boolean(checked))}
              />
              <Label htmlFor="excel-remove-existing" className="text-sm font-normal cursor-pointer leading-relaxed">
                Remove existing (hapus semua data lama berdasarkan Company Code lalu timpa dengan data baru)
              </Label>
            </div>

            <div className="flex flex-col md:flex-row gap-3 md:items-end">
              <div className="flex-1 space-y-2">
                <Label>File</Label>
                <Input
                  ref={importFileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null
                    setImportFile(f)
                    setImportResult(null)
                  }}
                />
                {importFile && (
                  <div className="text-xs text-muted-foreground">Dipilih: {importFile.name}</div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => resetImport()} disabled={actionLoading}>Reset</Button>
                <Button onClick={() => void submitImport()} disabled={actionLoading || (!importFile && !(importFileInputRef.current?.files?.[0])) || !importCompanyCode.trim()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>

            {importResult && (
              <div className="rounded-md border bg-muted/20 p-4 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={importResult.success ? "default" : "destructive"}>
                    {importResult.success ? "SUCCESS" : "FAILED"}
                  </Badge>
                  <Badge variant="secondary">Created: {importResult.createdCount}</Badge>
                  <Badge variant="secondary">Updated: {importResult.updatedCount}</Badge>
                  <Badge variant={importResult.errors?.length ? "destructive" : "secondary"}>
                    Errors: {importResult.errors?.length || 0}
                  </Badge>
                </div>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="rounded-md border bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">Row</TableHead>
                          <TableHead className="w-[180px]">Column</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Raw Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.errors.map((er, idx) => (
                          <TableRow key={`${er.rowNumber}-${er.column}-${idx}`}>
                            <TableCell>{er.rowNumber}</TableCell>
                            <TableCell>{er.column}</TableCell>
                            <TableCell>{er.message}</TableCell>
                            <TableCell className="max-w-[300px] truncate">{er.rawValue || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)} disabled={actionLoading}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCsvImportOpen}
        onOpenChange={(o) => {
          if (!o && isConfirmCsvReplaceOpen) {
            return
          }
          setIsCsvImportOpen(o)
          if (!o) {
            setIsConfirmCsvReplaceOpen(false)
            resetCsvImport()
          }
        }}
      >
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Import CSV</DialogTitle>
            <DialogDescription>Upload file CSV Agency List.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Company Code <span className="text-destructive">*</span></Label>
                <Input value={csvCompanyCode} onChange={(e) => setCsvCompanyCode(e.target.value)} placeholder="Masukkan Company Code" />
                <div className="text-xs text-muted-foreground">
                  {isAdminOnly ? 'Wajib diisi oleh ADMIN. Tentukan company mana yang akan di-import.' : 'Wajib diisi. Otomatis terisi dari profile Anda.'}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Template</Label>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => void downloadTemplate('csv')} disabled={actionLoading}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Download Template CSV
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">Gunakan template agar kolom sesuai.</div>
              </div>
            </div>

            <div className="flex items-start space-x-2 rounded-md border p-3">
              <Checkbox
                id="csv-remove-existing"
                checked={csvRemoveExisting}
                onCheckedChange={(checked) => setCsvRemoveExisting(Boolean(checked))}
              />
              <Label htmlFor="csv-remove-existing" className="text-sm font-normal cursor-pointer leading-relaxed">
                Remove existing (hapus semua data lama berdasarkan Company Code lalu timpa dengan data baru)
              </Label>
            </div>

            <div className="flex flex-col md:flex-row gap-3 md:items-end">
              <div className="flex-1 space-y-2">
                <Label>File</Label>
                <Input
                  ref={csvFileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null
                    setCsvFile(f)
                    setCsvImportResult(null)
                  }}
                />
                {csvFile && (
                  <div className="text-xs text-muted-foreground">Dipilih: {csvFile.name}</div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => resetCsvImport()} disabled={actionLoading}>Reset</Button>
                <Button onClick={() => void submitCsvImport()} disabled={actionLoading || (!csvFile && !(csvFileInputRef.current?.files?.[0])) || !csvCompanyCode.trim()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>

            {csvImportResult && (
              <div className="rounded-md border bg-muted/20 p-4 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={csvImportResult.success ? "default" : "destructive"}>
                    {csvImportResult.success ? "SUCCESS" : "FAILED"}
                  </Badge>
                  <Badge variant="secondary">Created: {csvImportResult.createdCount}</Badge>
                  <Badge variant="secondary">Updated: {csvImportResult.updatedCount}</Badge>
                  <Badge variant={csvImportResult.errors?.length ? "destructive" : "secondary"}>
                    Errors: {csvImportResult.errors?.length || 0}
                  </Badge>
                </div>

                {csvImportResult.errors && csvImportResult.errors.length > 0 && (
                  <div className="rounded-md border bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">Row</TableHead>
                          <TableHead className="w-[180px]">Column</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Raw Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvImportResult.errors.map((er, idx) => (
                          <TableRow key={`${er.rowNumber}-${er.column}-${idx}`}>
                            <TableCell>{er.rowNumber}</TableCell>
                            <TableCell>{er.column}</TableCell>
                            <TableCell>{er.message}</TableCell>
                            <TableCell className="max-w-[300px] truncate">{er.rawValue || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCsvImportOpen(false)} disabled={actionLoading}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isApiImportOpen} onOpenChange={(o) => { setIsApiImportOpen(o); if (!o) resetApiImport() }}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Import API</DialogTitle>
            <DialogDescription>Import Agency List dari API (JSON).</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
              <div className="space-y-2">
                <Label>Company Code <span className="text-destructive">*</span></Label>
                <Input value={apiCompanyCode} onChange={(e) => setApiCompanyCode(e.target.value)} placeholder="Masukkan Company Code" />
                <div className="text-xs text-muted-foreground">
                  {isAdminOnly ? 'Wajib diisi oleh ADMIN. Tentukan company mana yang akan di-import (bisa juga di JSON payload).' : 'Wajib. Otomatis terisi dari profile Anda (bisa override di JSON payload).'}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Items JSON</Label>
              <Textarea
                value={apiJson}
                onChange={(e) => setApiJson(e.target.value)}
                placeholder={
                  `{\n  "company_code": "PTABHIMAB936B8",\n  "remove_existing": false,\n  "items": [\n    {\n      "agent_code": "AG-001",\n      "full_name": "Darwin Gunawan",\n      "short_name": "Darwin",\n      "birthday": "1982-12-02",\n      "gender": "Male",\n      "gender_title": "Pak",\n      "phone_no": "+62816964085",\n      "rank_code": "AGT",\n      "rank_title": "Agent",\n      "appointment_date": "2025-11-01",\n      "is_active": true\n    }\n  ]\n}`
                }
                className="min-h-[220px] font-mono text-xs"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => resetApiImport()} disabled={actionLoading}>Reset</Button>
              <Button onClick={() => void submitApiImport()} disabled={actionLoading || !apiJson.trim() || !apiCompanyCode.trim()}>
                <Code className="h-4 w-4 mr-2" />
                Submit
              </Button>
            </div>

            {apiImportResult && (
              <div className="rounded-md border bg-muted/20 p-4 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={apiImportResult.success ? "default" : "destructive"}>
                    {apiImportResult.success ? "SUCCESS" : "FAILED"}
                  </Badge>
                  <Badge variant="secondary">Created: {apiImportResult.createdCount}</Badge>
                  <Badge variant="secondary">Updated: {apiImportResult.updatedCount}</Badge>
                  <Badge variant={apiImportResult.errors?.length ? "destructive" : "secondary"}>
                    Errors: {apiImportResult.errors?.length || 0}
                  </Badge>
                </div>

                {apiImportResult.errors && apiImportResult.errors.length > 0 && (
                  <div className="rounded-md border bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">Row</TableHead>
                          <TableHead className="w-[180px]">Column</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Raw Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {apiImportResult.errors.map((er, idx) => (
                          <TableRow key={`${er.rowNumber}-${er.column}-${idx}`}>
                            <TableCell>{er.rowNumber}</TableCell>
                            <TableCell>{er.column}</TableCell>
                            <TableCell>{er.message}</TableCell>
                            <TableCell className="max-w-[300px] truncate">{er.rawValue || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApiImportOpen(false)} disabled={actionLoading}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
