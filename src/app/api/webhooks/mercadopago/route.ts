import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Endpoint Webhook de Mercado Pago: POST /api/webhooks/mercadopago
 * Soporta eventos de suscripciones recurrentes (subscription_preapproval) y pagos únicos (payment).
 */
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-signature');
    const body = await req.json();

    const eventId = String(body.id || body.data?.id || `mp_${Date.now()}`);
    const eventType = body.type || body.action || 'subscription_preapproval.updated';
    const tenantId = body.metadata?.tenant_id || null;
    const licensesPurchased = Number(body.metadata?.licenses_purchased || 25);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (
      supabaseUrl &&
      serviceRoleKey &&
      !supabaseUrl.includes('tu-proyecto.supabase.co')
    ) {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

      if (tenantId) {
        await supabaseAdmin
          .from('tenants')
          .update({
            max_licenses: licensesPurchased,
            plan_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', tenantId);
      }

      await supabaseAdmin.from('subscription_events').insert({
        provider: 'mercadopago',
        external_event_id: eventId,
        event_type: eventType,
        tenant_id: tenantId,
        payload: body,
      });
    }

    return NextResponse.json({
      received: true,
      provider: 'mercadopago',
      signature_present: Boolean(signature),
      event_id: eventId,
      event_type: eventType,
      tenant_id: tenantId,
      licenses_applied: licensesPurchased,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error procesando webhook de Mercado Pago', details: String(error) },
      { status: 400 }
    );
  }
}
