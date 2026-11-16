import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Endpoint Webhook de Stripe: POST /api/webhooks/stripe
 * Procesa eventos de suscripción tanto de Resellers B2B (ampliación/renovación de max_licenses)
 * como de Alumnos B2C (activación de membresía).
 */
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.json();

    const eventId = body.id || `evt_${Date.now()}`;
    const eventType = body.type || 'checkout.session.completed';
    const metadata = body.data?.object?.metadata || {};
    const tenantId = metadata.tenant_id || null;
    const licensesPurchased = Number(metadata.licenses_purchased || 25);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Si las credenciales de Supabase con Service Role están activas, actualizar en PostgreSQL
    if (
      supabaseUrl &&
      serviceRoleKey &&
      !supabaseUrl.includes('tu-proyecto.supabase.co')
    ) {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

      if (
        tenantId &&
        (eventType === 'checkout.session.completed' ||
          eventType === 'invoice.payment_succeeded')
      ) {
        await supabaseAdmin
          .from('tenants')
          .update({
            max_licenses: licensesPurchased,
            plan_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', tenantId);
      }

      if (tenantId && eventType === 'customer.subscription.deleted') {
        await supabaseAdmin
          .from('tenants')
          .update({
            plan_status: 'canceled',
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tenantId);
      }

      await supabaseAdmin.from('subscription_events').insert({
        provider: 'stripe',
        external_event_id: eventId,
        event_type: eventType,
        tenant_id: tenantId,
        payload: body,
      });
    }

    return NextResponse.json({
      received: true,
      provider: 'stripe',
      signature_present: Boolean(signature),
      event_id: eventId,
      event_type: eventType,
      tenant_id: tenantId,
      licenses_applied: licensesPurchased,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error procesando webhook de Stripe', details: String(error) },
      { status: 400 }
    );
  }
}
