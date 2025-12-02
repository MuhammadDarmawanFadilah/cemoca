'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Users, 
  UserCheck, 
  UserX,
  Search,
  Edit2,
  Save,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/config'

interface ParticipantSummary {
  biografiId: number
  namaLengkap: string
  hadir: boolean
  catatan?: string
}

interface ParticipantsTableProps {
  pelaksanaanId: number
  className?: string
}

export default function ParticipantsTable({ pelaksanaanId, className = '' }: ParticipantsTableProps) {
  const [participants, setParticipants] = useState<ParticipantSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editCatatan, setEditCatatan] = useState('')

  useEffect(() => {
    loadParticipants()
  }, [pelaksanaanId])

  const loadParticipants = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`/api/pelaksanaan/${pelaksanaanId}/participants`))
      if (response.ok) {
        const data = await response.json()
        setParticipants(data)
      }
    } catch (error) {
      console.error('Error loading participants:', error)
      toast.error('Gagal memuat data peserta')
    } finally {
      setLoading(false)
    }
  }

  const updateAttendance = async (biografiId: number, hadir: boolean, catatan?: string) => {
    try {
      const response = await fetch(
        getApiUrl(`/api/pelaksanaan/${pelaksanaanId}/participants/${biografiId}?hadir=${hadir}&catatan=${encodeURIComponent(catatan || '')}`), 
        { method: 'PUT' }
      )
      if (response.ok) {
        await loadParticipants()
        toast.success('Status kehadiran berhasil diperbarui')
      }
    } catch (error) {
      console.error('Error updating attendance:', error)
      toast.error('Gagal memperbarui status kehadiran')
    }
  }

  const handleAttendanceToggle = (participant: ParticipantSummary) => {
    updateAttendance(participant.biografiId, !participant.hadir, participant.catatan)
  }

  const handleSaveNote = (participant: ParticipantSummary) => {
    updateAttendance(participant.biografiId, participant.hadir, editCatatan)
    setEditingId(null)
    setEditCatatan('')
  }

  const filteredParticipants = participants.filter(p =>
    p.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const hadirCount = participants.filter(p => p.hadir).length
  const totalCount = participants.length

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <CardTitle>Daftar Peserta</CardTitle>
            <Badge variant="outline" className="ml-2">
              {hadirCount}/{totalCount} Hadir
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama peserta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParticipants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    {searchTerm ? 'Tidak ada peserta yang ditemukan' : 'Belum ada peserta'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredParticipants.map((participant) => (
                  <TableRow key={participant.biografiId}>
                    <TableCell className="font-medium">
                      {participant.namaLengkap}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant={participant.hadir ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleAttendanceToggle(participant)}
                        className={participant.hadir ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {participant.hadir ? (
                          <>
                            <UserCheck className="w-3 h-3 mr-1" />
                            Hadir
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3 mr-1" />
                            Tidak Hadir
                          </>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      {editingId === participant.biografiId ? (
                        <div className="flex gap-2 items-center">
                          <Textarea
                            value={editCatatan}
                            onChange={(e) => setEditCatatan(e.target.value)}
                            placeholder="Tambahkan catatan..."
                            className="min-h-[60px] resize-none"
                          />
                          <div className="flex flex-col gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleSaveNote(participant)}
                              className="px-2"
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingId(null)
                                setEditCatatan('')
                              }}
                              className="px-2"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {participant.catatan || '-'}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingId !== participant.biografiId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingId(participant.biografiId)
                            setEditCatatan(participant.catatan || '')
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
          <span>
            Total: {filteredParticipants.length} peserta
            {searchTerm && ` (dari ${totalCount} total)`}
          </span>
          <span>
            Hadir: {filteredParticipants.filter(p => p.hadir).length} peserta
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
