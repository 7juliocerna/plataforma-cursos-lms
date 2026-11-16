export type UserRole = 'superadmin' | 'reseller_admin' | 'student';

export type VideoProviderType = 'bunny' | 'cloudflare' | 'vimeo' | 'youtube' | 'custom_embed';

export type PlanStatusType = 'active' | 'trialing' | 'past_due' | 'canceled';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  tagline: string;
  support_email: string;
  plan_name: string;
  plan_status: PlanStatusType;
  max_licenses: number;
  used_licenses: number;
  is_active: boolean;
  created_at: string;
}

export interface UserProfile {
  id: string;
  tenant_id: string | null;
  role: UserRole;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  is_active: boolean;
  active_session_id: string | null;
  active_session_device: string | null;
  last_session_at: string | null;
  created_at: string;
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
  owner_tenant_id: string | null;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  thumbnail_url?: string | null;
  category: string;
  level: string;
  duration_label: string;
  is_published: boolean;
  assigned_tenant_ids: string[];
  modules: CourseModule[];
}

export interface SubscriptionWebhookLog {
  id: string;
  provider: 'stripe' | 'mercadopago';
  external_event_id: string;
  event_type: string;
  tenant_id: string | null;
  summary: string;
  processed_at: string;
}
