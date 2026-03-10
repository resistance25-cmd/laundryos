// src/lib/utils.ts
// LaundryOS — General utility functions

import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'
import type { OrderStatus } from '@/types'

// ── Date Formatting ───────────────────────────────────────────

export function formatDate(dateStr: string, pattern: string = 'dd MMM yyyy'): string {
  try {
    const date = parseISO(dateStr)
    if (!isValid(date)) return dateStr
    return format(date, pattern)
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string): string {
  return formatDate(dateStr, 'dd MMM yyyy, h:mm a')
}

export function formatRelativeTime(dateStr: string): string {
  try {
    const date = parseISO(dateStr)
    if (!isValid(date)) return dateStr
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return dateStr
  }
}

// ── Order Status ──────────────────────────────────────────────

export function getOrderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    placed: 'Order Placed',
    pickup_scheduled: 'Pickup Scheduled',
    picked_up: 'Picked Up',
    processing: 'Processing',
    ready_for_delivery: 'Ready for Delivery',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }
  return labels[status] ?? status
}

export function getOrderStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    placed: 'text-slate-400',
    pickup_scheduled: 'text-blue-400',
    picked_up: 'text-violet-400',
    processing: 'text-amber-400',
    ready_for_delivery: 'text-cyan-400',
    out_for_delivery: 'text-indigo-400',
    delivered: 'text-emerald-400',
    cancelled: 'text-red-400',
  }
  return colors[status] ?? 'text-slate-400'
}

export function getOrderStatusBadgeClass(status: OrderStatus): string {
  const classes: Record<OrderStatus, string> = {
    placed: 'badge badge-info',
    pickup_scheduled: 'badge badge-info',
    picked_up: 'badge badge-primary',
    processing: 'badge badge-warning',
    ready_for_delivery: 'badge badge-primary',
    out_for_delivery: 'badge badge-primary',
    delivered: 'badge badge-success',
    cancelled: 'badge badge-error',
  }
  return classes[status] ?? 'badge badge-info'
}

// ── String Utils ──────────────────────────────────────────────

export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength)}...`
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  }
  return phone
}

// ── Class Names ───────────────────────────────────────────────

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// ── Service Type Labels ───────────────────────────────────────

export function getServiceTypeLabel(serviceType: string): string {
  const labels: Record<string, string> = {
    wash_fold: 'Wash & Fold',
    steam_press: 'Steam Press',
    dry_clean: 'Dry Clean',
  }
  return labels[serviceType] ?? serviceType
}

// ── Validation ────────────────────────────────────────────────

export function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ── Number Utils ──────────────────────────────────────────────

export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

export function formatCurrencyShort(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ── Error Handling ────────────────────────────────────────────

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unexpected error occurred'
}
