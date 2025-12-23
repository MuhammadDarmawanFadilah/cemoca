'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { getCompanyCodeFromLocalStorage, getCompanyNameFromLocalStorage } from '@/lib/companyProfileLocal'
import { showErrorToast, showSuccessToast } from '@/components/ui/toast-utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LearningScheduleService, type LearningScheduleConfig, type LearningScheduleConfigRequest, type LearningSchedulePrerequisiteResponse } from '@/services/learningScheduleService'
import { ApiClient } from '@/services/apiClient'
import { videoReportAPI, type DIDPresenter } from '@/lib/api'
import { apiCall } from '@/lib/api'
import { Check, X, ChevronRight, ChevronLeft, Play, FileText, Image as ImageIcon, File, AlertCircle, RefreshCw, Settings, Calendar, Bell, Info, Clock, Search, Zap } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

type MediaType = 'VIDEO' | 'IMAGE' | 'PDF' | 'PPT'

type VideoMaterialTab = 'M1' | 'M2' | 'M3' | 'M4' | 'FINAL'
type VideoScriptTab = 'script' | 'generate'

type ScheduleMaterialForm = {
  startDate: string
  endDate: string
  learningCode: string
  videoTextTemplate: string

  previewUrl?: string | null

  videoLearningCode1: string
  videoLearningCode2: string
  videoLearningCode3: string
  videoLearningCode4: string

  videoTextTemplate1: string
  videoTextTemplate2: string
  videoTextTemplate3: string
  videoTextTemplate4: string
}

type LearningModuleVideoRow = {
  id: number
  code: string
  title: string | null
  duration: string | null
  text?: string | null
  textPreview?: string | null
}

type LearningModuleFileRow = {
  id: number
  code: string
  title: string | null
  duration: string | null
  imageUrl?: string | null
  pdfUrl?: string | null
  powerPointUrl?: string | null
}

type PageResponse<T> = {
  content: T[]
}

type SchedulerRow = {
  type: string
  config: LearningScheduleConfig | null
}

function normalizeType(raw: string): MediaType {
  const v = String(raw || '').trim().toUpperCase()
  if (v === 'IMAGE' || v === 'PDF' || v === 'PPT') return v
  return 'VIDEO'
}

