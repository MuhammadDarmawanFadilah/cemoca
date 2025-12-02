'use client'

import ParticipantsTable from '@/components/ParticipantsTable'

export default function TestParticipantsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Participants Table</h1>
      <ParticipantsTable pelaksanaanId={1} />
    </div>
  )
}
