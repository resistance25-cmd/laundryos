// src/lib/slots.ts
import { addDays, isAfter, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AvailableSlot, PickupSlot } from '@/types'

const PICKUP_CUTOFF_HOUR = 14 // 2 PM

/**
 * Determine the earliest valid pickup date.
 * Before 2 PM → same day
 * After 2 PM  → next day
 */
export function getPickupDate(orderTime: Date): Date {
  const cutoff = setMilliseconds(
    setSeconds(setMinutes(setHours(orderTime, PICKUP_CUTOFF_HOUR), 0), 0),
    0
  )
  if (isAfter(orderTime, cutoff)) {
    return addDays(orderTime, 1)
  }
  return orderTime
}

/**
 * Delivery is always next day after pickup
 */
export function getDeliveryDate(pickupDate: Date): Date {
  return addDays(pickupDate, 1)
}

/**
 * Format a Date to YYYY-MM-DD string
 */
export function formatDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Get available pickup slots for a given date + zone.
 * Returns slots with available: boolean and remaining count.
 * Counts existing bookings — must filter by BOTH pickup_date AND zone_id.
 */
export async function getAvailablePickupSlots(
  date: Date,
  zoneId: string,
  supabase: SupabaseClient
): Promise<AvailableSlot[]> {
  const dateStr = formatDateStr(date)

  // Fetch all active slots for this zone (zone-specific OR global)
  const { data: slots, error: slotsError } = await supabase
    .from('pickup_slots')
    .select('*')
    .eq('is_active', true)
    .or(`zone_id.eq.${zoneId},zone_id.is.null`)
    .order('start_time', { ascending: true })

  if (slotsError) {
    console.error('[slots] Error fetching pickup slots:', slotsError)
    return []
  }

  if (!slots || slots.length === 0) return []

  // Count existing bookings per slot for this date+zone combination
  // CRITICAL: Must filter by BOTH pickup_date AND zone_id
  const { data: bookings, error: bookingsError } = await supabase
    .from('orders')
    .select('pickup_slot_id')
    .eq('pickup_date', dateStr)
    .eq('zone_id', zoneId)
    .in('status', ['placed', 'pickup_scheduled', 'picked_up'])

  if (bookingsError) {
    console.error('[slots] Error counting bookings:', bookingsError)
    // Return slots but mark all as unavailable to be safe
    return (slots as PickupSlot[]).map((slot) => ({
      ...slot,
      available: false,
      remaining: 0,
    }))
  }

  // Build booking count map
  const bookingCounts: Record<string, number> = {}
  if (bookings) {
    for (const booking of bookings) {
      if (booking.pickup_slot_id) {
        bookingCounts[booking.pickup_slot_id] =
          (bookingCounts[booking.pickup_slot_id] || 0) + 1
      }
    }
  }

  // Merge availability into slots
  return (slots as PickupSlot[]).map((slot) => {
    const booked = bookingCounts[slot.id] || 0
    const remaining = slot.max_bookings_per_slot - booked
    return {
      ...slot,
      available: remaining > 0,
      remaining: Math.max(0, remaining),
    }
  })
}

/**
 * Get available delivery slots (no capacity limit — just active ones)
 */
export async function getAvailableDeliverySlots(
  supabase: SupabaseClient
): Promise<{ id: string; label: string; start_time: string; end_time: string }[]> {
  const { data: slots, error } = await supabase
    .from('delivery_slots')
    .select('id, label, start_time, end_time')
    .eq('is_active', true)
    .order('start_time', { ascending: true })

  if (error) {
    console.error('[slots] Error fetching delivery slots:', error)
    return []
  }

  return slots || []
}

/**
 * Check if a specific pickup slot is still available
 * (used before order creation to prevent race conditions)
 */
export async function isSlotAvailable(
  slotId: string,
  pickupDate: string,
  zoneId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  // Get slot max capacity
  const { data: slot, error: slotError } = await supabase
    .from('pickup_slots')
    .select('max_bookings_per_slot')
    .eq('id', slotId)
    .single()

  if (slotError || !slot) return false

  // Count current bookings for this slot+date+zone
  const { count, error: countError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('pickup_slot_id', slotId)
    .eq('pickup_date', pickupDate)
    .eq('zone_id', zoneId)
    .in('status', ['placed', 'pickup_scheduled', 'picked_up'])

  if (countError) return false

  return (count || 0) < slot.max_bookings_per_slot
}
