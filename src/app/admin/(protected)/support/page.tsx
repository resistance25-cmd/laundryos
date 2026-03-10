'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { Loader2, MessageSquare, Send } from 'lucide-react'
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
  }, [supabase])

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
    setTickets((prev) => prev.map((ticket) => ticket.id === selected.id ? { ...ticket, conversation: updatedConversation, status: 'in_progress' } : ticket))
    setReply('')
    setSending(false)
    toast.success('Reply sent')
  }

  async function handleResolve(): Promise<void> {
    if (!selected) return
    const { error } = await supabase.from('support_tickets').update({ status: 'resolved' }).eq('id', selected.id)
    if (error) { toast.error('Failed to resolve'); return }
    setSelected({ ...selected, status: 'resolved' })
    setTickets((prev) => prev.map((ticket) => ticket.id === selected.id ? { ...ticket, status: 'resolved' } : ticket))
    toast.success('Ticket resolved')
  }

  const filtered = filterStatus === 'all' ? tickets : tickets.filter((ticket) => ticket.status === filterStatus)

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-sky-300" /></div>

  const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    open: { bg: 'rgba(47,111,237,0.18)', text: '#BFDBFE' },
    in_progress: { bg: 'rgba(245,158,11,0.18)', text: '#FCD34D' },
    resolved: { bg: 'rgba(22,163,74,0.18)', text: '#86EFAC' },
  }

  return (
    <div className="mx-auto max-w-7xl">
      <section className="admin-card rounded-[28px] p-5 lg:p-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Support inbox</h1>
        <p className="mt-2 text-sm" style={{ color: '#94A3B8' }}>Handle customer issues with a cleaner split view and faster ticket state changes.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {['open', 'in_progress', 'resolved', 'all'].map((status) => (
            <button key={status} onClick={() => setFilterStatus(status)} className="rounded-full px-3 py-2 text-xs font-bold capitalize" style={{ background: filterStatus === status ? 'rgba(110,165,255,0.18)' : 'rgba(255,255,255,0.05)', color: filterStatus === status ? '#ffffff' : '#94A3B8', border: '1px solid rgba(148,163,184,0.12)' }}>
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="admin-card rounded-[28px] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-sky-300/60" />
              <p className="mt-3 text-sm" style={{ color: '#94A3B8' }}>No tickets in this state.</p>
            </div>
          ) : filtered.map((ticket) => {
            const colors = STATUS_COLORS[ticket.status] || STATUS_COLORS.open
            const user = first(ticket.user as { name: string; phone: string } | { name: string; phone: string }[] | undefined)
            return (
              <button key={ticket.id} onClick={() => setSelected(ticket)} className="block w-full border-b border-white/10 px-4 py-4 text-left transition hover:bg-white/10" style={{ background: selected?.id === ticket.id ? 'rgba(110,165,255,0.12)' : 'transparent' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-white">{ticket.subject}</div>
                    <div className="mt-1 text-sm" style={{ color: '#94A3B8' }}>{user?.name || 'Unknown'} • {format(new Date(ticket.created_at), 'd MMM')}</div>
                  </div>
                  <span className="status-pill" style={{ background: colors.bg, color: colors.text }}>{ticket.status.replace('_', ' ')}</span>
                </div>
              </button>
            )
          })}
        </div>

        {selected ? (
          <div className="admin-card rounded-[28px] overflow-hidden">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="font-semibold text-white">{selected.subject}</div>
              <div className="mt-1 text-sm" style={{ color: '#94A3B8' }}>{format(new Date(selected.created_at), 'd MMM yyyy, h:mm a')}</div>
            </div>
            <div className="max-h-96 space-y-3 overflow-y-auto p-5">
              {(selected.conversation || []).map((message, index) => (
                <div key={index} className={`flex ${message.role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-xs rounded-2xl px-4 py-3 text-sm" style={{ background: message.role === 'admin' ? 'rgba(110,165,255,0.18)' : 'rgba(255,255,255,0.06)', color: '#f8fafc' }}>
                    <p>{message.message}</p>
                    <p className="mt-2 text-xs opacity-60">{format(new Date(message.timestamp), 'h:mm a')}</p>
                  </div>
                </div>
              ))}
            </div>
            {selected.status !== 'resolved' ? (
              <div className="border-t border-white/10 p-5">
                <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a reply..." rows={3} className="admin-input w-full resize-none" />
                <div className="mt-3 flex gap-2">
                  <button onClick={() => void handleReply()} disabled={sending || !reply.trim()} className="btn-primary flex-1">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Reply</>}
                  </button>
                  <button onClick={() => void handleResolve()} className="rounded-full px-4 py-2 text-sm font-semibold" style={{ background: 'rgba(22,163,74,0.18)', color: '#86EFAC' }}>
                    Resolve
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="admin-card rounded-[28px] flex items-center justify-center p-10 text-sm" style={{ color: '#94A3B8' }}>Select a ticket to view the conversation.</div>
        )}
      </div>
    </div>
  )
}
