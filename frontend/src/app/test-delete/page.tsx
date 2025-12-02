'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { beritaAPI, Berita } from '@/lib/api'
import { toast } from 'sonner'

export default function TestDeletePage() {
  const [beritaList, setBeritaList] = useState<Berita[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)

  // Fetch berita list
  const fetchBerita = async () => {
    try {
      setLoading(true)
      const response = await beritaAPI.getAllBerita()
      setBeritaList(response.content || [])
    } catch (error) {
      console.error('Error fetching berita:', error)
      toast.error('Gagal memuat data berita')
    } finally {
      setLoading(false)
    }
  }

  // Delete berita function with detailed logging
  const handleDelete = async (id: number, judul: string) => {
    console.log(`=== Starting delete process for berita ID: ${id}, Title: ${judul} ===`)
    
    try {
      setDeleting(id)
      
      console.log('Calling beritaAPI.deleteBerita...')
      const result = await beritaAPI.deleteBerita(id)
      console.log('Delete API result:', result)
      
      toast.success(`Berita "${judul}" berhasil dihapus`)
      console.log('✅ Delete successful, refreshing data...')
      
      // Refresh data
      await fetchBerita()
      console.log('✅ Data refreshed')
        } catch (error) {
      console.error('❌ Error deleting berita:', error)
      toast.error(`Gagal menghapus berita: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDeleting(null)
    }
  }

  useEffect(() => {
    fetchBerita()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-6">
            <p>Loading berita...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Test Delete Berita Functionality</CardTitle>
          <p className="text-sm text-gray-600">
            Total berita: {beritaList.length}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {beritaList.length === 0 ? (
              <p className="text-gray-500">Tidak ada berita tersedia</p>
            ) : (
              beritaList.map((berita) => (
                <div key={berita.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{berita.judul}</h3>
                    <p className="text-sm text-gray-500">
                      ID: {berita.id} | Status: {berita.status} | Penulis: {berita.penulis}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(berita.id, berita.judul)}
                    disabled={deleting === berita.id}
                  >
                    {deleting === berita.id ? 'Menghapus...' : 'Hapus'}
                  </Button>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <Button onClick={fetchBerita} variant="outline">
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
