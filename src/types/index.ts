// src/types/index.ts
// Single source of truth for all TypeScript types in LaundryOS

// ============================================================
// DATABASE ROW TYPES
// ============================================================

export interface Zone {
  id: string
  name: string
  city: string
  is_active: boolean
  slot_config: Record<string, unknown>
  created_at: string
}

export interface User {
  id: string
  name: string
  email: string | null
  phone: string
  avatar_url: string | null
  zone_id: string | null
  city: string
  address: string | null
  latitude: number | null
  longitude: number | null
  wallet_balance: number
  referral_code: string
  referred_by: string | null
  created_at: string
}

export interface Admin {
  id: string
  name: string
  email: string
  phone: string | null
  is_super_admin: boolean
  created_at: string
}

export interface Rider {
  id: string
  name: string
  email: string | null
  phone: string
  avatar_url: string | null
  zone_id: string | null
  vehicle_type: string | null
  vehicle_number: string | null
  is_active: boolean
  is_available: boolean
  current_latitude: number | null
  current_longitude: number | null
  total_deliveries: number
  rating: number
  created_at: string
}

export interface LaundryPartner {
  id: string
  name: string
  owner_name: string | null
  phone: string
  address: string | null
  zone_id: string | null
  is_active: boolean
  daily_capacity: number
  current_load: number
  rating: number
  created_at: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  wash_credits: number
  press_credits: number
  dry_clean_credits: number
  free_pickup: boolean
  validity_days: number
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface UserSubscription {
  id: string
  user_id: string
  plan_id: string
  wash_credits_remaining: number
  press_credits_remaining: number
  dry_clean_credits_remaining: number
  starts_at: string
  expires_at: string
  status: SubscriptionStatus
  payment_id: string | null
  amount_paid: number | null
  created_at: string
  // Joined — Supabase may return as array or single object
  plan?: SubscriptionPlan | SubscriptionPlan[] | null
}

export interface Address {
  id: string
  user_id: string
  label: string | null
  line1: string
  line2: string | null
  landmark: string | null
  area: string | null
  zone_id: string | null
  city: string
  pincode: string | null
  latitude: number | null
  longitude: number | null
  is_default: boolean
  created_at: string
  // Joined
  zone?: Zone
}

export interface PickupSlot {
  id: string
  label: string
  start_time: string
  end_time: string
  is_active: boolean
  zone_id: string | null
  max_bookings_per_slot: number
  created_at: string
}

export interface DeliverySlot {
  id: string
  label: string
  start_time: string
  end_time: string
  is_active: boolean
  created_at: string
}

export interface Order {
  id: string
  order_number: string
  user_id: string
  address_id: string | null
  zone_id: string | null
  city: string
  laundry_partner_id: string | null
  rider_id: string | null
  delivery_rider_id: string | null
  pickup_date: string
  pickup_slot_id: string | null
  delivery_date: string | null
  delivery_slot_id: string | null
  order_type: OrderType
  subscription_id: string | null
  status: OrderStatus
  subtotal: number
  discount: number
  delivery_charge: number
  total: number
  payment_status: PaymentStatus
  payment_id: string | null
  payment_method: string | null
  special_instructions: string | null
  pickup_proof_url: string | null
  delivery_proof_url: string | null
  pickup_confirmed_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
  // Joined relations
  user?: User
  address?: Address
  zone?: Zone
  pickup_slot?: PickupSlot
  delivery_slot?: DeliverySlot
  rider?: Rider
  delivery_rider?: Rider
  items?: OrderItem[]
  status_history?: OrderStatusHistory[]
}

export interface OrderItem {
  id: string
  order_id: string
  service_type: ServiceType
  item_name: string | null
  quantity: number
  unit_price: number
  total_price: number
  tag_id: string | null
  special_notes: string | null
  before_photo_url: string | null
  after_photo_url: string | null
  created_at: string
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  status: OrderStatus
  changed_by: string | null
  changed_by_role: string | null
  notes: string | null
  created_at: string
}

export interface Payment {
  id: string
  user_id: string
  order_id: string | null
  subscription_id: string | null
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  razorpay_signature: string | null
  amount: number
  currency: string
  status: PaymentStatus
  method: string | null
  created_at: string
}

export interface CreditLedger {
  id: string
  user_id: string
  subscription_id: string | null
  order_id: string | null
  credit_type: CreditType
  change: number
  balance_after: number
  reason: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string | null
  rider_id: string | null
  admin_id: string | null
  title: string
  body: string
  type: string | null
  order_id: string | null
  is_read: boolean
  created_at: string
}

export interface PushSubscription {
  id: string
  user_id: string | null
  rider_id: string | null
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
}

export interface PricingItem {
  id: string
  service_type: ServiceType
  item_name: string
  unit_price: number
  is_active: boolean
  updated_at: string
}

export interface SupportTicket {
  id: string
  user_id: string
  order_id: string | null
  subject: string
  status: SupportStatus
  conversation: SupportMessage[]
  attachments: string[] | null
  created_at: string
  updated_at: string
  // Joined
  user?: User
  order?: Order
}

// ============================================================
// ENUM / UNION TYPES
// ============================================================

export type OrderStatus =
  | 'placed'
  | 'pickup_scheduled'
  | 'picked_up'
  | 'processing'
  | 'ready_for_delivery'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

export type OrderType = 'subscription' | 'single'

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed'

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled'

export type ServiceType = 'wash_fold' | 'steam_press' | 'dry_clean'

export type CreditType = 'wash' | 'press' | 'dry_clean'

export type SupportStatus = 'open' | 'in_progress' | 'resolved'

export type VehicleType = 'bike' | 'cycle' | 'auto'

export type ChangedByRole = 'admin' | 'rider' | 'partner' | 'system'

// ============================================================
// API REQUEST / RESPONSE TYPES
// ============================================================

export interface CreateOrderRequest {
  userId: string
  addressId: string
  zoneId: string
  pickupDate: string
  pickupSlotId: string
  items: CreateOrderItem[]
  orderType: OrderType
  subscriptionId?: string
  specialInstructions?: string
}

export interface CreateOrderItem {
  serviceType: ServiceType
  itemName: string
  quantity: number
  unitPrice: number
}

export interface UpdateOrderStatusRequest {
  orderId: string
  status: OrderStatus
  changedBy: string
  changedByRole: ChangedByRole
  notes?: string
}

export interface AssignOrderRequest {
  orderId: string
  riderId?: string
  deliveryRiderId?: string
  laundryPartnerId?: string
}

export interface CreatePaymentOrderRequest {
  amount: number
  currency: string
  userId: string
  type: 'subscription' | 'order'
  referenceId: string
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
  type: 'subscription' | 'order'
  referenceId: string
}

export interface AvailableSlot extends PickupSlot {
  available: boolean
  remaining: number
}

export interface CreateRiderRequest {
  name: string
  phone: string
  email: string
  zoneId: string
  vehicleType: VehicleType
  vehicleNumber?: string
  password: string
}

export interface SendNotificationRequest {
  userId?: string
  riderId?: string
  title: string
  body: string
  type?: string
  orderId?: string
  url?: string
}

// ============================================================
// UI / COMPONENT TYPES
// ============================================================

export interface BookingStep {
  step: number
  title: string
  completed: boolean
}

export interface BookingFormState {
  orderType: OrderType | null
  items: CreateOrderItem[]
  addressId: string | null
  pickupDate: string | null
  pickupSlotId: string | null
  deliverySlotId: string | null
  specialInstructions: string
  subscriptionId: string | null
}

export interface SupportMessage {
  role: 'user' | 'admin'
  message: string
  timestamp: string
}

export interface AdminStats {
  todayOrders: number
  pendingOrders: number
  completedOrders: number
  activeSubscriptions: number
  revenueToday: number
  revenueMonth: number
  ridersOnline: number
}

export interface RiderStats {
  todayPickups: number
  todayDeliveries: number
  completedPickups: number
  completedDeliveries: number
}

// ============================================================
// RAZORPAY TYPES
// ============================================================

export interface RazorpayOrder {
  id: string
  amount: number
  currency: string
  receipt: string
}

export interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayResponse) => void
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  theme?: {
    color?: string
  }
}

export interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

// ============================================================
// PUSH NOTIFICATION TYPES
// ============================================================

export interface PushPayload {
  title: string
  body: string
  url?: string
  orderId?: string
  type?: string
}

export interface WebPushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

// ============================================================
// COMPONENT PROP TYPES (Supabase join shapes)
// ============================================================

export interface DashboardOrder {
  id: string
  order_number: string
  status: OrderStatus
  total: number
  pickup_date: string
  created_at: string
  pickup_slot: { label: string } | null
}
