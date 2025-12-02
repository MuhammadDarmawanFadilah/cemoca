'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { beritaAPI, imageAPI, type Berita } from '@/lib/api'

interface DebugData {
  list: Berita
  detail: Berita
}

export default function ImageDebugPage() {
  const [berita, setBerita] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBeritaData()
  }, [])

  const loadBeritaData = async () => {
    try {
      setLoading(true)
      // Get first berita from both APIs
      const listResponse = await beritaAPI.getPublishedBerita({ page: 0, size: 1 })
      const firstFromList = listResponse.content[0]
      
      const detailResponse = await beritaAPI.getBeritaById(firstFromList.id)
      
      setBerita({
        list: firstFromList,
        detail: detailResponse
      })
    } catch (error) {
      console.error('Error loading berita:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!berita) {
    return <div className="p-8">No berita found</div>
  }

  const listImageUrl = berita.list.gambarUrl ? imageAPI.getImageUrl(berita.list.gambarUrl) : null
  const detailImageUrl = berita.detail.gambarUrl ? imageAPI.getImageUrl(berita.detail.gambarUrl) : null

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Image URL Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">From Listing API (berita page)</h2>
          <p><strong>Raw gambarUrl:</strong> {berita.list.gambarUrl || 'null'}</p>
          <p><strong>Processed URL:</strong> {listImageUrl || 'null'}</p>
          {listImageUrl && (
            <div className="relative w-full aspect-video border">
              <Image
                src={listImageUrl}
                alt="From listing"
                fill
                className="object-contain"
              />
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">From Detail API (edit page)</h2>
          <p><strong>Raw gambarUrl:</strong> {berita.detail.gambarUrl || 'null'}</p>
          <p><strong>Processed URL:</strong> {detailImageUrl || 'null'}</p>
          {detailImageUrl && (
            <div className="relative w-full aspect-video border">
              <Image
                src={detailImageUrl}
                alt="From detail"
                fill
                className="object-contain"
              />
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Comparison</h3>
        <p><strong>URLs are identical:</strong> {listImageUrl === detailImageUrl ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Raw gambarUrl identical:</strong> {berita.list.gambarUrl === berita.detail.gambarUrl ? '✅ Yes' : '❌ No'}</p>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">API URLs</h3>
        <p><strong>Listing URL:</strong> {listImageUrl}</p>
        <p><strong>Detail URL:</strong> {detailImageUrl}</p>
      </div>
    </div>
  )
}
