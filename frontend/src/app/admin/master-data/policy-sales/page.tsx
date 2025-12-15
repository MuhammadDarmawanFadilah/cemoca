'use client'

import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { showErrorToast, showSuccessToast, showWarningToast } from '@/components/ui/toast-utils'
import { Textarea } from '@/components/ui/textarea'
import { ServerPagination } from '@/components/ServerPagination'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  masterDataAPI,
  type MasterPolicySalesImportResult,
  type MasterPolicySalesListFilters,
  type MasterPolicySalesRequest,
  type MasterPolicySalesResponse,
} from '@/lib/api'
import { getCompanyCodeFromLocalStorage, setCompanyProfileToLocalStorage } from '@/lib/companyProfileLocal'
import { useAuth } from '@/contexts/AuthContext'
import { Upload, Plus, MoreHorizontal, Edit, Trash2, RefreshCcw, Code, Filter, ChevronDown, ChevronUp, FileSpreadsheet, FileDown } from 'lucide-react'

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'

  const day = String(d.getDate()).padStart(2, '0')
  const month = d.toLocaleString('en-US', { month: 'short' })
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')

  return `${day}-${month}-${year} ${hours}:${minutes}`
}

function formatImportWarning(result: MasterPolicySalesImportResult, fallback: string) {
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

function formatApe(value?: number | null) {
  if (value === null || value === undefined) return '-'
  if (Number.isNaN(Number(value))) return '-'
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function PolicySalesPage() {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [mounted, setMounted] = useState(false)
  const [tableLoading, setTableLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const isAdminOnly = user?.role?.roleName === 'ADMIN'

  const [items, setItems] = useState<MasterPolicySalesResponse[]>([])

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [draftAgentCode, setDraftAgentCode] = useState('')
  const [draftPolicyCode, setDraftPolicyCode] = useState('')
  const [draftCreatedBy, setDraftCreatedBy] = useState('')

  const [appliedAgentCode, setAppliedAgentCode] = useState('')
  const [appliedPolicyCode, setAppliedPolicyCode] = useState('')
  const [appliedCreatedBy, setAppliedCreatedBy] = useState('')

  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<MasterPolicySalesResponse | null>(null)

  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const importFileInputRef = useRef<HTMLInputElement | null>(null)
  const [importResult, setImportResult] = useState<MasterPolicySalesImportResult | null>(null)
  const [importCompanyCode, setImportCompanyCode] = useState('')
  const [importRemoveExisting, setImportRemoveExisting] = useState(false)
  const [isConfirmExcelReplaceOpen, setIsConfirmExcelReplaceOpen] = useState(false)

  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const csvFileInputRef = useRef<HTMLInputElement | null>(null)
  const [csvImportResult, setCsvImportResult] = useState<MasterPolicySalesImportResult | null>(null)
  const [csvCompanyCode, setCsvCompanyCode] = useState('')
  const [csvRemoveExisting, setCsvRemoveExisting] = useState(false)
  const [isConfirmCsvReplaceOpen, setIsConfirmCsvReplaceOpen] = useState(false)

  const [isApiImportOpen, setIsApiImportOpen] = useState(false)
  const [apiCompanyCode, setApiCompanyCode] = useState('')
  const [apiJson, setApiJson] = useState('')
  const [apiImportResult, setApiImportResult] = useState<MasterPolicySalesImportResult | null>(null)

  const [companyCode, setCompanyCode] = useState('')

  const [formData, setFormData] = useState<MasterPolicySalesRequest>({
    agentCode: '',
    policyDate: '',
    policyCode: '',
    policyApe: 0,
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
  }, [mounted, currentPage, pageSize, appliedAgentCode, appliedPolicyCode, appliedCreatedBy, companyCode])

  const loadData = async () => {
    const cc = (companyCode || getCompanyCodeFromLocalStorage(userId)).trim()
    if (!cc) {
      setItems([])
      setTotalElements(0)
      setTotalPages(0)
      return
    }

    try {
      setTableLoading(true)
      const filters: MasterPolicySalesListFilters = {
        agentCode: appliedAgentCode || undefined,
        policyCode: appliedPolicyCode || undefined,
        createdBy: appliedCreatedBy || undefined,
      }

      const res = await masterDataAPI.policySales.getAll(cc, filters, undefined, currentPage, pageSize, 'createdAt', 'desc')
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
    setAppliedAgentCode(draftAgentCode.trim())
    setAppliedPolicyCode(draftPolicyCode.trim())
    setAppliedCreatedBy(draftCreatedBy.trim())
    setCurrentPage(0)
  }

  const onReset = () => {
    setDraftAgentCode('')
    setDraftPolicyCode('')
    setDraftCreatedBy('')
    setAppliedAgentCode('')
    setAppliedPolicyCode('')
    setAppliedCreatedBy('')
    setCurrentPage(0)
  }

  const activeFilterCount =
    (appliedAgentCode ? 1 : 0) +
    (appliedPolicyCode ? 1 : 0) +
    (appliedCreatedBy ? 1 : 0)

  const persistCompanyCode = (cc: string) => {
    const trimmed = (cc || '').trim()
    if (!trimmed) return
    setCompanyCode(trimmed)
    setApiCompanyCode(trimmed)
    setCompanyProfileToLocalStorage({ companyCode: trimmed }, userId)
    setCompanyProfileToLocalStorage({ companyCode: trimmed })
  }

  const resetForm = () => {
    setSelected(null)
    setFormData({ agentCode: '', policyDate: '', policyCode: '', policyApe: 0 })
  }

  const openCreate = () => {
    resetForm()
    setIsCreateOpen(true)
  }

  const openEdit = (item: MasterPolicySalesResponse) => {
    setSelected(item)
    setFormData({
      agentCode: item.agentCode || '',
      policyDate: item.policyDate || '',
      policyCode: item.policyCode || '',
      policyApe: Number(item.policyApe ?? 0),
    })
    setIsEditOpen(true)
  }

  const validateForm = () => {
    const agentCode = (formData.agentCode || '').trim()
    const policyDate = (formData.policyDate || '').trim()
    const policyCode = (formData.policyCode || '').trim()
    const policyApe = Number(formData.policyApe)

    if (!agentCode) return 'Agent Code wajib diisi'
    if (!policyDate) return 'Policy Date wajib diisi'
    if (!policyCode) return 'Policy Code wajib diisi'
    if (Number.isNaN(policyApe)) return 'Policy APE wajib diisi'

    return null
  }

  const submitCreate = async () => {
    const err = validateForm()
    if (err) {
      showErrorToast(err)
      return
    }

    try {
      setActionLoading(true)
      const cc = (companyCode || getCompanyCodeFromLocalStorage(userId)).trim()
      if (!cc) {
        showErrorToast('Company Code wajib diisi')
        return
      }

      const payload: MasterPolicySalesRequest = {
        agentCode: formData.agentCode.trim(),
        policyDate: formData.policyDate.trim(),
        policyCode: formData.policyCode.trim(),
        policyApe: Number(formData.policyApe),
      }

      await masterDataAPI.policySales.create(cc, payload)
      showSuccessToast('Berhasil menambah Policy Sales')
      setIsCreateOpen(false)
      await loadData()
    } catch (e) {
      showErrorToast(e)
    } finally {
      setActionLoading(false)
    }
  }

  const submitEdit = async () => {
    const err = validateForm()
    if (err) {
      showErrorToast(err)
      return
    }

    if (!selected?.id) return

    try {
      setActionLoading(true)
      const cc = (companyCode || getCompanyCodeFromLocalStorage(userId)).trim()
      if (!cc) {
        showErrorToast('Company Code wajib diisi')
        return
      }

      const payload: MasterPolicySalesRequest = {
        agentCode: formData.agentCode.trim(),
        policyDate: formData.policyDate.trim(),
        policyCode: formData.policyCode.trim(),
        policyApe: Number(formData.policyApe),
      }

      await masterDataAPI.policySales.update(cc, selected.id, payload)
      showSuccessToast('Berhasil mengubah Policy Sales')
      setIsEditOpen(false)
      await loadData()
    } catch (e) {
      showErrorToast(e)
    } finally {
      setActionLoading(false)
    }
  }

  const openDelete = (item: MasterPolicySalesResponse) => {
    setSelected(item)
    setIsDeleteOpen(true)
  }

  const submitDelete = async () => {
    if (!selected?.id) return

    try {
      setActionLoading(true)
      const cc = (companyCode || getCompanyCodeFromLocalStorage(userId)).trim()
      if (!cc) {
        showErrorToast('Company Code wajib diisi')
        return
      }

      await masterDataAPI.policySales.delete(cc, selected.id)
      showSuccessToast('Berhasil menghapus Policy Sales')
      await loadData()
    } catch (e) {
      showErrorToast(e)
    } finally {
      setActionLoading(false)
    }
  }

  const resetImport = () => {
    setImportFile(null)
    setImportResult(null)
    setImportRemoveExisting(false)
    setIsConfirmExcelReplaceOpen(false)
    if (importFileInputRef.current) {
      importFileInputRef.current.value = ''
    }
  }

  const openExcelImport = () => {
    const cc = getCompanyCodeFromLocalStorage(userId)
    setImportCompanyCode(cc)
    resetImport()
    setIsImportOpen(true)
  }

  const submitImportInternal = async () => {
    if (isAdminOnly) {
      showErrorToast('ADMIN tidak bisa upload Excel')
      return
    }

    const selectedFile = importFile ?? importFileInputRef.current?.files?.[0] ?? null
    if (!selectedFile) {
      showErrorToast('File Excel harus dipilih')
      return
    }

    const cc = (importCompanyCode || '').trim()
    if (!cc) {
      showErrorToast('Company Code wajib diisi')
      return
    }

    try {
      setActionLoading(true)
      setImportResult(null)
      if (importFile !== selectedFile) {
        setImportFile(selectedFile)
      }
      const res = await masterDataAPI.policySales.importExcel(cc, selectedFile, importRemoveExisting)
      setImportResult(res)
      if (res.success && (!res.errors || res.errors.length === 0)) {
        showSuccessToast(`Import berhasil (created: ${res.createdCount}, updated: ${res.updatedCount})`)
      } else {
        showWarningToast(formatImportWarning(res, 'Import Excel gagal'), 'Import Excel')
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
      showErrorToast('File Excel harus dipilih')
      return
    }
    if (importRemoveExisting) {
      setIsConfirmExcelReplaceOpen(true)
      return
    }
    await submitImportInternal()
  }

  const resetCsvImport = () => {
    setCsvFile(null)
    setCsvImportResult(null)
    setCsvRemoveExisting(false)
    setIsConfirmCsvReplaceOpen(false)
    if (csvFileInputRef.current) {
      csvFileInputRef.current.value = ''
    }
  }

  const openCsvImport = () => {
    const cc = getCompanyCodeFromLocalStorage(userId)
    setCsvCompanyCode(cc)
    resetCsvImport()
    setIsCsvImportOpen(true)
  }

  const submitCsvImportInternal = async () => {
    if (isAdminOnly) {
      showErrorToast('ADMIN tidak bisa upload CSV')
      return
    }

    const selectedFile = csvFile ?? csvFileInputRef.current?.files?.[0] ?? null
    if (!selectedFile) {
      showErrorToast('File CSV harus dipilih')
      return
    }

    const cc = (csvCompanyCode || '').trim()
    if (!cc) {
      showErrorToast('Company Code wajib diisi')
      return
    }

    try {
      setActionLoading(true)
      setCsvImportResult(null)
      if (csvFile !== selectedFile) {
        setCsvFile(selectedFile)
      }
      const res = await masterDataAPI.policySales.importCsv(cc, selectedFile, csvRemoveExisting)
      setCsvImportResult(res)
      if (res.success && (!res.errors || res.errors.length === 0)) {
        showSuccessToast(`Import CSV berhasil (created: ${res.createdCount}, updated: ${res.updatedCount})`)
      } else {
        showWarningToast(formatImportWarning(res, 'Import CSV gagal'), 'Import CSV')
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
      showErrorToast('File CSV harus dipilih')
      return
    }
    if (csvRemoveExisting) {
      setIsConfirmCsvReplaceOpen(true)
      return
    }
    await submitCsvImportInternal()
  }

  const resetApiImport = () => {
    setApiJson('')
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
    if (isAdminOnly) {
      showErrorToast('ADMIN tidak bisa Import API')
      return
    }

    const fallbackCompanyCode = (apiCompanyCode || '').trim()
    if (!fallbackCompanyCode && !apiJson.trim()) {
      showErrorToast('Company Code wajib diisi')
      return
    }

    const fallbackRemoveExisting = false

    let items: MasterPolicySalesRequest[] = []
    let companyCode = fallbackCompanyCode
    let removeExisting = fallbackRemoveExisting

    try {
      const parsed = JSON.parse(apiJson || '') as unknown
      if (Array.isArray(parsed)) {
        items = parsed as MasterPolicySalesRequest[]
      } else if (parsed && typeof parsed === 'object') {
        const obj = parsed as any
        const cc = String(obj.companyCode ?? obj.company_code ?? '').trim()
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
          items = data as MasterPolicySalesRequest[]
        } else {
          showErrorToast('Format JSON tidak valid. Gunakan { company_code, remove_existing, items: [] }')
          return
        }
      } else {
        showErrorToast('Format JSON tidak valid')
        return
      }
    } catch {
      showErrorToast('JSON tidak valid')
      return
    }

    if (!companyCode) {
      showErrorToast('Company Code wajib diisi')
      return
    }

    if (!items || items.length === 0) {
      showErrorToast('Items kosong')
      return
    }

    try {
      setActionLoading(true)
      setApiImportResult(null)
      const res = await masterDataAPI.policySales.importApi(companyCode, items, undefined, removeExisting)
      setApiImportResult(res)
      if (res.success && (!res.errors || res.errors.length === 0)) {
        showSuccessToast(`Import API berhasil (created: ${res.createdCount}, updated: ${res.updatedCount})`)
      } else {
        showWarningToast(formatImportWarning(res, 'Import API gagal'), 'Import API')
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

  const downloadTemplate = async (kind: 'excel' | 'csv') => {
    try {
      setActionLoading(true)
      const token = localStorage.getItem('auth_token')
      const url = kind === 'excel'
        ? masterDataAPI.policySales.getTemplateExcelUrl()
        : masterDataAPI.policySales.getTemplateCsvUrl()

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!response.ok) {
        throw new Error('Gagal download template')
      }

      const blob = await response.blob()
      const disposition = response.headers.get('content-disposition') || ''
      const m = /filename="?([^";]+)"?/i.exec(disposition)
      const filename = m?.[1] || (kind === 'excel' ? 'policy_sales_template.xlsx' : 'policy_sales_template.csv')

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
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold md:text-2xl">Policy Sales</h1>
              <p className="text-sm text-muted-foreground">Master Data Policy Sales</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Tambah
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (isAdminOnly) {
                  showErrorToast('ADMIN tidak bisa upload Excel')
                  return
                }
                openExcelImport()
              }}
            >
              <Upload className="h-4 w-4" />
              Import Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (isAdminOnly) {
                  showErrorToast('ADMIN tidak bisa upload CSV')
                  return
                }
                openCsvImport()
              }}
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (isAdminOnly) {
                  showErrorToast('ADMIN tidak bisa Import API')
                  return
                }
                openApiImport()
              }}
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
              <CardTitle className="text-base">Daftar Policy Sales</CardTitle>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 ? (
                  <Badge variant="secondary" className="w-fit">{activeFilterCount} filter aktif</Badge>
                ) : null}
                <Button type="button" variant="outline" size="sm" onClick={() => setFiltersOpen((v) => !v)}>
                  <Filter className="h-4 w-4" />
                  {filtersOpen ? 'Sembunyikan filter' : 'Tampilkan filter'}
                  {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!companyCode.trim() && (
              <div className="rounded-md border bg-muted/20 px-4 py-3 text-sm font-semibold text-foreground">
                Company Code belum diisi. Silakan isi di <a className="underline" href="/profile">Profile</a> agar data Policy Sales bisa ditampilkan.
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
                      <div className="text-[11px] text-muted-foreground">Agent Code</div>
                      <Input
                        placeholder="Cari agent code..."
                        value={draftAgentCode}
                        onChange={(e) => setDraftAgentCode(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-muted-foreground">Policy Code</div>
                      <Input
                        placeholder="Cari policy code..."
                        value={draftPolicyCode}
                        onChange={(e) => setDraftPolicyCode(e.target.value)}
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
                      <TableHead>Policy Date</TableHead>
                      <TableHead>Policy Code</TableHead>
                      <TableHead className="text-right">Policy APE</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead className="w-[80px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          Tidak ada data
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((it) => (
                        <TableRow key={it.id}>
                          <TableCell className="font-mono text-xs">{it.agentCode}</TableCell>
                          <TableCell>{it.policyDate}</TableCell>
                          <TableCell>{it.policyCode}</TableCell>
                          <TableCell className="text-right">{formatApe(it.policyApe)}</TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{it.createdBy || '-'}</div>
                            <div className="text-xs text-muted-foreground">{formatDateTime(it.createdAt)}</div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(it)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => openDelete(it)}
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

      {/* Create */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Tambah Policy Sales</DialogTitle>
            <DialogDescription>Input manual policy sales</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Agent Code</Label>
              <Input value={formData.agentCode} onChange={(e) => setFormData((p) => ({ ...p, agentCode: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Policy Date</Label>
              <Input type="date" value={formData.policyDate} onChange={(e) => setFormData((p) => ({ ...p, policyDate: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Policy Code</Label>
              <Input value={formData.policyCode} onChange={(e) => setFormData((p) => ({ ...p, policyCode: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Policy APE</Label>
              <Input
                type="number"
                step="0.01"
                value={Number.isNaN(Number(formData.policyApe)) ? '' : String(formData.policyApe ?? '')}
                onChange={(e) => {
                  const v = e.target.value
                  setFormData((p) => ({ ...p, policyApe: v === '' ? Number.NaN : Number(v) }))
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={actionLoading}>Batal</Button>
            <Button onClick={() => void submitCreate()} disabled={actionLoading}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Policy Sales</DialogTitle>
            <DialogDescription>Perbarui data policy sales</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Agent Code</Label>
              <Input value={formData.agentCode} onChange={(e) => setFormData((p) => ({ ...p, agentCode: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Policy Date</Label>
              <Input type="date" value={formData.policyDate} onChange={(e) => setFormData((p) => ({ ...p, policyDate: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Policy Code</Label>
              <Input value={formData.policyCode} onChange={(e) => setFormData((p) => ({ ...p, policyCode: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Policy APE</Label>
              <Input
                type="number"
                step="0.01"
                value={Number.isNaN(Number(formData.policyApe)) ? '' : String(formData.policyApe ?? '')}
                onChange={(e) => {
                  const v = e.target.value
                  setFormData((p) => ({ ...p, policyApe: v === '' ? Number.NaN : Number(v) }))
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={actionLoading}>Batal</Button>
            <Button onClick={() => void submitEdit()} disabled={actionLoading}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <ConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open)
          if (!open) setSelected(null)
        }}
        title="Hapus Policy Sales"
        description={`Hapus policy sales: ${selected?.policyCode || '-'}?`}
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

      {/* Import Excel */}
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
            <DialogDescription>Upload file Excel Policy Sales.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Company Code</Label>
                <Input value={importCompanyCode} onChange={(e) => setImportCompanyCode(e.target.value)} placeholder="Company Code" />
                <div className="text-xs text-muted-foreground">Wajib diisi. Dipakai untuk scope data Policy Sales.</div>
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
                <Button
                  onClick={() => void submitImport()}
                  disabled={actionLoading || (!importFile && !(importFileInputRef.current?.files?.[0])) || isAdminOnly || !importCompanyCode.trim()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>

            {importResult && (
              <div className="rounded-md border bg-muted/20 p-4 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={importResult.success ? 'default' : 'destructive'}>
                    {importResult.success ? 'SUCCESS' : 'FAILED'}
                  </Badge>
                  <Badge variant="secondary">Created: {importResult.createdCount}</Badge>
                  <Badge variant="secondary">Updated: {importResult.updatedCount}</Badge>
                  <Badge variant={importResult.errors?.length ? 'destructive' : 'secondary'}>
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

      {/* Import CSV */}
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
            <DialogDescription>Upload file CSV Policy Sales.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Company Code</Label>
                <Input value={csvCompanyCode} onChange={(e) => setCsvCompanyCode(e.target.value)} placeholder="Company Code" />
                <div className="text-xs text-muted-foreground">Wajib diisi. Dipakai untuk scope data Policy Sales.</div>
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
                <Button
                  onClick={() => void submitCsvImport()}
                  disabled={actionLoading || (!csvFile && !(csvFileInputRef.current?.files?.[0])) || isAdminOnly || !csvCompanyCode.trim()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>

            {csvImportResult && (
              <div className="rounded-md border bg-muted/20 p-4 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={csvImportResult.success ? 'default' : 'destructive'}>
                    {csvImportResult.success ? 'SUCCESS' : 'FAILED'}
                  </Badge>
                  <Badge variant="secondary">Created: {csvImportResult.createdCount}</Badge>
                  <Badge variant="secondary">Updated: {csvImportResult.updatedCount}</Badge>
                  <Badge variant={csvImportResult.errors?.length ? 'destructive' : 'secondary'}>
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

      {/* Import API */}
      <Dialog open={isApiImportOpen} onOpenChange={(o) => { setIsApiImportOpen(o); if (!o) resetApiImport() }}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Import API</DialogTitle>
            <DialogDescription>Import Policy Sales dari API (JSON).</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
              <div className="space-y-2">
                <Label>Company Code</Label>
                <Input value={apiCompanyCode} onChange={(e) => setApiCompanyCode(e.target.value)} placeholder="Company Code" />
                <div className="text-xs text-muted-foreground">Wajib. Bisa diisi di sini atau di dalam JSON payload.</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Items JSON</Label>
              <Textarea
                value={apiJson}
                onChange={(e) => setApiJson(e.target.value)}
                placeholder={
                  `{
  "company_code": "PTABHIMAB936B8",
  "remove_existing": false,
  "items": [
    {
      "agent_code": "AG-001",
      "policy_date": "2025-01-15",
      "policy_code": "POL-0001",
      "policy_ape": 12345.67
    }
  ]
}`
                }
                className="min-h-[220px] font-mono text-xs"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => resetApiImport()} disabled={actionLoading}>Reset</Button>
              <Button onClick={() => void submitApiImport()} disabled={actionLoading || !apiJson.trim() || isAdminOnly || !apiCompanyCode.trim()}>
                <Code className="h-4 w-4 mr-2" />
                Submit
              </Button>
            </div>

            {apiImportResult && (
              <div className="rounded-md border bg-muted/20 p-4 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={apiImportResult.success ? 'default' : 'destructive'}>
                    {apiImportResult.success ? 'SUCCESS' : 'FAILED'}
                  </Badge>
                  <Badge variant="secondary">Created: {apiImportResult.createdCount}</Badge>
                  <Badge variant="secondary">Updated: {apiImportResult.updatedCount}</Badge>
                  <Badge variant={apiImportResult.errors?.length ? 'destructive' : 'secondary'}>
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
