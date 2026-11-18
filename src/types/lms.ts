export type UserRole = 'admin' | 'student';

export type VideoProviderType = 'bunny' | 'cloudflare' | 'vimeo' | 'youtube' | 'custom_embed';

export type SubscriptionStatusType = 'active' | 'expiring_soon' | 'expired' | 'cancelled';

/**
 * Academia o Escuela Temática Propia
 * Ej: "Academia de Excel", "Academia de Diseño Gráfico", "Academia de Marketing"
 */
export interface Academy {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon_name: string;
  primary_color: string;
  secondary_color: string;
  price_monthly: number;
  price_annual: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  // Campos de compatibilidad visual
  name?: string; // alias de title
  tagline?: string;
  logo_url?: string | null;
  support_email?: string;
}

// Alias de retrocompatibilidad
export type Tenant = Academy;

export interface StudentPaymentRecord {
  id: string;
  date: string;
  description: string;
  amount: string;
  currency: string;
  status: 'paid' | 'pending' | 'refunded';
  invoice_url?: string;
  payment_method?: string;
}

export interface AcademySubscription {
  id: string;
  student_id: string;
  academy_id: string | null; // null si es Pase Total / All-Access
  is_all_access: boolean;
  plan_name: string;
  status: 'active' | 'expired' | 'cancelled';
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: UserRole;
  is_all_access: boolean;
  all_access_end_date: string | null;
  // Sesión Única Anti-Compartir Cuenta
  active_session_id: string | null;
  active_session_device: string | null;
  last_session_at: string | null;
  created_at: string;
  // Suscripciones y pagos
  subscription_plan?: string;
  subscription_end_date?: string;
  subscription_status?: SubscriptionStatusType;
  subscribed_academy_ids?: string[];
  payment_history?: StudentPaymentRecord[];
  // Compatibilidad
  tenant_id?: string | null;
  is_active?: boolean;
}

export interface Lesson {
  id: string;
  module_id: string;
  course_id: string;
  title: string;
  description: string;
  video_provider: VideoProviderType;
  video_id: string;
  video_embed_url: string;
  duration_minutes: number;
  resource_url?: string | null;
  is_free_preview: boolean;
  sort_order: number;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string;
  sort_order: number;
  is_subtema_zero?: boolean;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  academy_id: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  thumbnail_url?: string | null;
  category: string;
  level: string;
  duration_label: string;
  sort_order?: number;
  is_published: boolean;
  modules: CourseModule[];
  // Alias de compatibilidad
  owner_tenant_id?: string | null;
  assigned_tenant_ids: string[];
}

export interface GlobalPaymentSettings {
  id: string;
  mercadopago_public_key: string;
  mercadopago_access_token: string;
  mercadopago_webhook_secret?: string;
  yape_phone: string;
  yape_qr_url: string;
  plin_phone: string;
  bank_transfer_info: string;
  currency: string;
  all_access_price_monthly: number;
  all_access_price_annual: number;
  updated_at: string;
}

export interface SubscriptionWebhookLog {
  id: string;
  provider: 'mercadopago' | 'manual_yape' | 'stripe';
  external_event_id: string;
  event_type: string;
  summary: string;
  processed_at: string;
}