function todayISO() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function isoToUtcDate(iso: string) {
  const s = String(iso || '').trim()
  if (!s) return null
  const d = new Date(`${s}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return null
  return d
}

function dateToIsoUTC(d: Date) {
  return d.toISOString().slice(0, 10)
}

function addDaysISO(iso: string, days: number) {
  const d = isoToUtcDate(iso)
  if (!d) return ''
  const next = new Date(d.getTime())
  next.setUTCDate(next.getUTCDate() + days)
  return dateToIsoUTC(next)
}

function maxIso(a: string, b: string) {
  const aa = String(a || '').trim()
  const bb = String(b || '').trim()
  if (!aa) return bb
  if (!bb) return aa
  return aa >= bb ? aa : bb
}

function minIso(a: string, b: string) {
  const aa = String(a || '').trim()
  const bb = String(b || '').trim()
  if (!aa) return bb
  if (!bb) return aa
  return aa <= bb ? aa : bb
}

function clampIso(value: string, min: string, max: string) {
  let v = String(value || '').trim()
  const lo = String(min || '').trim()
  const hi = String(max || '').trim()
  if (lo && v && v < lo) v = lo
  if (hi && v && v > hi) v = hi
  return v
}

function normalizeMaterialsForUi(materials: ScheduleMaterialForm[], scheduleStart: string, scheduleEnd: string) {
  const start = String(scheduleStart || '').trim()
  const end = String(scheduleEnd || '').trim()
  if (!start || !end) return materials

  const next = materials.map(m => ({
    ...m,
    previewUrl: m.previewUrl ?? null,
  }))

  for (let i = 0; i < next.length; i++) {
    const prev = i > 0 ? next[i - 1] : null
    const prevEnd = prev?.endDate ? String(prev.endDate) : ''
    const minStart = prevEnd ? maxIso(start, addDaysISO(prevEnd, 1)) : start

    const rawStart = String(next[i].startDate || '').trim() || start
    const rawEnd = String(next[i].endDate || '').trim() || end

    const clampedStart = clampIso(rawStart, minStart, end)
    const clampedEnd = clampIso(rawEnd, clampedStart, end)

    next[i].startDate = clampedStart
    next[i].endDate = clampedEnd
  }

  return next
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

const TOTAL_STEPS = 3

export default function LearningScheduleConfigurationPage() {
  const { user, isAuthenticated } = useAuth()
  const { t } = useLanguage()

  // --- State ---
  const [view, setView] = useState<'LIST' | 'FORM'>('LIST')
  const [step, setStep] = useState(1)
  const [maxStepReached, setMaxStepReached] = useState(1)
  const [loading, setLoading] = useState(false)
  const [sendNowDialogOpen, setSendNowDialogOpen] = useState(false)
  const [sendNowLoading, setSendNowLoading] = useState(false)
  const [sendNowTarget, setSendNowTarget] = useState<{ id: number; companyCode: string; schedulerType: string } | null>(null)

  // List Data
  const [schedulerRows, setSchedulerRows] = useState<SchedulerRow[]>([])

  // Form Data
  const [editingId, setEditingId] = useState<number | null>(null)
  const [targetCompanyCode, setTargetCompanyCode] = useState('')
  const [prerequisites, setPrerequisites] = useState<LearningSchedulePrerequisiteResponse | null>(null)
  
  const [schedulerType, setSchedulerType] = useState('TRAINING_14_DAY_MICRO_LEARNING')
  const [startDate, setStartDate] = useState(todayISO())
  const [endDate, setEndDate] = useState(todayISO())
  const [hourOfDay, setHourOfDay] = useState(9)
  const [mediaType, setMediaType] = useState<MediaType>('VIDEO')
  // Legacy single learningCode is kept only for backward compatibility with older backend.
  // Current backend uses `materials[]` and picks active material by date.
  const [learningCode, setLearningCode] = useState('')
  const [waMessageTemplate, setWaMessageTemplate] = useState('')

  const [materials, setMaterials] = useState<ScheduleMaterialForm[]>([])
  const [activeMaterialIndex, setActiveMaterialIndex] = useState(0)

  const [allowedPlaceholders, setAllowedPlaceholders] = useState<string[]>([])
  const [allowedPlaceholdersLoading, setAllowedPlaceholdersLoading] = useState(false)

  // AI Generator (Gemini)
  const [waIdeaPrompt, setWaIdeaPrompt] = useState('')
  const [ideaLanguage, setIdeaLanguage] = useState<'id' | 'en' | 'ja' | 'ko' | 'zh'>('id')
  const [generatingWa, setGeneratingWa] = useState(false)
  const [waTab, setWaTab] = useState<'text' | 'generate'>('text')
  const [generatingVideoIdea, setGeneratingVideoIdea] = useState(false)

  // Per-card VIDEO tabs
  const [videoMaterialTabByCard, setVideoMaterialTabByCard] = useState<Record<number, VideoMaterialTab>>({})
  const [videoScriptTabByCard, setVideoScriptTabByCard] = useState<Record<number, VideoScriptTab>>({})
  const [videoIdeaPromptByCard, setVideoIdeaPromptByCard] = useState<Record<number, string>>({})

  // D-ID Avatar (VIDEO only)
  const [didPresenterId, setDidPresenterId] = useState('')
  const [didPresenterName, setDidPresenterName] = useState('')
  const [presenters, setPresenters] = useState<DIDPresenter[]>([])
  const [presentersLoading, setPresentersLoading] = useState(false)
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false)
  const [avatarSearch, setAvatarSearch] = useState('')
  const [avatarPage, setAvatarPage] = useState(1)
  const AVATARS_PER_PAGE = 24

  // Browse Dialog
  const [codeDialogOpen, setCodeDialogOpen] = useState(false)
  const [codeDialogTarget, setCodeDialogTarget] = useState<
    'MAIN'
    | { kind: 'MATERIAL'; index: number }
    | { kind: 'MATERIAL_VIDEO'; index: number; part: 1 | 2 | 3 | 4 }
  >('MAIN')
  const [codeRows, setCodeRows] = useState<Array<LearningModuleVideoRow | LearningModuleFileRow>>([])
  const [codeSearch, setCodeSearch] = useState('')
  const [companyNameCache, setCompanyNameCache] = useState<Record<string, string>>({})
  const [previewUrlCache, setPreviewUrlCache] = useState<Record<string, Record<string, string>>>({})

  const resolveCompanyName = async (cc: string) => {
    const key = cc.trim().toUpperCase()
    const cached = companyNameCache[key]
    if (cached) return cached

    if (key === userCompanyCode.trim().toUpperCase() && userCompanyName) {
      setCompanyNameCache(prev => ({ ...prev, [key]: userCompanyName }))
      return userCompanyName
    }

    const res = await ApiClient.get<{ companyName: string }>(
      `/api/admin/company-lookup/company-name?companyCode=${encodeURIComponent(cc)}`
    )
    const name = (res?.companyName || '').trim()
    if (name) setCompanyNameCache(prev => ({ ...prev, [key]: name }))
    return name
  }

  const updateMaterial = (index: number, patch: Partial<ScheduleMaterialForm>) => {
    setMaterials(prev => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)))
  }

  const addMaterial = () => {
    setMaterials(prev => {
      const nextIndex = prev.length
      setActiveMaterialIndex(nextIndex)
      setVideoMaterialTabByCard(m => ({ ...m, [nextIndex]: 'M1' }))
      setVideoScriptTabByCard(m => ({ ...m, [nextIndex]: 'script' }))

      const scheduleStart = String(startDate || '').trim()
      const scheduleEnd = String(endDate || '').trim()
      const lastEnd = prev.length > 0 ? String(prev[prev.length - 1]?.endDate || '').trim() : ''
      const rawStart = lastEnd ? maxIso(scheduleStart, addDaysISO(lastEnd, 1)) : scheduleStart
      const nextStart = clampIso(rawStart, scheduleStart, scheduleEnd)
      const nextEnd = clampIso(scheduleEnd, nextStart, scheduleEnd)

      return [
        ...prev,
        {
          startDate: nextStart,
          endDate: nextEnd,
          learningCode: '',
          videoTextTemplate: '',
          previewUrl: null,
          videoLearningCode1: '',
          videoLearningCode2: '',
          videoLearningCode3: '',
          videoLearningCode4: '',
          videoTextTemplate1: '',
          videoTextTemplate2: '',
          videoTextTemplate3: '',
          videoTextTemplate4: '',
        },
      ]
    })
  }

  const removeMaterial = (index: number) => {
    setMaterials(prev => {
      const next = prev.filter((_, i) => i !== index)
      const nextActive = Math.max(0, Math.min(activeMaterialIndex, next.length - 1))
      setActiveMaterialIndex(nextActive)
      return next
    })

    const shiftMap = <T,>(m: Record<number, T>) => {
      const next: Record<number, T> = {}
      for (const [kRaw, v] of Object.entries(m)) {
        const k = Number(kRaw)
        if (Number.isNaN(k)) continue
        if (k === index) continue
        next[k > index ? k - 1 : k] = v
      }
      return next
    }
    setVideoMaterialTabByCard(prev => shiftMap(prev))
    setVideoScriptTabByCard(prev => shiftMap(prev))
    setVideoIdeaPromptByCard(prev => shiftMap(prev))
  }

  const validateMaterials = () => {
    const scheduleStart = startDate
    const scheduleEnd = endDate
    const list = materials
      .map((m, idx) => ({ ...m, idx }))
      .filter(m => {
        const hasDates = String(m.startDate || '').trim() || String(m.endDate || '').trim()
        const hasSingleCode = String(m.learningCode || '').trim()
        const hasVideoCodes =
          String(m.videoLearningCode1 || '').trim() ||
          String(m.videoLearningCode2 || '').trim() ||
          String(m.videoLearningCode3 || '').trim() ||
          String(m.videoLearningCode4 || '').trim()
        const hasVideoTexts =
          String(m.videoTextTemplate1 || '').trim() ||
          String(m.videoTextTemplate2 || '').trim() ||
          String(m.videoTextTemplate3 || '').trim() ||
          String(m.videoTextTemplate4 || '').trim()
        return Boolean(hasDates || hasSingleCode || hasVideoCodes || hasVideoTexts)
      })

    if (list.length === 0) {
      showErrorToast('Learning Material wajib diisi minimal 1')
      return false
    }

    const byIndex = [...list].sort((a, b) => a.idx - b.idx)
    for (let i = 1; i < byIndex.length; i++) {
      const prev = byIndex[i - 1]
      const cur = byIndex[i]
      if (cur.startDate <= prev.endDate) {
        showErrorToast(`Start Card ${cur.idx + 1} harus setelah End Card ${prev.idx + 1}`)
        return false
      }
    }

    for (const m of list) {
      if (!m.startDate || !m.endDate) {
        showErrorToast(`Start/End wajib diisi (Card ${m.idx + 1})`)
        return false
      }
      if (m.endDate < m.startDate) {
        showErrorToast(`Periode tidak valid (Card ${m.idx + 1})`)
        return false
      }
      if (m.startDate < scheduleStart || m.endDate > scheduleEnd) {
        showErrorToast(`Periode card harus dalam schedule periode (Card ${m.idx + 1})`)
        return false
      }
      if (mediaType === 'VIDEO') {
        if (!String(m.videoLearningCode1 || '').trim()
          || !String(m.videoLearningCode2 || '').trim()
          || !String(m.videoLearningCode3 || '').trim()
          || !String(m.videoLearningCode4 || '').trim()) {
          showErrorToast(`Learning Material 1-4 wajib diisi (Card ${m.idx + 1})`)
          return false
        }
        if (!String(m.videoTextTemplate1 || '').trim()
          || !String(m.videoTextTemplate2 || '').trim()
          || !String(m.videoTextTemplate3 || '').trim()
          || !String(m.videoTextTemplate4 || '').trim()) {
          showErrorToast(`Video Script (D-ID) 1-4 wajib diisi (Card ${m.idx + 1})`)
          return false
        }
      } else {
        if (!String(m.learningCode || '').trim()) {
          showErrorToast(`Learning Material wajib diisi (Card ${m.idx + 1})`)
          return false
        }
      }
    }

    const sorted = [...list].sort((a, b) => a.startDate.localeCompare(b.startDate))
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]
      const cur = sorted[i]
      if (cur.startDate <= prev.endDate) {
        showErrorToast('Periode antar Learning Material tidak boleh tabrakan')
        return false
      }
    }

    return true
  }

  // Derived
  const isAdmin = useMemo(() => {
    return user?.role?.roleName === 'ADMIN'
  }, [user])

  const userCompanyCode = useMemo(() => {
    const fromLocal = getCompanyCodeFromLocalStorage(user?.id)
    return (fromLocal || user?.companyCode || '').trim()
  }, [user?.companyCode, user?.id])

  const userCompanyName = useMemo(() => {
    const fromLocal = getCompanyNameFromLocalStorage(user?.id)
    return (fromLocal || user?.companyName || '').trim()
  }, [user?.companyName, user?.id])

  // Get scheduler info
  const schedulerInfo = useMemo(() => {
    const safeT = (key: string, fallback = '') => {
      const value = t(key)
      return value === key ? fallback : value
    }

    const key = `learningSchedule.schedulerTypes.${schedulerType}`
    return {
      name: safeT(`${key}.name`, schedulerType.replace(/_/g, ' ')),
      description: safeT(`${key}.description`, ''),
      shortDescription: safeT(`${key}.shortDescription`, '')
    }
  }, [schedulerType, t])

  const policySalesRequired = useMemo(() => {
    return !['WELCOME_NEW_JOINNER', 'HAPPY_BIRTHDAY_NOTIFICATION'].includes(String(schedulerType || '').trim().toUpperCase())
  }, [schedulerType])

  // --- Effects ---
  useEffect(() => {
    if (isAuthenticated && view === 'LIST') {
      refreshList()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, view, userCompanyCode])

  // Auto-check prerequisites for non-admin when entering form view
  useEffect(() => {
    if (view === 'FORM' && step === 1 && !isAdmin && targetCompanyCode) {
      checkPrerequisites()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, step, isAdmin, targetCompanyCode])

  const loadPresenters = async () => {
    setPresentersLoading(true)
    try {
      const list = await videoReportAPI.getPresenters()
      setPresenters(Array.isArray(list) ? list : [])
    } catch {
      setPresenters([])
    } finally {
      setPresentersLoading(false)
    }
  }

  useEffect(() => {
    if (view === 'FORM' && step === 3 && mediaType === 'VIDEO' && presenters.length === 0 && !presentersLoading) {
      loadPresenters()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, step, mediaType])

  useEffect(() => {
    if (view !== 'FORM' || step !== 3) return
    const st = String(schedulerType || '').trim().toUpperCase()
    if (!st) {
      setAllowedPlaceholders([])
      return
    }

    let cancelled = false
    ;(async () => {
      setAllowedPlaceholdersLoading(true)
      try {
        const data = await apiCall<{ schedulerType: string; placeholders: string[] }>(
          `/admin/learning-schedule/placeholders?schedulerType=${encodeURIComponent(st)}`
        )
        if (!cancelled) {
          setAllowedPlaceholders(Array.isArray(data?.placeholders) ? data.placeholders : [])
        }
      } catch {
        if (!cancelled) setAllowedPlaceholders([])
      } finally {
        if (!cancelled) setAllowedPlaceholdersLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, step, schedulerType])

  // Enforce date constraints (Step 2): startDate >= today; endDate >= startDate
  useEffect(() => {
    const today = todayISO()
    if (startDate && startDate < today) {
      setStartDate(today)
      if (endDate && endDate < today) setEndDate(today)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate])

  useEffect(() => {
    if (startDate && endDate && endDate < startDate) {
      setEndDate(startDate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate])

  useEffect(() => {
    if (view !== 'FORM' || step !== 3) return
    if (mediaType === 'VIDEO') return
    if (!startDate || !endDate) return

    const companyCode = (targetCompanyCode || userCompanyCode).trim()
    if (!companyCode) return

    const needsHydration = materials.some(m => String(m.learningCode || '').trim() && !String(m.previewUrl || '').trim())
    if (!needsHydration) return

    let cancelled = false
    ;(async () => {
      try {
        const cName = await resolveCompanyName(companyCode)
        if (!cName) return

        const cacheKey = `${mediaType}:${cName}`
        let map = previewUrlCache[cacheKey]
        if (!map) {
          let url = ''
          if (mediaType === 'IMAGE') url = `/api/learning-module/images?page=0&size=500&companyName=${encodeURIComponent(cName)}`
          else if (mediaType === 'PDF') url = `/api/learning-module/pdfs?page=0&size=500&companyName=${encodeURIComponent(cName)}`
          else url = `/api/learning-module/power-points?page=0&size=500&companyName=${encodeURIComponent(cName)}`

          const res = await ApiClient.get<PageResponse<any>>(url)
          const rows = Array.isArray(res?.content) ? res.content : []
          const built: Record<string, string> = {}
          for (const r of rows) {
            const code = String(r?.code || '').trim()
            if (!code) continue
            const link = mediaType === 'IMAGE'
              ? String(r?.imageUrl || '').trim()
              : mediaType === 'PDF'
                ? String(r?.pdfUrl || '').trim()
                : String(r?.powerPointUrl || '').trim()
            if (link) built[code] = link
          }
          map = built
          setPreviewUrlCache(prev => ({ ...prev, [cacheKey]: built }))
        }

        if (cancelled) return
        setMaterials(prev => {
          let changed = false
          const next = prev.map(m => {
            const code = String(m.learningCode || '').trim()
            if (!code) return m
            if (String(m.previewUrl || '').trim()) return m
            const previewUrl = map?.[code] || null
            if (previewUrl) changed = true
            return { ...m, previewUrl }
          })
          return changed ? next : prev
        })
      } catch {
        // ignore hydration errors; preview will appear when user re-selects via Browse Library
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, step, mediaType, targetCompanyCode, userCompanyCode, materials])

  useEffect(() => {
    if (view !== 'FORM') return
    if (!startDate || !endDate) return

    setMaterials(prev => {
      const normalized = normalizeMaterialsForUi(prev, startDate, endDate)
      const same = normalized.length === prev.length && normalized.every((m, i) =>
        m.startDate === prev[i].startDate &&
        m.endDate === prev[i].endDate &&
        (m.previewUrl ?? null) === (prev[i].previewUrl ?? null)
      )
      return same ? prev : normalized
    })
  }, [view, startDate, endDate])

  // --- Actions ---

  const buildLanguageInstruction = (lang: typeof ideaLanguage) => {
    const langInstruction: Record<typeof ideaLanguage, string> = {
      id: 'Gunakan bahasa Indonesia.',
      en: 'Use English.',
      ja: '日本語で書いてください。',
      ko: '한국어로 작성해 주세요.',
      zh: '请使用中文。',
    }
    return langInstruction[lang]
  }

  const onGenerateWhatsAppNotification = async () => {
    if (generatingWa) return
    setGeneratingWa(true)
    try {
      const st = String(schedulerType || '').trim().toUpperCase()


      const placeholders = (allowedPlaceholders && allowedPlaceholders.length > 0)
        ? allowedPlaceholders
        : [':name', ':agentCode', ':companyName', ':learningName']

      const baseRequest = (waIdeaPrompt || '').trim() || (waMessageTemplate || '').trim() || ''

      const promptLines: string[] = []
      promptLines.push(buildLanguageInstruction(ideaLanguage))
      promptLines.push('Buat pesan WhatsApp untuk notifikasi scheduler.')
      promptLines.push(`Scheduler Type: ${st || '-'}.`)
      // learning title is resolved at send-time; do not encourage codes in copy
      promptLines.push(`Placeholder yang DIIZINKAN hanya: ${placeholders.join(', ')}.`)
      promptLines.push('WAJIB gunakan placeholder :name untuk nama agent (contoh: Halo :name, ...).')
      promptLines.push('DILARANG menggunakan placeholder/variabel selain yang diizinkan.')
      promptLines.push('DILARANG menggunakan format {..}, {{..}}, [..] atau placeholder lain yang tidak ada di daftar.')
      promptLines.push('Output WAJIB hanya isi pesan WhatsApp saja (tanpa judul, tanpa pembukaan seperti "JUDUL:").')
      promptLines.push('Tanpa markdown (tanpa **bold**, tanpa bullet/numbering).')
      promptLines.push('Jangan tulis penjelasan tambahan.')
      if (baseRequest) {
        promptLines.push(`Permintaan ide / draft saat ini: ${baseRequest}`)
      }

      const prompt = promptLines.join('\n')

      const data = await apiCall<{
        text: string
        words: number
        estimatedMinutes: number
        estimatedMinutesRange: { min: number; max: number }
        model: string
      }>('/ai/gemini/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt, language: ideaLanguage }),
      })

      const generated = String(data?.text || '').trim()
      if (generated) {
        setWaMessageTemplate(generated)
        setWaTab('text')
        if (!waIdeaPrompt.trim()) {
          setWaIdeaPrompt(baseRequest || generated)
        }
      }
    } catch (e: any) {
      showErrorToast(e?.message ?? 'Failed to generate')
    } finally {
      setGeneratingWa(false)
    }
  }

  const onGenerateVideoIdea = async (cardIndex: number, tab: VideoMaterialTab) => {
    if (generatingVideoIdea) return
    if (String(mediaType || '').toUpperCase() !== 'VIDEO') return
    if (!materials[cardIndex]) return
    if (tab === 'FINAL') return
    setGeneratingVideoIdea(true)
    try {
      const st = String(schedulerType || '').trim().toUpperCase()

      const placeholders = (allowedPlaceholders && allowedPlaceholders.length > 0)
        ? allowedPlaceholders
        : [':name', ':agentCode', ':companyName', ':learningName']

      const m = materials[cardIndex]
      const currentTemplate = tab === 'M1'
        ? (m.videoTextTemplate1 || '')
        : tab === 'M2'
          ? (m.videoTextTemplate2 || '')
          : tab === 'M3'
            ? (m.videoTextTemplate3 || '')
            : (m.videoTextTemplate4 || '')

      const ideaPrompt = String(videoIdeaPromptByCard[cardIndex] || '')
      const baseRequest = (ideaPrompt || '').trim() || String(currentTemplate || '').trim() || ''

      const promptLines: string[] = []
      promptLines.push(buildLanguageInstruction(ideaLanguage))
      promptLines.push('Buat naskah narasi video pendek yang siap diucapkan (spoken narration) untuk kebutuhan scheduler.')
      promptLines.push(`Scheduler Type: ${st || '-'}.`)
      promptLines.push(`Placeholder yang DIIZINKAN hanya: ${placeholders.join(', ')}.`)
      promptLines.push('WAJIB gunakan placeholder :name untuk nama agent di dalam naskah (contoh: Halo :name, ...).')
      promptLines.push('DILARANG menggunakan placeholder/variabel selain yang diizinkan.')
      promptLines.push('DILARANG menggunakan format {..}, {{..}}, [..] atau placeholder lain yang tidak ada di daftar.')
      promptLines.push('Output WAJIB hanya teks narasi yang akan diucapkan (tanpa judul, tanpa markdown, tanpa bullet/numbering).')
      promptLines.push('Jangan tulis arahan panggung/aksi/suara/musik seperti (musik intro), [SFX], atau deskripsi visual.')
      promptLines.push('Jangan tulis label pembicara seperti PEMBICARA:, HOST:, NARATOR:.')
      promptLines.push('Jangan tulis penjelasan tambahan.')
      if (baseRequest) {
        promptLines.push(`Permintaan ide / draft saat ini: ${baseRequest}`)
      }

      const prompt = promptLines.join('\n')

      const data = await apiCall<{
        text: string
        words: number
        estimatedMinutes: number
        estimatedMinutesRange: { min: number; max: number }
        model: string
      }>('/ai/gemini/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt, language: ideaLanguage }),
      })

      const generated = String(data?.text || '').trim()
      if (generated) {
        const patch: Partial<ScheduleMaterialForm> = {}
        if (tab === 'M1') patch.videoTextTemplate1 = generated
        if (tab === 'M2') patch.videoTextTemplate2 = generated
        if (tab === 'M3') patch.videoTextTemplate3 = generated
        if (tab === 'M4') patch.videoTextTemplate4 = generated
        updateMaterial(cardIndex, patch)

        setVideoScriptTabByCard(prev => ({ ...prev, [cardIndex]: 'script' }))

        if (!String(videoIdeaPromptByCard[cardIndex] || '').trim()) {
          setVideoIdeaPromptByCard(prev => ({ ...prev, [cardIndex]: baseRequest || generated }))
        }
      }
    } catch (e: any) {
      showErrorToast(e?.message ?? 'Failed to generate')
    } finally {
      setGeneratingVideoIdea(false)
    }
  }

  const refreshList = async (forceCompanyCode?: string) => {
    const forced = (forceCompanyCode || '').trim()
    const code = forced || (isAdmin && targetCompanyCode ? targetCompanyCode : userCompanyCode)
    if (!code && !isAdmin) return

    const effectiveCode = code || userCompanyCode
    if (!effectiveCode) return

    setLoading(true)
    try {
      let types: string[] = []
      try {
        types = await LearningScheduleService.listTypes()
      } catch {
        types = ['TRAINING_14_DAY_MICRO_LEARNING', 'TRAINING_28_DAY_MICRO_LEARNING', 'WELCOME_NEW_JOINNER', 'HAPPY_BIRTHDAY_NOTIFICATION', 'CONGRATULATION', 'PERFORMANCE_TRACKING_WITH_BALANCE_TO_GO']
      }

      const configs = await LearningScheduleService.listConfigs(effectiveCode)
      
      const rows: SchedulerRow[] = types.map(t => {
        const found = configs.find(c => c.schedulerType === t)
        return {
          type: t,
          config: found || null
        }
      })

      setSchedulerRows(rows)
    } catch (e: any) {
      showErrorToast(e ?? t('learningSchedule.messages.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleConfigure = (type: string, cfg: LearningScheduleConfig | null) => {
    setTargetCompanyCode(isAdmin && targetCompanyCode ? targetCompanyCode : userCompanyCode)
    setPrerequisites(null)
    setSchedulerType(type)

    if (cfg) {
      setEditingId(cfg.id)
      setStartDate(cfg.startDate ? String(cfg.startDate) : todayISO())
      setEndDate(cfg.endDate ? String(cfg.endDate) : todayISO())
      setHourOfDay(typeof cfg.hourOfDay === 'number' ? cfg.hourOfDay : 9)
      const mt = normalizeType(cfg.mediaType || 'VIDEO')
      setMediaType(mt)
      setLearningCode((cfg.learningCode || '').trim())

      const incoming = Array.isArray((cfg as any).materials) ? (cfg as any).materials : []
      if (incoming.length > 0) {
        const mapped: ScheduleMaterialForm[] = incoming.map((m: any) => ({
          startDate: String(m?.startDate || ''),
          endDate: String(m?.endDate || ''),
          learningCode: String(m?.learningCode || ''),
          videoTextTemplate: String(m?.videoTextTemplate || ''),
          previewUrl: null,
          videoLearningCode1: String(m?.videoLearningCode1 || ''),
          videoLearningCode2: String(m?.videoLearningCode2 || ''),
          videoLearningCode3: String(m?.videoLearningCode3 || ''),
          videoLearningCode4: String(m?.videoLearningCode4 || ''),
          videoTextTemplate1: String(m?.videoTextTemplate1 || ''),
          videoTextTemplate2: String(m?.videoTextTemplate2 || ''),
          videoTextTemplate3: String(m?.videoTextTemplate3 || ''),
          videoTextTemplate4: String(m?.videoTextTemplate4 || ''),
        }))

        const scheduleStart = cfg.startDate ? String(cfg.startDate) : todayISO()
        const scheduleEnd = cfg.endDate ? String(cfg.endDate) : todayISO()
        const normalized = normalizeMaterialsForUi(
          mapped.sort((a, b) => String(a.startDate || '').localeCompare(String(b.startDate || ''))),
          scheduleStart,
          scheduleEnd
        )

        setMaterials(normalized)
        setActiveMaterialIndex(0)
        setLearningCode(String(normalized?.[0]?.learningCode || cfg.learningCode || '').trim())
        const mt: Record<number, VideoMaterialTab> = {}
        const st: Record<number, VideoScriptTab> = {}
        for (let i = 0; i < normalized.length; i++) {
          mt[i] = 'M1'
          st[i] = 'script'
        }
        setVideoMaterialTabByCard(mt)
        setVideoScriptTabByCard(st)
        setVideoIdeaPromptByCard({})
      } else {
        const scheduleStart = cfg.startDate ? String(cfg.startDate) : todayISO()
        const scheduleEnd = cfg.endDate ? String(cfg.endDate) : todayISO()
        const single: ScheduleMaterialForm[] = [
          {
            startDate: scheduleStart,
            endDate: scheduleEnd,
            learningCode: String(cfg.learningCode || '').trim(),
            videoTextTemplate: String(cfg.videoTextTemplate || ''),
            previewUrl: null,
            videoLearningCode1: String((cfg as any).videoLearningCode1 || ''),
            videoLearningCode2: String((cfg as any).videoLearningCode2 || ''),
            videoLearningCode3: String((cfg as any).videoLearningCode3 || ''),
            videoLearningCode4: String((cfg as any).videoLearningCode4 || ''),
            videoTextTemplate1: String((cfg as any).videoTextTemplate1 || ''),
            videoTextTemplate2: String((cfg as any).videoTextTemplate2 || ''),
            videoTextTemplate3: String((cfg as any).videoTextTemplate3 || ''),
            videoTextTemplate4: String((cfg as any).videoTextTemplate4 || ''),
          },
        ]
        setMaterials(normalizeMaterialsForUi(single, scheduleStart, scheduleEnd))
        setActiveMaterialIndex(0)
        setVideoMaterialTabByCard({ 0: 'M1' })
        setVideoScriptTabByCard({ 0: 'script' })
        setVideoIdeaPromptByCard({})
      }

      setWaMessageTemplate(cfg.waMessageTemplate || '')
      setDidPresenterId((cfg.didPresenterId || '').trim())
      setDidPresenterName((cfg.didPresenterName || '').trim())
    } else {
      setEditingId(null)
      setStartDate(todayISO())
      setEndDate(todayISO())
      setHourOfDay(9)
      setMediaType('VIDEO')
      setLearningCode('')
      setMaterials([
        {
          startDate: todayISO(),
          endDate: todayISO(),
          learningCode: '',
          videoTextTemplate: '',
          previewUrl: null,
          videoLearningCode1: '',
          videoLearningCode2: '',
          videoLearningCode3: '',
          videoLearningCode4: '',
          videoTextTemplate1: '',
          videoTextTemplate2: '',
          videoTextTemplate3: '',
          videoTextTemplate4: '',
        },
      ])
      setActiveMaterialIndex(0)
      setVideoMaterialTabByCard({ 0: 'M1' })
      setVideoScriptTabByCard({ 0: 'script' })
      setVideoIdeaPromptByCard({})
      setWaMessageTemplate('')
      setDidPresenterId('')
      setDidPresenterName('')
    }

    setStep(1)
    setMaxStepReached(1)
    setView('FORM')
  }

  const checkPrerequisites = async () => {
    if (!targetCompanyCode) {
      if (isAdmin) showErrorToast(t('learningSchedule.messages.companyCodeRequired'))
      return
    }
    setLoading(true)
    try {
      const res = await LearningScheduleService.checkPrerequisites(targetCompanyCode)
      setPrerequisites(res)
    } catch (e: any) {
      showErrorToast(e ?? t('learningSchedule.messages.checkFailed'))
    } finally {
      setLoading(false)
    }
  }

  const loadLearningCodes = async (mt: MediaType, opts?: { videoCategory?: 'VIDEO_1' | 'VIDEO_2' | 'VIDEO_3' | 'VIDEO_4' }) => {
    setCodeRows([])
    const companyCode = (targetCompanyCode || userCompanyCode).trim()
    if (!companyCode) {
      showErrorToast(t('learningSchedule.messages.companyCodeRequired'))
      return
    }

    try {
      const cName = await resolveCompanyName(companyCode)
      if (!cName) {
        showErrorToast(t('learningSchedule.messages.companyCodeRequired'))
        return
      }

      let url = ''
      // Fetch a larger page and filter client-side using "contains" for code.
      if (mt === 'VIDEO') {
        const cat = opts?.videoCategory
        url = `/api/learning-module/videos?page=0&size=200&companyName=${encodeURIComponent(cName)}${cat ? `&category=${encodeURIComponent(cat)}` : ''}`
      }
      else if (mt === 'IMAGE') url = `/api/learning-module/images?page=0&size=200&companyName=${encodeURIComponent(cName)}`
      else if (mt === 'PDF') url = `/api/learning-module/pdfs?page=0&size=200&companyName=${encodeURIComponent(cName)}`
      else url = `/api/learning-module/power-points?page=0&size=200&companyName=${encodeURIComponent(cName)}`

      const res = await ApiClient.get<PageResponse<any>>(url)
      setCodeRows(res?.content || [])
    } catch (e: any) {
      showErrorToast(e ?? t('learningSchedule.messages.loadLearningCodeFailed'))
    }
  }

  const filteredCodeRows = useMemo(() => {
    const q = codeSearch.trim().toLowerCase()
    if (!q) return codeRows
    return codeRows.filter((r: any) => String(r?.code || '').toLowerCase().includes(q))
  }, [codeRows, codeSearch])

  const onSelectCode = (row: any) => {
    const code = String(row?.code || '').trim()

    const resolveNonVideoTargetIndex = () => {
      if (codeDialogTarget === 'MAIN') return activeMaterialIndex
      if (codeDialogTarget.kind === 'MATERIAL') return codeDialogTarget.index
      return null
    }

    if (codeDialogTarget === 'MAIN') {
      // MAIN is treated as active material selection.
      updateMaterial(activeMaterialIndex, { learningCode: code })
    } else if (codeDialogTarget.kind === 'MATERIAL') {
      const idx = codeDialogTarget.index
      updateMaterial(idx, { learningCode: code })
      setActiveMaterialIndex(idx)
    } else {
      const idx = codeDialogTarget.index
      const part = codeDialogTarget.part
      const tab: VideoMaterialTab = part === 1 ? 'M1' : part === 2 ? 'M2' : part === 3 ? 'M3' : 'M4'

      setActiveMaterialIndex(idx)
      setVideoMaterialTabByCard(prev => ({ ...prev, [idx]: tab }))

      if (part === 1) updateMaterial(idx, { videoLearningCode1: code })
      if (part === 2) updateMaterial(idx, { videoLearningCode2: code })
      if (part === 3) updateMaterial(idx, { videoLearningCode3: code })
      if (part === 4) updateMaterial(idx, { videoLearningCode4: code })
    }

    if (mediaType === 'VIDEO') {
      const txt = String(row?.text || row?.textPreview || '').trim()
      if (txt && codeDialogTarget !== 'MAIN' && codeDialogTarget.kind === 'MATERIAL_VIDEO') {
        const idx = codeDialogTarget.index
        const part = codeDialogTarget.part
        if (part === 1 && !String(materials[idx]?.videoTextTemplate1 || '').trim()) updateMaterial(idx, { videoTextTemplate1: txt })
        if (part === 2 && !String(materials[idx]?.videoTextTemplate2 || '').trim()) updateMaterial(idx, { videoTextTemplate2: txt })
        if (part === 3 && !String(materials[idx]?.videoTextTemplate3 || '').trim()) updateMaterial(idx, { videoTextTemplate3: txt })
        if (part === 4 && !String(materials[idx]?.videoTextTemplate4 || '').trim()) updateMaterial(idx, { videoTextTemplate4: txt })
      }
    } else if (mediaType === 'IMAGE') {
      const idx = resolveNonVideoTargetIndex()
      if (idx !== null) {
        updateMaterial(idx, { previewUrl: row?.imageUrl || null })
        setActiveMaterialIndex(idx)
      }
    } else if (mediaType === 'PDF') {
      const idx = resolveNonVideoTargetIndex()
      if (idx !== null) {
        updateMaterial(idx, { previewUrl: row?.pdfUrl || null })
        setActiveMaterialIndex(idx)
      }
    } else {
      const idx = resolveNonVideoTargetIndex()
      if (idx !== null) {
        updateMaterial(idx, { previewUrl: row?.powerPointUrl || null })
        setActiveMaterialIndex(idx)
      }
    }

    setCodeDialogOpen(false)
  }

  const handleSave = async () => {
    if (!targetCompanyCode) return

    if (!validateMaterials()) {
      return
    }
    
    const payload: LearningScheduleConfigRequest = {
      schedulerType: schedulerType,
      startDate,
      endDate,
      hourOfDay,
      mediaType,
      // Keep legacy fields populated from the first material for compatibility.
      learningCode: (mediaType === 'VIDEO'
        ? (materials[0]?.videoLearningCode1 || '')
        : (materials[0]?.learningCode || '')
      ).trim(),
      videoTextTemplate: null,
      materials: materials.map(m => ({
        startDate: m.startDate,
        endDate: m.endDate,
        learningCode: (mediaType === 'VIDEO' ? (m.videoLearningCode1 || '') : (m.learningCode || '')).trim(),
        videoTextTemplate: null,
        videoLearningCode1: mediaType === 'VIDEO' ? (m.videoLearningCode1 || null) : null,
        videoLearningCode2: mediaType === 'VIDEO' ? (m.videoLearningCode2 || null) : null,
        videoLearningCode3: mediaType === 'VIDEO' ? (m.videoLearningCode3 || null) : null,
        videoLearningCode4: mediaType === 'VIDEO' ? (m.videoLearningCode4 || null) : null,
        videoTextTemplate1: mediaType === 'VIDEO' ? (m.videoTextTemplate1 || null) : null,
        videoTextTemplate2: mediaType === 'VIDEO' ? (m.videoTextTemplate2 || null) : null,
        videoTextTemplate3: mediaType === 'VIDEO' ? (m.videoTextTemplate3 || null) : null,
        videoTextTemplate4: mediaType === 'VIDEO' ? (m.videoTextTemplate4 || null) : null,
      })),
      waMessageTemplate,
      didPresenterId: mediaType === 'VIDEO' ? (didPresenterId.trim() || null) : null,
      didPresenterName: mediaType === 'VIDEO' ? (didPresenterName.trim() || null) : null,
    }

    setLoading(true)
    try {
      if (editingId) {
        await LearningScheduleService.updateConfig(targetCompanyCode, editingId, payload)
        showSuccessToast(t('learningSchedule.messages.updateSuccess'))
      } else {
        await LearningScheduleService.createConfig(targetCompanyCode, payload)
        showSuccessToast(t('learningSchedule.messages.createSuccess'))
      }
      setView('LIST')
      refreshList(targetCompanyCode)
    } catch (e: any) {
      showErrorToast(e ?? t('learningSchedule.messages.saveFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async (id: number, code: string) => {
    setLoading(true)
    try {
      await LearningScheduleService.activate(code, id)
      showSuccessToast(t('learningSchedule.messages.activateSuccess'))
      refreshList(code)
    } catch (e: any) {
      showErrorToast(e ?? t('learningSchedule.messages.saveFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivate = async (id: number, code: string) => {
    setLoading(true)
    try {
      await LearningScheduleService.deactivate(code, id)
      showSuccessToast(t('learningSchedule.messages.deactivateSuccess'))
      refreshList(code)
    } catch (e: any) {
      showErrorToast(e ?? t('learningSchedule.messages.saveFailed'))
    } finally {
      setLoading(false)
    }
  }

  const openSendNow = (cfg: LearningScheduleConfig) => {
    setSendNowTarget({ id: cfg.id, companyCode: cfg.companyCode, schedulerType: String(cfg.schedulerType || '') })
    setSendNowDialogOpen(true)
  }

  const handleSendNow = async () => {
    if (!sendNowTarget) return
    setSendNowLoading(true)
    try {
      await LearningScheduleService.sendNow(sendNowTarget.companyCode, sendNowTarget.id)
      showSuccessToast(t('learningSchedule.sendNow.success'))
      setSendNowDialogOpen(false)
      setSendNowTarget(null)
      refreshList(sendNowTarget.companyCode)
    } catch (e: any) {
      showErrorToast(e ?? t('learningSchedule.messages.saveFailed'))
    } finally {
      setSendNowLoading(false)
    }
  }

  const renderSendNowDialog = () => {
    return (
      <Dialog
        open={sendNowDialogOpen}
        onOpenChange={(open) => {
          setSendNowDialogOpen(open)
          if (!open) setSendNowTarget(null)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('learningSchedule.sendNow.title')}</DialogTitle>
          </DialogHeader>

          <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-5 w-5 text-amber-700 dark:text-amber-400" />
            <AlertTitle className="text-amber-900 dark:text-amber-100 font-semibold">{t('learningSchedule.sendNow.warningTitle')}</AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-200 mt-2 leading-relaxed">
              {t('learningSchedule.sendNow.warningBody')}
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendNowDialogOpen(false)} disabled={sendNowLoading}>
              {t('learningSchedule.sendNow.cancel')}
            </Button>
            <Button onClick={handleSendNow} disabled={sendNowLoading} className="bg-green-600 hover:bg-green-700">
              {sendNowLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> {t('learningSchedule.sendNow.sending')}
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" /> {t('learningSchedule.sendNow.confirm')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // --- Render Helpers ---

  const renderStepIndicator = () => {
    const steps = [
      { num: 1, label: t('learningSchedule.step1.title'), icon: Check },
      { num: 2, label: t('learningSchedule.step2.title'), icon: Settings },
      { num: 3, label: t('learningSchedule.step3.title'), icon: Bell },
    ]

    const progressPct = TOTAL_STEPS <= 1 ? 100 : Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100)
    return (
      <div className="w-full">
        <div className="rounded-xl border bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/50 shadow-sm">
          <div className="px-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-muted-foreground line-clamp-1">{schedulerInfo.shortDescription || schedulerInfo.name}</div>
              <div className="text-xs font-medium text-muted-foreground">{step} / {TOTAL_STEPS}</div>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="px-4 pb-4 pt-4">
            <div className="grid grid-cols-3 gap-2">
              {steps.map((s) => {
                const isCurrent = step === s.num
                const isUnlocked = s.num <= maxStepReached
                const Icon = s.icon

                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => {
                      if (!isUnlocked) return
                      setStep(s.num)
                    }}
                    disabled={!isUnlocked}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={
                      `group flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition ` +
                      `${isUnlocked ? 'hover:border-primary hover:bg-muted/40' : 'opacity-50 cursor-not-allowed'} ` +
                      `${isCurrent ? 'border-primary bg-primary/5 shadow-sm' : 'border-muted bg-background'}`
                    }
                  >
                    <div
                      className={
                        `flex h-9 w-9 items-center justify-center rounded-full border transition ` +
                        `${isCurrent ? 'bg-primary text-primary-foreground border-primary' : (step > s.num) ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-muted'}`
                      }
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-xs font-semibold truncate ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- Views ---

  if (!isAuthenticated) return null

  if (view === 'LIST') {
    return (
      <div className="container mx-auto p-6 space-y-8 max-w-6xl">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{t('learningSchedule.title')}</h1>
          <p className="text-muted-foreground">{t('learningSchedule.description')}</p>
        </div>

        <Card className="border-none shadow-md">
          <CardHeader className="bg-muted/30 pb-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle>{t('learningSchedule.listTitle')}</CardTitle>
                <CardDescription>{t('learningSchedule.listDescription')}</CardDescription>
              </div>
              {isAdmin && (
                <div className="flex gap-2 items-center bg-background p-1 rounded-lg border shadow-sm">
                  <Input 
                    placeholder={t('learningSchedule.step1.targetCompanyCode')} 
                    value={targetCompanyCode} 
                    onChange={e => setTargetCompanyCode(e.target.value)} 
                    className="w-40 border-none shadow-none focus-visible:ring-0"
                  />
                  <Button size="sm" variant="ghost" onClick={() => refreshList()}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="-mt-5">
            <Card className="overflow-hidden border shadow-sm">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[300px]">{t('learningSchedule.table.schedulerType')}</TableHead>
                    <TableHead>{t('learningSchedule.table.status')}</TableHead>
                    <TableHead>{t('learningSchedule.table.startDate')}</TableHead>
                    <TableHead>{t('learningSchedule.table.endDate')}</TableHead>
                    <TableHead>{t('learningSchedule.table.hour')}</TableHead>
                    <TableHead>{t('learningSchedule.table.media')}</TableHead>
                    <TableHead className="text-right">{t('learningSchedule.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedulerRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        {t('learningSchedule.table.noData')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    schedulerRows.map((row, idx) => {
                      const cfg = row.config
                      const isActive = cfg?.active || false
                      
                      return (
                        <TableRow key={idx} className="hover:bg-muted/5">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {row.type.replace(/_/g, ' ')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-green-600 hover:bg-green-700' : ''}>
                              {isActive ? t('learningSchedule.active') : t('learningSchedule.inactive')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{cfg?.startDate || '-'}</TableCell>
                          <TableCell className="text-muted-foreground">{cfg?.endDate || '-'}</TableCell>
                          <TableCell className="text-muted-foreground">{cfg?.hourOfDay !== undefined && cfg?.hourOfDay !== null ? `${cfg.hourOfDay}:00` : '-'}</TableCell>
                          <TableCell>
                            {cfg?.mediaType && (
                              <Badge variant="outline" className="font-mono text-xs">
                                {cfg.mediaType}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {cfg ? (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => handleConfigure(row.type, cfg)}>
                                    <Settings className="w-3.5 h-3.5 mr-1.5" />
                                    {t('learningSchedule.edit')}
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => openSendNow(cfg)}>
                                    <Zap className="w-3.5 h-3.5 mr-1.5" />
                                    {t('learningSchedule.sendNow.button')}
                                  </Button>
                                  {isActive ? (
                                    <Button size="sm" variant="destructive" onClick={() => handleDeactivate(cfg.id, cfg.companyCode)}>
                                      {t('learningSchedule.stop')}
                                    </Button>
                                  ) : (
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleActivate(cfg.id, cfg.companyCode)}>
                                      <Play className="w-3.5 h-3.5 mr-1.5" />
                                      {t('learningSchedule.start')}
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <Button size="sm" onClick={() => handleConfigure(row.type, null)}>
                                  {t('learningSchedule.configure')}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </Card>
          </CardContent>
        </Card>

        {renderSendNowDialog()}
      </div>
    )
  }

  // FORM VIEW
  return (
    <div className="container mx-auto p-6 space-y-8 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setView('LIST')} className="rounded-full">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{editingId ? t('learningSchedule.editConfiguration') : t('learningSchedule.newConfiguration')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {schedulerInfo.name}
          </p>
        </div>
      </div>

      {renderStepIndicator()}

      <Card className="border-none shadow-lg mt-8">
        <CardContent className="p-8">
          {/* STEP 1: Verifikasi Data */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Scheduler Info */}
              <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-900 dark:text-blue-100 font-semibold">
                  {t('learningSchedule.step1.schedulerInfoTitle', { name: schedulerInfo.name })}
                </AlertTitle>
                <AlertDescription className="text-blue-800 dark:text-blue-200 mt-2 leading-relaxed whitespace-pre-line">
                  {schedulerInfo.description}
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{t('learningSchedule.step1.subtitle')}</h2>
                  {isAdmin && (
                    <Button variant="outline" size="sm" onClick={checkPrerequisites} disabled={loading}>
                      <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      {t('learningSchedule.step1.recheckButton')}
                    </Button>
                  )}
                </div>
                
                {isAdmin ? (
                  <div className="space-y-2">
                    <Label>{t('learningSchedule.step1.targetCompanyCode')}</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={targetCompanyCode} 
                        onChange={e => setTargetCompanyCode(e.target.value)} 
                        placeholder={t('learningSchedule.step1.targetCompanyCodePlaceholder')}
                        className="max-w-md"
                      />
                      <Button onClick={checkPrerequisites} disabled={loading}>{t('learningSchedule.step1.checkButton')}</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">{t('learningSchedule.step1.adminNote')}</p>
                  </div>
                ) : (
                  <div className="p-4 bg-muted/30 rounded-lg border flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Settings className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('learningSchedule.step1.targetCompanyCode')}</p>
                      <p className="text-lg font-semibold">{targetCompanyCode}</p>
                    </div>
                  </div>
                )}
              </div>

              {!prerequisites && loading && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                  <p>{t('learningSchedule.step1.checking')}</p>
                </div>
              )}

              {prerequisites && (
                <div className={`grid grid-cols-1 ${policySalesRequired ? 'md:grid-cols-2' : ''} gap-6`}>
                  <Card className={`border-l-4 shadow-sm transition-all ${prerequisites.agencyListExists ? 'border-l-green-500 bg-green-50/30' : 'border-l-red-500 bg-red-50/30'}`}>
                    <CardContent className="p-6 flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold text-base">{t('learningSchedule.step1.agencyListData')}</p>
                        <p className="text-sm text-muted-foreground">
                          {prerequisites.agencyListExists 
                            ? t('learningSchedule.step1.agencyListAvailable')
                            : t('learningSchedule.step1.agencyListMissing')}
                        </p>
                      </div>
                      <div className={`p-2 rounded-full ${prerequisites.agencyListExists ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {prerequisites.agencyListExists ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                      </div>
                    </CardContent>
                  </Card>

                  {policySalesRequired && (
                    <Card className={`border-l-4 shadow-sm transition-all ${prerequisites.policySalesExists ? 'border-l-green-500 bg-green-50/30' : 'border-l-red-500 bg-red-50/30'}`}>
                      <CardContent className="p-6 flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold text-base">{t('learningSchedule.step1.policySalesData')}</p>
                          <p className="text-sm text-muted-foreground">
                            {prerequisites.policySalesExists 
                              ? t('learningSchedule.step1.policySalesAvailable')
                              : t('learningSchedule.step1.policySalesMissing')}
                          </p>
                        </div>
                        <div className={`p-2 rounded-full ${prerequisites.policySalesExists ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {prerequisites.policySalesExists ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {prerequisites && (
                !prerequisites.agencyListExists ||
                (policySalesRequired && !prerequisites.policySalesExists)
              ) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('learningSchedule.step1.incompleteDataTitle')}</AlertTitle>
                  <AlertDescription>
                    {t('learningSchedule.step1.incompleteDataMessage')}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end pt-4">
                <Button 
                  size="lg"
                  onClick={() => {
                    setMaxStepReached(prev => Math.max(prev, 2))
                    setStep(2)
                  }}
                  disabled={
                    !prerequisites?.agencyListExists ||
                    (policySalesRequired && !prerequisites?.policySalesExists)
                  }
                  className="px-8"
                >
                  {t('learningSchedule.step1.nextButton')} <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Konfigurasi Job */}
          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="space-y-6">
                {/* Periode Jadwal */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      {t('learningSchedule.step2.schedulePeriod')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>{t('learningSchedule.step2.startDate')}</Label>
                        <Input 
                          type="date" 
                          value={startDate} 
                          min={todayISO()}
                          onChange={e => {
                            const today = todayISO()
                            const next = e.target.value
                            const clamped = next && next < today ? today : next
                            setStartDate(clamped)
                            if (endDate && clamped && endDate < clamped) setEndDate(clamped)
                          }}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('learningSchedule.step2.endDate')}</Label>
                        <Input 
                          type="date" 
                          value={endDate} 
                          min={startDate || todayISO()}
                          onChange={e => {
                            const today = todayISO()
                            const minDate = (startDate && startDate >= today) ? startDate : today
                            const next = e.target.value
                            const clamped = next && next < minDate ? minDate : next
                            setEndDate(clamped)
                          }}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Waktu Eksekusi */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      {t('learningSchedule.step2.executionTime')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t('learningSchedule.step2.hour')}</Label>
                      <div className="relative">
                        <Clock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                        <Select value={String(hourOfDay)} onValueChange={v => setHourOfDay(Number(v))}>
                          <SelectTrigger className="w-full pl-10">
                            <SelectValue placeholder={t('learningSchedule.step2.hourPlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            {HOURS.map(h => (
                              <SelectItem key={h} value={String(h)}>
                                {String(h).padStart(2, '0')}:00
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-xs text-muted-foreground">{t('learningSchedule.step2.hourNote')}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Format Media */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">{t('learningSchedule.step2.mediaFormat')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(['VIDEO', 'IMAGE', 'PDF', 'PPT'] as MediaType[]).map((type) => (
                        <div 
                          key={type}
                          onClick={() => setMediaType(type)}
                          className={`
                            cursor-pointer rounded-lg border-2 p-4 flex flex-col items-center gap-2 transition-all hover:bg-muted/50
                            ${mediaType === type ? 'border-primary bg-primary/5 shadow-md' : 'border-muted'}
                          `}
                        >
                          {type === 'VIDEO' && <Play className={`w-6 h-6 ${mediaType === type ? 'text-primary' : 'text-muted-foreground'}`} />}
                          {type === 'IMAGE' && <ImageIcon className={`w-6 h-6 ${mediaType === type ? 'text-primary' : 'text-muted-foreground'}`} />}
                          {type === 'PDF' && <FileText className={`w-6 h-6 ${mediaType === type ? 'text-primary' : 'text-muted-foreground'}`} />}
                          {type === 'PPT' && <File className={`w-6 h-6 ${mediaType === type ? 'text-primary' : 'text-muted-foreground'}`} />}
                          <span className={`text-sm font-medium ${mediaType === type ? 'text-primary' : 'text-muted-foreground'}`}>{type}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" size="lg" onClick={() => setStep(1)}>
                  <ChevronLeft className="w-4 h-4 mr-2" /> {t('learningSchedule.step2.backButton')}
                </Button>
                <Button
                  size="lg"
                  onClick={() => {
                    setMaxStepReached(prev => Math.max(prev, 3))
                    setStep(3)
                  }}
                  className="px-8"
                >
                  {t('learningSchedule.step2.nextButton')} <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Notifikasi */}
          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-base">{t('learningSchedule.step3.learningMaterial')}</Label>

                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      Tambah Learning Material sesuai periode.
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
                      Tambah Learning Material
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {materials.map((m, idx) => (
                      <div key={idx} className={`rounded-lg border p-4 space-y-3 ${idx === activeMaterialIndex ? 'border-primary bg-primary/5' : 'bg-muted/10'}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold">Card {idx + 1}</div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMaterial(idx)}
                            disabled={materials.length <= 1}
                          >
                            Hapus
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-sm">Start</Label>
                            <Input
                              type="date"
                              value={m.startDate}
                              min={(() => {
                                const scheduleStart = String(startDate || '').trim()
                                if (!scheduleStart) return undefined
                                if (idx <= 0) return scheduleStart
                                const prevEnd = String(materials[idx - 1]?.endDate || '').trim()
                                const prevBound = prevEnd ? addDaysISO(prevEnd, 1) : ''
                                return maxIso(scheduleStart, prevBound)
                              })()}
                              max={(() => {
                                const scheduleEnd = String(endDate || '').trim()
                                if (!scheduleEnd) return undefined
                                const curEnd = String(m.endDate || '').trim()
                                return curEnd ? minIso(scheduleEnd, curEnd) : scheduleEnd
                              })()}
                              onChange={(e) => {
                                const scheduleStart = String(startDate || '').trim()
                                const scheduleEnd = String(endDate || '').trim()
                                const prevEnd = idx > 0 ? String(materials[idx - 1]?.endDate || '').trim() : ''
                                const minStart = prevEnd ? maxIso(scheduleStart, addDaysISO(prevEnd, 1)) : scheduleStart
                                const nextStart = clampIso(e.target.value, minStart, scheduleEnd)
                                const curEnd = String(materials[idx]?.endDate || '').trim() || scheduleEnd
                                const nextEnd = clampIso(curEnd, nextStart, scheduleEnd)
                                updateMaterial(idx, { startDate: nextStart, endDate: nextEnd })
                              }}
                              onFocus={() => setActiveMaterialIndex(idx)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-sm">End</Label>
                            <Input
                              type="date"
                              value={m.endDate}
                              min={(() => {
                                const scheduleStart = String(startDate || '').trim()
                                const curStart = String(m.startDate || '').trim()
                                return scheduleStart ? maxIso(scheduleStart, curStart) : curStart
                              })()}
                              max={String(endDate || '').trim() || undefined}
                              onChange={(e) => {
                                const scheduleStart = String(startDate || '').trim()
                                const scheduleEnd = String(endDate || '').trim()
                                const curStart = String(materials[idx]?.startDate || '').trim()
                                const minEnd = scheduleStart ? maxIso(scheduleStart, curStart) : curStart
                                const nextEnd = clampIso(e.target.value, minEnd, scheduleEnd)
                                updateMaterial(idx, { endDate: nextEnd })
                              }}
                              onFocus={() => setActiveMaterialIndex(idx)}
                            />
                          </div>
                        </div>

                        {mediaType !== 'VIDEO' ? (
                          <div className="space-y-1">
                            <Label className="text-sm">{t('learningSchedule.step3.learningMaterial')}</Label>
                            <div className="flex gap-2">
                              <Input
                                value={m.learningCode}
                                onChange={(e) => updateMaterial(idx, { learningCode: e.target.value, previewUrl: null })}
                                onFocus={() => setActiveMaterialIndex(idx)}
                                placeholder={t('learningSchedule.step3.learningMaterialPlaceholder')}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setActiveMaterialIndex(idx)
                                  setCodeDialogTarget({ kind: 'MATERIAL', index: idx })
                                  setCodeSearch(m.learningCode)
                                  setCodeDialogOpen(true)
                                  loadLearningCodes(mediaType)
                                }}
                              >
                                {t('learningSchedule.step3.browseButton')}
                              </Button>
                            </div>

                            {m.previewUrl && (
                              <div className="mt-3 rounded-lg border bg-muted/10 p-3">
                                <div className="text-xs text-muted-foreground mb-2">{t('learningSchedule.step3.previewMedia')}</div>
                                {mediaType === 'IMAGE' && (
                                  <div className="space-y-3">
                                    <div className="flex justify-center">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={m.previewUrl} alt="Preview" className="max-h-60 rounded shadow-sm" />
                                    </div>
                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                      <a
                                        href={m.previewUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 text-primary hover:underline bg-background px-4 py-2 rounded-md border shadow-sm"
                                      >
                                        <ImageIcon className="w-4 h-4" />
                                        {t('learningSchedule.step3.openFilePreview')}
                                      </a>
                                      <a
                                        href={m.previewUrl}
                                        download
                                        className="flex items-center gap-2 text-primary hover:underline bg-background px-4 py-2 rounded-md border shadow-sm"
                                      >
                                        <File className="w-4 h-4" />
                                        Download
                                      </a>
                                    </div>
                                  </div>
                                )}

                                {mediaType === 'PDF' && (
                                  <div className="space-y-3">
                                    <iframe src={m.previewUrl} className="w-full h-72 rounded border bg-background" />
                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                      <a
                                        href={m.previewUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 text-primary hover:underline bg-background px-4 py-2 rounded-md border shadow-sm"
                                      >
                                        <FileText className="w-4 h-4" />
                                        {t('learningSchedule.step3.openFilePreview')}
                                      </a>
                                      <a
                                        href={m.previewUrl}
                                        download
                                        className="flex items-center gap-2 text-primary hover:underline bg-background px-4 py-2 rounded-md border shadow-sm"
                                      >
                                        <File className="w-4 h-4" />
                                        Download
                                      </a>
                                    </div>
                                  </div>
                                )}

                                {mediaType === 'PPT' && (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                      <File className="w-4 h-4" />
                                      PowerPoint
                                    </div>
                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                      <a
                                        href={m.previewUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 text-primary hover:underline bg-background px-4 py-2 rounded-md border shadow-sm"
                                      >
                                        <File className="w-4 h-4" />
                                        {t('learningSchedule.step3.openFilePreview')}
                                      </a>
                                      <a
                                        href={m.previewUrl}
                                        download
                                        className="flex items-center gap-2 text-primary hover:underline bg-background px-4 py-2 rounded-md border shadow-sm"
                                      >
                                        <File className="w-4 h-4" />
                                        Download
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {(() => {
                              const matTab = (videoMaterialTabByCard[idx] || 'M1') as VideoMaterialTab
                              const scriptTab = (videoScriptTabByCard[idx] || 'script') as VideoScriptTab
                              const finalScript = [m.videoTextTemplate1, m.videoTextTemplate2, m.videoTextTemplate3, m.videoTextTemplate4]
                                .map(s => String(s || '').trim())
                                .filter(Boolean)
                                .join('\n\n')

                              const codeValue = matTab === 'M1' ? m.videoLearningCode1
                                : matTab === 'M2' ? m.videoLearningCode2
                                  : matTab === 'M3' ? m.videoLearningCode3
                                    : matTab === 'M4' ? m.videoLearningCode4
                                      : ''

                              const scriptValue = matTab === 'M1' ? m.videoTextTemplate1
                                : matTab === 'M2' ? m.videoTextTemplate2
                                  : matTab === 'M3' ? m.videoTextTemplate3
                                    : matTab === 'M4' ? m.videoTextTemplate4
                                      : finalScript

                              const setMatTab = (v: VideoMaterialTab) => {
                                setActiveMaterialIndex(idx)
                                setVideoMaterialTabByCard(prev => ({ ...prev, [idx]: v }))
                              }

                              const setScriptTab = (v: VideoScriptTab) => {
                                setActiveMaterialIndex(idx)
                                setVideoScriptTabByCard(prev => ({ ...prev, [idx]: v }))
                              }

                              const onBrowse = () => {
                                if (matTab === 'FINAL') return
                                const part: 1 | 2 | 3 | 4 = matTab === 'M1' ? 1 : matTab === 'M2' ? 2 : matTab === 'M3' ? 3 : 4
                                const category = matTab === 'M1' ? 'VIDEO_1' : matTab === 'M2' ? 'VIDEO_2' : matTab === 'M3' ? 'VIDEO_3' : 'VIDEO_4'
                                setActiveMaterialIndex(idx)
                                setCodeDialogTarget({ kind: 'MATERIAL_VIDEO', index: idx, part })
                                setCodeSearch(String(codeValue || ''))
                                setCodeDialogOpen(true)
                                loadLearningCodes('VIDEO', { videoCategory: category as any })
                              }

                              const onChangeCode = (v: string) => {
                                setActiveMaterialIndex(idx)
                                if (matTab === 'M1') updateMaterial(idx, { videoLearningCode1: v })
                                if (matTab === 'M2') updateMaterial(idx, { videoLearningCode2: v })
                                if (matTab === 'M3') updateMaterial(idx, { videoLearningCode3: v })
                                if (matTab === 'M4') updateMaterial(idx, { videoLearningCode4: v })
                              }

                              const onChangeScript = (v: string) => {
                                setActiveMaterialIndex(idx)
                                if (matTab === 'M1') updateMaterial(idx, { videoTextTemplate1: v })
                                if (matTab === 'M2') updateMaterial(idx, { videoTextTemplate2: v })
                                if (matTab === 'M3') updateMaterial(idx, { videoTextTemplate3: v })
                                if (matTab === 'M4') updateMaterial(idx, { videoTextTemplate4: v })
                              }

                              return (
                                <div className="rounded-lg border bg-muted/10 p-4 space-y-4">
                                  <Tabs value={matTab} onValueChange={(v) => setMatTab(v as VideoMaterialTab)} className="w-full">
                                    <TabsList className="w-full justify-start flex-wrap h-auto">
                                      <TabsTrigger value="M1">Learning Material 1</TabsTrigger>
                                      <TabsTrigger value="M2">Learning Material 2</TabsTrigger>
                                      <TabsTrigger value="M3">Learning Material 3</TabsTrigger>
                                      <TabsTrigger value="M4">Learning Material 4</TabsTrigger>
                                      <TabsTrigger value="FINAL">Final</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value={matTab} className="mt-4 space-y-4">
                                      {matTab !== 'FINAL' ? (
                                        <div className="space-y-1">
                                          <Label className="text-sm">{t('learningSchedule.step3.learningMaterial')}</Label>
                                          <div className="flex gap-2">
                                            <Input
                                              value={String(codeValue || '')}
                                              onChange={(e) => onChangeCode(e.target.value)}
                                              placeholder={t('learningSchedule.step3.learningMaterialPlaceholder')}
                                            />
                                            <Button type="button" variant="outline" onClick={onBrowse}>
                                              {t('learningSchedule.step3.browseButton')}
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-sm text-muted-foreground">
                                          Final akan menggabungkan Video Script dari Learning Material 1-4.
                                        </div>
                                      )}

                                      <Tabs value={scriptTab} onValueChange={(v) => setScriptTab(v as VideoScriptTab)} className="w-full">
                                        <TabsList className="w-full justify-start">
                                          <TabsTrigger value="script">Video Script (D-ID)</TabsTrigger>
                                          <TabsTrigger value="generate">Generate Idea</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="script" className="mt-4">
                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between gap-3">
                                              <Label className="text-sm">{t('learningSchedule.step3.videoScript')}</Label>
                                              <div className="text-xs text-muted-foreground font-mono">
                                                {allowedPlaceholdersLoading
                                                  ? '...'
                                                  : (allowedPlaceholders && allowedPlaceholders.length > 0
                                                    ? allowedPlaceholders.join(' ')
                                                    : ':name :agentCode :companyName :learningName')}
                                              </div>
                                            </div>
                                            <Textarea
                                              value={String(scriptValue || '')}
                                              onChange={(e) => onChangeScript(e.target.value)}
                                              rows={7}
                                              className="resize-none font-mono text-sm"
                                              placeholder={t('learningSchedule.step3.videoScriptPlaceholder')}
                                              readOnly={matTab === 'FINAL'}
                                            />
                                            <p className="text-xs text-muted-foreground">{t('learningSchedule.step3.videoScriptNote')}</p>
                                          </div>
                                        </TabsContent>

                                        <TabsContent value="generate" className="mt-4">
                                          <div className="space-y-3">
                                            <div className="flex items-center justify-between gap-3">
                                              <Label className="text-sm">AI Generator</Label>
                                              <div className="flex items-center gap-2">
                                                <Select value={ideaLanguage} onValueChange={(v) => setIdeaLanguage(v as any)}>
                                                  <SelectTrigger className="h-8 w-[140px] text-xs">
                                                    <SelectValue placeholder="Language" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="id">Indonesia</SelectItem>
                                                    <SelectItem value="en">English</SelectItem>
                                                    <SelectItem value="ja">日本語</SelectItem>
                                                    <SelectItem value="ko">한국어</SelectItem>
                                                    <SelectItem value="zh">中文</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  onClick={() => onGenerateVideoIdea(idx, matTab)}
                                                  disabled={generatingVideoIdea || matTab === 'FINAL'}
                                                >
                                                  {generatingVideoIdea ? (
                                                    <>
                                                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Zap className="h-3.5 w-3.5 mr-1.5" /> Generate & Apply
                                                    </>
                                                  )}
                                                </Button>
                                              </div>
                                            </div>

                                            <Textarea
                                              value={String(videoIdeaPromptByCard[idx] || '')}
                                              onChange={(e) => setVideoIdeaPromptByCard(prev => ({ ...prev, [idx]: e.target.value }))}
                                              rows={6}
                                              className="resize-none text-sm"
                                              placeholder="Prompt (opsional)."
                                              readOnly={matTab === 'FINAL'}
                                            />
                                          </div>
                                        </TabsContent>
                                      </Tabs>
                                    </TabsContent>
                                  </Tabs>
                                </div>
                              )
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {mediaType === 'VIDEO' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label className="text-base">{t('learningSchedule.step3.avatar')}</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAvatarDialogOpen(true)
                            setAvatarPage(1)
                            setAvatarSearch('')
                            if (presenters.length === 0 && !presentersLoading) {
                              loadPresenters()
                            }
                          }}
                        >
                          {t('learningSchedule.step3.chooseAvatar')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDidPresenterId('')
                            setDidPresenterName('')
                          }}
                          disabled={!didPresenterId && !didPresenterName}
                        >
                          {t('learningSchedule.step3.clearAvatar')}
                        </Button>
                      </div>
                    </div>

                    {(() => {
                      const selected = presenters.find(p => String(p.presenter_id || '') === String(didPresenterId || '')) || null
                      const thumb = selected?.thumbnail_url || ''
                      const name = (didPresenterName || selected?.presenter_name || '').trim()

                      return (
                        <div className="rounded-lg border bg-muted/10 p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                              {thumb ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={thumb} alt={name || 'Avatar'} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-xs text-muted-foreground">D-ID</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">
                                {name || t('learningSchedule.step3.avatarNotSelected')}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono truncate">
                                {(didPresenterId || '').trim() || '-'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                <div className="rounded-lg border bg-muted/10 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-base">WhatsApp</Label>
                    <div className="text-xs text-muted-foreground font-mono">
                      {allowedPlaceholdersLoading
                        ? '...'
                        : (allowedPlaceholders && allowedPlaceholders.length > 0
                          ? allowedPlaceholders.join(' ')
                          : ':name :agentCode :companyName :learningName')}
                    </div>
                  </div>

                  <Tabs value={waTab} onValueChange={(v) => setWaTab(v as any)} className="w-full">
                    <TabsList className="w-full justify-start">
                      <TabsTrigger value="text">WhatsApp Text</TabsTrigger>
                      <TabsTrigger value="generate">WhatsApp Generate</TabsTrigger>
                    </TabsList>

                    <TabsContent value="text" className="mt-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Message Template</Label>
                        <Textarea
                          value={waMessageTemplate}
                          onChange={e => setWaMessageTemplate(e.target.value)}
                          rows={8}
                          className="resize-none font-mono text-sm"
                          placeholder={t('learningSchedule.step3.whatsappMessagePlaceholder')}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="generate" className="mt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <Label className="text-sm">AI Generator</Label>
                          <div className="flex items-center gap-2">
                            <Select value={ideaLanguage} onValueChange={(v) => setIdeaLanguage(v as any)}>
                              <SelectTrigger className="h-8 w-[140px] text-xs">
                                <SelectValue placeholder="Language" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="id">Indonesia</SelectItem>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="ja">日本語</SelectItem>
                                <SelectItem value="ko">한국어</SelectItem>
                                <SelectItem value="zh">中文</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button type="button" size="sm" onClick={onGenerateWhatsAppNotification} disabled={generatingWa}>
                              {generatingWa ? (
                                <>
                                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating
                                </>
                              ) : (
                                <>
                                  <Zap className="h-3.5 w-3.5 mr-1.5" /> Generate & Apply
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        <Textarea
                          value={waIdeaPrompt}
                          onChange={(e) => setWaIdeaPrompt(e.target.value)}
                          rows={6}
                          className="resize-none text-sm"
                          placeholder="Prompt (opsional)."
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

              </div>

              <div className="flex justify-between pt-8 border-t">
                <Button variant="outline" size="lg" onClick={() => setStep(2)}>
                  <ChevronLeft className="w-4 h-4 mr-2" /> {t('learningSchedule.step3.backButton')}
                </Button>
                <Button size="lg" onClick={handleSave} disabled={loading} className="px-8 bg-green-600 hover:bg-green-700">
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> {t('learningSchedule.step3.saving')}
                    </>
                  ) : (
                    <>
                      {t('learningSchedule.step3.saveButton')} <Check className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Browse Dialog */}
      <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('learningSchedule.browseDialog.title')} ({mediaType})</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{t('learningSchedule.browseDialog.searchLabel')}</Label>
            <Input
              value={codeSearch}
              onChange={e => setCodeSearch(e.target.value)}
              placeholder={t('learningSchedule.browseDialog.searchPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">{t('learningSchedule.browseDialog.searchHint')}</p>
          </div>
          <div className="max-h-[60vh] overflow-auto border rounded-md">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[150px]">{t('learningSchedule.browseDialog.code')}</TableHead>
                  <TableHead>{t('learningSchedule.browseDialog.title_column')}</TableHead>
                  <TableHead>{t('learningSchedule.browseDialog.duration')}</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCodeRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      {t('learningSchedule.browseDialog.noData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCodeRows.map((r: any) => (
                    <TableRow key={String(r.id)} className="hover:bg-muted/5">
                      <TableCell className="font-mono text-xs font-medium">{r.code}</TableCell>
                      <TableCell>{r.title || '-'}</TableCell>
                      <TableCell>{r.duration || '-'}</TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => onSelectCode(r)}>{t('learningSchedule.browseDialog.selectButton')}</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCodeDialogOpen(false)}>{t('learningSchedule.browseDialog.closeButton')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Avatar Dialog */}
      <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
        <DialogContent className="w-[95vw] max-w-4xl h-[85vh] flex flex-col p-4">
          <DialogHeader>
            <DialogTitle className="text-sm">{t('learningSchedule.step3.availableAvatars')} ({presenters.length})</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2 py-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={t('learningSchedule.step3.searchAvatar')}
                value={avatarSearch}
                onChange={e => {
                  setAvatarSearch(e.target.value)
                  setAvatarPage(1)
                }}
                className="pl-8 h-8 text-xs"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={loadPresenters}
              disabled={presentersLoading}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${presentersLoading ? 'animate-spin' : ''}`} />
              {t('learningSchedule.step3.refreshAvatars')}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {presentersLoading ? (
              <div className="text-xs text-muted-foreground py-8 text-center">{t('learningSchedule.step3.loadingAvatars')}</div>
            ) : presenters.length === 0 ? (
              <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded">
                {t('learningSchedule.step3.noAvatars')}{' '}
                <a
                  href="https://studio.d-id.com/avatars/create"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {t('learningSchedule.step3.createAtDID')}
                </a>
              </div>
            ) : (
              (() => {
                const filtered = presenters.filter(p =>
                  !avatarSearch || (String(p.presenter_name || '')).toLowerCase().includes(avatarSearch.toLowerCase())
                )
                const totalPages = Math.max(1, Math.ceil(filtered.length / AVATARS_PER_PAGE))
                const startIdx = (avatarPage - 1) * AVATARS_PER_PAGE
                const paginated = filtered.slice(startIdx, startIdx + AVATARS_PER_PAGE)

                return (
                  <>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {paginated.map(p => {
                        const id = String(p.presenter_id || '')
                        const isSelected = id && id === String(didPresenterId || '')
                        return (
                          <div
                            key={id || String(p.presenter_name || '')}
                            className={`border rounded-lg overflow-hidden cursor-pointer transition bg-background hover:border-primary ${isSelected ? 'border-primary ring-2 ring-primary/20' : ''}`}
                            onClick={() => {
                              setDidPresenterId(id)
                              setDidPresenterName(String(p.presenter_name || ''))
                              setAvatarDialogOpen(false)
                            }}
                          >
                            {p.thumbnail_url ? (
                              <div className="relative aspect-square">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={p.thumbnail_url} alt={p.presenter_name} className="w-full h-full object-cover" />
                                {isSelected && (
                                  <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                                    <div className="text-[10px] font-medium bg-primary text-primary-foreground px-2 py-1 rounded">
                                      {t('learningSchedule.step3.selected')}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="aspect-square bg-muted flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">D-ID</span>
                              </div>
                            )}
                            <div className="p-1.5 text-center border-t">
                              <span className="text-[10px] font-medium truncate block">{p.presenter_name || t('learningSchedule.step3.avatar')}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setAvatarPage(p => Math.max(1, p - 1))}
                          disabled={avatarPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground">{avatarPage} / {totalPages}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setAvatarPage(p => Math.min(totalPages, p + 1))}
                          disabled={avatarPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {filtered.length === 0 && (
                      <div className="text-center py-8 text-xs text-muted-foreground">{t('learningSchedule.step3.notFoundAvatar')}</div>
                    )}
                  </>
                )
              })()
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAvatarDialogOpen(false)}>{t('learningSchedule.step3.closeAvatarDialog')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {renderSendNowDialog()}
    </div>
  )
}
