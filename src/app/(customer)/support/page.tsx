'use client'

import { useState, useEffect, FormEvent, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Loader2, MessageCircle, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import type { SupportTicket } from '@/types'
import CustomerBottomNav from '@/components/app/CustomerBottomNav'

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
  }, [orderId, supabase])

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
      toast.success('Support ticket created')
      setSubject('')
      setMessage('')
      setShowForm(false)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="app-screen app-screen--customer flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--app-primary)' }} /></div>

  const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
    open: { bg: 'rgba(47,111,237,0.14)', text: '#2F6FED' },
    in_progress: { bg: 'rgba(245,158,11,0.14)', text: '#D97706' },
    resolved: { bg: 'rgba(22,163,74,0.14)', text: '#15803D' },
  }

  return (
    <div className="app-screen app-screen--customer">
      <header className="app-topbar safe-top">
        <div className="app-topbar__inner app-topbar__inner--phone flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => { window.location.href = '/profile' }} className="app-icon-wrap" aria-label="Back">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <span className="app-kicker">Support</span>
              <h1 className="app-title text-2xl">Customer help desk</h1>
            </div>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary">New ticket</button>
        </div>
      </header>

      <main className="app-shell app-shell--phone">
        {showForm ? (
          <form onSubmit={handleSubmit} className="app-panel space-y-4">
            <div>
              <span className="app-kicker">Raise a ticket</span>
              <h2 className="mt-2 text-xl font-bold" style={{ color: 'var(--app-text)' }}>Tell us what went wrong</h2>
            </div>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="input-dark" required />
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your issue" rows={4} className="input-dark resize-none" required />
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Submit</>}
              </button>
            </div>
          </form>
        ) : null}

        {tickets.length === 0 && !showForm ? (
          <div className="app-card app-empty">
            <MessageCircle className="h-12 w-12" />
            <h2 className="text-xl font-bold" style={{ color: 'var(--app-text)' }}>No support tickets</h2>
            <p className="app-note mt-2">If a pickup, payment, or delivery ever feels off, open a ticket here and track the response.</p>
          </div>
        ) : null}

        <div className="app-list mt-4">
          {tickets.map((ticket) => {
            const styles = STATUS_STYLES[ticket.status] || STATUS_STYLES.open
            return (
              <div key={ticket.id} className="app-card">
                <div className="app-card__row" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <p className="font-bold" style={{ color: 'var(--app-text)' }}>{ticket.subject}</p>
                    <p className="app-meta mt-2 text-sm">{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</p>
                  </div>
                  <span className="status-pill" style={{ background: styles.bg, color: styles.text }}>{ticket.status.replace('_', ' ')}</span>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      <CustomerBottomNav active="profile" />
    </div>
  )
}

export default function SupportPage() {
  return <Suspense fallback={<div className="app-screen app-screen--customer flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--app-primary)' }} /></div>}><SupportContent /></Suspense>
}
