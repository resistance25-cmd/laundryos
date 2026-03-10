// src/app/(customer)/support/page.tsx
'use client'

import { useState, useEffect, FormEvent, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Send, Loader2, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import type { SupportTicket } from '@/types'

function SupportContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [userId, setUserId] = useState<string>('')
  const [subject, setSubject] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [showForm, setShowForm] = useState<boolean>(false)

  const supabase = createClient()

  useEffect(() => {
    async function load(): Promise<void> {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      setUserId(session.user.id)

      const { data } = await supabase
        .from('support_tickets')
        .select('id, subject, status, created_at, conversation')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      setTickets((data as SupportTicket[]) || [])
      setLoading(false)

      if (orderId) {
        setShowForm(true)
        setSubject(`Help with order ${orderId}`)
      }
    }
    void load()
  }, [orderId])

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) { toast.error('Please fill in all fields'); return }
    setSubmitting(true)

    try {
      const { data, error } = await supabase.from('support_tickets').insert({
        user_id: userId,
        order_id: orderId || null,
        subject: subject.trim(),
        status: 'open',
        conversation: [{ role: 'user', message: message.trim(), timestamp: new Date().toISOString() }],
      }).select('id, subject, status, created_at, conversation').single()

      if (error) { toast.error('Failed to submit ticket'); return }
      setTickets((prev) => [data as SupportTicket, ...prev])
      toast.success('Support ticket created!')
      setSubject(''); setMessage(''); setShowForm(false)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="customer-dark min-h-screen flex items-center justify-center">
    <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#6366F1' }} />
  </div>

  const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
    open:        { bg: 'rgba(99,102,241,0.15)', text: '#818CF8' },
    in_progress: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
    resolved:    { bg: 'rgba(5,150,105,0.2)',   text: '#059669' },
  }

  return (
    <div className="customer-dark min-h-screen pb-10">
      <header className="sticky top-0 z-10 glass-dark px-4 pt-12 pb-4 safe-top">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { window.location.href = '/dashboard' }}
              className="p-2 rounded-full" style={{ background: '#1A1E30' }} aria-label="Back">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Support</h1>
          </div>
          <button onClick={() => setShowForm(true)}
            className="px-3 py-2 rounded-full text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
            New Ticket
          </button>
        </div>
      </header>

      <div className="px-4 max-w-lg mx-auto pt-4 space-y-4">
        {/* New ticket form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-2xl p-5 space-y-4"
            style={{ background: '#10131F', border: '1.5px solid #6366F1' }}>
            <h3 className="font-semibold text-white">New Support Request</h3>
            <input type="text" value={subject}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
              placeholder="Subject" className="input-dark" required />
            <textarea value={message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
              placeholder="Describe your issue..." rows={4} className="input-dark resize-none" required />
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Submit</>}
              </button>
            </div>
          </form>
        )}

        {/* Ticket list */}
        {tickets.length === 0 && !showForm && (
          <div className="text-center py-16">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: '#6366F1' }} />
            <p className="font-semibold text-white">No support tickets</p>
            <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Need help? Create a ticket.</p>
          </div>
        )}

        {tickets.map((ticket) => {
          const styles = STATUS_STYLES[ticket.status] || STATUS_STYLES.open
          return (
            <div key={ticket.id} className="rounded-2xl p-4"
              style={{ background: '#10131F', border: '1px solid #1E2340' }}>
              <div className="flex items-start justify-between mb-2">
                <p className="font-medium text-white text-sm">{ticket.subject}</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium ml-2 flex-shrink-0"
                  style={{ background: styles.bg, color: styles.text }}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs" style={{ color: '#64748B' }}>
                {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function SupportPage() {
  return <Suspense fallback={
    <div className="customer-dark min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#6366F1' }} />
    </div>
  }><SupportContent /></Suspense>
}
