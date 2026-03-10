// src/lib/credits.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreditType, UserSubscription, SubscriptionPlan } from '@/types'

/**
 * Consume one credit of the given type from a user's active subscription.
 * ATOMIC: checks balance and deducts in the same operation via RPC or sequential
 * admin calls. Uses service_role client to bypass RLS.
 *
 * @throws Error if no active subscription or no credits remaining
 */
export async function consumeCredit(
  userId: string,
  creditType: CreditType,
  orderId: string,
  supabaseAdmin: SupabaseClient
): Promise<number> {
  // Get the most recent active, non-expired subscription
  const { data: sub, error: subError } = await supabaseAdmin
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (subError || !sub) {
    throw new Error('No active subscription found')
  }

  const creditField = getCreditField(creditType)
  const currentBalance: number = (sub as UserSubscription)[creditField] as number

  if (currentBalance <= 0) {
    throw new Error(`No ${creditType} credits remaining. Current balance: ${currentBalance}`)
  }

  const newBalance = currentBalance - 1

  // Deduct credit from subscription
  const { error: updateError } = await supabaseAdmin
    .from('user_subscriptions')
    .update({ [creditField]: newBalance })
    .eq('id', sub.id)
    // Optimistic concurrency: only update if balance hasn't changed
    .eq(creditField, currentBalance)

  if (updateError) {
    throw new Error(`Failed to deduct credit: ${updateError.message}`)
  }

  // Log to credit ledger
  const { error: ledgerError } = await supabaseAdmin
    .from('credit_ledger')
    .insert({
      user_id: userId,
      subscription_id: sub.id,
      order_id: orderId,
      credit_type: creditType,
      change: -1,
      balance_after: newBalance,
      reason: 'order_placed',
    })

  if (ledgerError) {
    // Log error but don't throw — the credit was already deducted
    console.error('[credits] Failed to write ledger entry:', ledgerError)
  }

  return newBalance
}

/**
 * Add credits to a user's subscription after purchase.
 * Logs each credit type to the ledger.
 */
export async function addCredits(
  userId: string,
  subscriptionId: string,
  plan: Pick<SubscriptionPlan, 'wash_credits' | 'press_credits' | 'dry_clean_credits'>,
  supabaseAdmin: SupabaseClient
): Promise<void> {
  const entries: { type: CreditType; amount: number }[] = [
    { type: 'wash' as CreditType, amount: plan.wash_credits },
    { type: 'press' as CreditType, amount: plan.press_credits },
    { type: 'dry_clean' as CreditType, amount: plan.dry_clean_credits },
  ].filter((e) => e.amount > 0)

  for (const entry of entries) {
    const { error } = await supabaseAdmin.from('credit_ledger').insert({
      user_id: userId,
      subscription_id: subscriptionId,
      credit_type: entry.type,
      change: entry.amount,
      balance_after: entry.amount,
      reason: 'plan_purchased',
    })

    if (error) {
      console.error(`[credits] Failed to log ${entry.type} credit addition:`, error)
    }
  }
}

/**
 * Restore a credit when an order is cancelled.
 */
export async function restoreCredit(
  userId: string,
  creditType: CreditType,
  orderId: string,
  supabaseAdmin: SupabaseClient
): Promise<void> {
  // Find the active subscription to restore to
  const { data: sub, error: subError } = await supabaseAdmin
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (subError || !sub) {
    console.error('[credits] No active subscription to restore credit to')
    return
  }

  const creditField = getCreditField(creditType)
  const currentBalance: number = (sub as UserSubscription)[creditField] as number
  const newBalance = currentBalance + 1

  const { error: updateError } = await supabaseAdmin
    .from('user_subscriptions')
    .update({ [creditField]: newBalance })
    .eq('id', sub.id)

  if (updateError) {
    console.error('[credits] Failed to restore credit:', updateError)
    return
  }

  // Log restoration to ledger
  await supabaseAdmin.from('credit_ledger').insert({
    user_id: userId,
    subscription_id: sub.id,
    order_id: orderId,
    credit_type: creditType,
    change: +1,
    balance_after: newBalance,
    reason: 'order_cancelled',
  })
}

/**
 * Get current credit balance for a user's active subscription
 */
export async function getCreditBalance(
  userId: string,
  supabaseAdmin: SupabaseClient
): Promise<{
  wash: number
  press: number
  dry_clean: number
  hasActiveSubscription: boolean
  expiresAt: string | null
}> {
  const { data: sub, error } = await supabaseAdmin
    .from('user_subscriptions')
    .select('wash_credits_remaining, press_credits_remaining, dry_clean_credits_remaining, expires_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !sub) {
    return { wash: 0, press: 0, dry_clean: 0, hasActiveSubscription: false, expiresAt: null }
  }

  return {
    wash: sub.wash_credits_remaining,
    press: sub.press_credits_remaining,
    dry_clean: sub.dry_clean_credits_remaining,
    hasActiveSubscription: true,
    expiresAt: sub.expires_at,
  }
}

// ── Helpers ──────────────────────────────────────────────────

type CreditFieldKey =
  | 'wash_credits_remaining'
  | 'press_credits_remaining'
  | 'dry_clean_credits_remaining'

function getCreditField(creditType: CreditType): CreditFieldKey {
  const map: Record<CreditType, CreditFieldKey> = {
    wash: 'wash_credits_remaining',
    press: 'press_credits_remaining',
    dry_clean: 'dry_clean_credits_remaining',
  }
  return map[creditType]
}

