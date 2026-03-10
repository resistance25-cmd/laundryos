// src/app/admin/support/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { MessageSquare, Loader2, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import type { SupportTicket } from '@/types'

function first<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null
  return Array.isArray(val) ? (val[0] ?? null) : val
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selected, setSelected] = useState<SupportTicket | null>(null)
  const [reply, setReply] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [sending, setSending] = useState<boolean>(false)
  const [filterStatus, setFilterStatus] = useState<string>('open')

  const supabase = createClient()

  useEffect(() => {
    async function load(): Promise<void> {
      const { data } = await supabase
        .from('support_tickets')
        .select('*, user:users(name, phone)')
        .order('created_at', { ascending: false })
      setTickets((data as unknown as SupportTicket[]) || [])
      setLoading(false)
    }
    void load()
  }, [])

  async function handleReply(): Promise<void> {
    if (!reply.trim() || !selected || sending) return
    setSending(true)

    const newMessage = { role: 'admin' as const, message: reply.trim(), timestamp: new Date().toISOString() }
    const updatedConversation = [...(selected.conversation || []), newMessage]

    const { error } = await supabase
      .from('support_tickets')
      .update({ conversation: updatedConversation, status: 'in_progress' })
      .eq('id', selected.id)

    if (error) { toast.error('Failed to send reply'); setSending(false); return }

    setSelected({ ...selected, conversation: updatedConversation, status: 'in_progress' })
    setTickets((prev) => prev.map((t) => t.id === selected.id ? { ...t, conversation: updatedConversation, status: 'in_progress' } : t))
    setReply('')
    setSending(false)
    toast.success('Reply sent')
  }

  async function handleResolve(): Promise<void> {
    if (!selected) return
    const { error } = await supabase.from('support_tickets').update({ status: 'resolved' }).eq('id', selected.id)
    if (error) { toast.error('Failed to resolve'); return }
    setSelected({ ...selected, status: 'resolved' })
    setTickets((prev) => prev.map((t) => t.id === selected.id ? { ...t, status: 'resolved' } : t))
    toast.success('Ticket resolved')
  }

  const filtered = filterStatus === 'all' ? tickets : tickets.filter((t) => t.status === filterStatus)

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#6366F1' }} /></div>

  const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    open:        { bg: 'rgba(99,102,241,0.15)', text: '#818CF8' },
    in_progress: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
    resolved:    { bg: 'rgba(5,150,105,0.2)',   text: '#059669' },
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4" style={{ color: '#F1F5F9' }}>Support</h1>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['open', 'in_progress', 'resolved', 'all'].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className="px-3 py-1.5 rounded-full text-xs font-medium capitalize"
            style={{
              background: filterStatus === s ? 'rgba(99,102,241,0.2)' : '#13151C',
              color: filterStatus === s ? '#818CF8' : '#64748B',
              border: '1px solid #1E2130',
            }}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Ticket list */}
        <div className="admin-card rounded-xl overflow-hidden h-fit">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: '#6366F1' }} />
              <p className="text-sm" style={{ color: '#64748B' }}>No tickets</p>
            </div>
          ) : (
            filtered.map((ticket) => {
              const colors = STATUS_COLORS[ticket.status] || STATUS_COLORS.open
              const user = first(ticket.user as { name: string; phone: string } | { name: string; phone: string }[] | undefined)
              return (
                <button key={ticket.id} onClick={() => setSelected(ticket)}
                  className="w-full text-left px-4 py-3 hover:bg-white hover:bg-opacity-5 transition-colors"
                  style={{
                    borderBottom: '1px solid #1E2130',
                    background: selected?.id === ticket.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                  }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#F1F5F9' }}>{ticket.subject}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                        {user?.name || 'Unknown'} · {format(new Date(ticket.created_at), 'd MMM')}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
                      style={{ background: colors.bg, color: colors.text }}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Ticket detail */}
        {selected ? (
          <div className="admin-card rounded-xl flex flex-col">
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #1E2130' }}>
              <p className="font-semibold" style={{ color: '#F1F5F9' }}>{selected.subject}</p>
              <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                {format(new Date(selected.created_at), 'd MMM yyyy, h:mm a')}
              </p>
            </div>
            {/* Messages */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-80">
              {(selected.conversation || []).map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-xs rounded-xl px-3 py-2 text-sm"
                    style={{
                      background: msg.role === 'admin' ? 'rgba(99,102,241,0.2)' : '#1E2130',
                      color: '#F1F5F9',
                    }}>
                    <p>{msg.message}</p>
                    <p className="text-xs mt-1 opacity-50">{format(new Date(msg.timestamp), 'h:mm a')}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Reply */}
            {selected.status !== 'resolved' && (
              <div className="p-4 space-y-2" style={{ borderTop: '1px solid #1E2130' }}>
                <textarea value={reply}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReply(e.target.value)}
                  placeholder="Type a reply…" rows={2}
                  className="admin-input w-full resize-none" />
                <div className="flex gap-2">
                  <button onClick={() => void handleReply()} disabled={sending || !reply.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white flex-1"
                    style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Reply</>}
                  </button>
                  <button onClick={() => void handleResolve()}
                    className="px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: 'rgba(5,150,105,0.2)', color: '#059669' }}>
                    Resolve
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="admin-card rounded-xl p-10 flex items-center justify-center">
            <p className="text-sm" style={{ color: '#64748B' }}>Select a ticket to view</p>
          </div>
        )}
      </div>
    </div>
  )
}
