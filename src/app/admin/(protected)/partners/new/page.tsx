// src/app/admin/partners/new/page.tsx
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Add Partner' }
export default function NewPartnerPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-5" style={{ color: '#F1F5F9' }}>Add Laundry Partner</h1>
      <div className="admin-card rounded-xl p-8 text-center">
        <p style={{ color: '#64748B' }}>Partner onboarding form — coming soon</p>
      </div>
    </div>
  )
}
