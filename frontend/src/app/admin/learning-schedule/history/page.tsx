'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { getCompanyCodeFromLocalStorage } from '@/lib/companyProfileLocal'
import { showErrorToast } from '@/components/ui/toast-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
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
import { LearningScheduleService, type LearningScheduleHistory, type LearningScheduleHistoryItem } from '@/services/learningScheduleService'

function fmtDateTime(value?: string | null) {
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

export default function LearningScheduleHistoryPage() {
  const { user, isAuthenticated } = useAuth()
  const { t } = useLanguage()

  const companyCode = useMemo(() => {
    const fromLocal = getCompanyCodeFromLocalStorage(user?.id)
    return (fromLocal || user?.companyCode || '').trim()
  }, [user?.companyCode, user?.id])

  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [size] = useState(25)
  const [history, setHistory] = useState<LearningScheduleHistory[]>([])
  const [totalPages, setTotalPages] = useState(1)

  const [itemsDialogOpen, setItemsDialogOpen] = useState(false)
  const [selectedHistory, setSelectedHistory] = useState<LearningScheduleHistory | null>(null)
  const [items, setItems] = useState<LearningScheduleHistoryItem[]>([])

  const loadHistory = async () => {
    if (!companyCode) return
    setLoading(true)
    try {
      const res = await LearningScheduleService.listHistory(companyCode, page, size)
      setHistory(res?.content || [])
      setTotalPages(res?.totalPages || 1)
    } catch (e: any) {
      showErrorToast(e?.message || 'Gagal memuat histori')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, companyCode, page])

  const openItems = async (h: LearningScheduleHistory) => {
    setSelectedHistory(h)
    setItems([])
    setItemsDialogOpen(true)

    try {
      const res = await LearningScheduleService.listHistoryItems(companyCode, h.id, 0, 100)
      setItems(res?.content || [])
    } catch (e: any) {
      showErrorToast(e?.message || 'Gagal memuat detail histori')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('auth.login')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Login diperlukan.</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('nav.learningScheduleHistory')}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={companyCode ? 'secondary' : 'destructive'}>{companyCode || 'NO COMPANY CODE'}</Badge>
            <Button variant="outline" onClick={loadHistory} disabled={loading}>Refresh</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Started</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead>Skipped</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead className="w-[140px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>{fmtDateTime(h.startedAt)}</TableCell>
                    <TableCell>
                      <Badge variant={h.status === 'SUCCESS' ? 'default' : h.status === 'PARTIAL' ? 'secondary' : 'destructive'}>
                        {h.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{h.schedulerType}</TableCell>
                    <TableCell>{h.totalTargets}</TableCell>
                    <TableCell>{h.sentCount}</TableCell>
                    <TableCell>{h.failedCount}</TableCell>
                    <TableCell>{h.skippedCount}</TableCell>
                    <TableCell className="text-xs max-w-[260px] truncate" title={h.errorMessage || ''}>{h.errorMessage || '-'}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openItems(h)}>Detail</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-xs text-muted-foreground">Page {page + 1} / {totalPages}</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page <= 0}>Prev</Button>
              <Button variant="outline" onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))} disabled={page + 1 >= totalPages}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={itemsDialogOpen} onOpenChange={setItemsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detail Histori • {selectedHistory?.id || '-'}</DialogTitle>
          </DialogHeader>

          {selectedHistory?.errorMessage ? (
            <div className="rounded-md border bg-destructive/5 p-3 text-xs text-destructive">
              {selectedHistory.errorMessage}
            </div>
          ) : null}

          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent Code</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Policy Last Date</TableHead>
                  <TableHead>Media</TableHead>
                  <TableHead>Learning Code</TableHead>
                  <TableHead>WA Status</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-mono text-xs">{it.agentCode || '-'}</TableCell>
                    <TableCell>{it.fullName || '-'}</TableCell>
                    <TableCell className="text-xs">{it.phoneNo || '-'}</TableCell>
                    <TableCell className="text-xs">{it.policyLastDate || '-'}</TableCell>
                    <TableCell className="text-xs">{it.mediaType || '-'}</TableCell>
                    <TableCell className="text-xs font-mono">{it.learningCode || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={it.waStatus === 'SENT' ? 'default' : it.waStatus === 'SKIPPED' ? 'secondary' : 'destructive'}>
                        {it.waStatus || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-[260px] truncate" title={it.errorMessage || ''}>{it.errorMessage || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setItemsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
