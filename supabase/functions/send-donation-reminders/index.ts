import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function normalizeIndonesianPhone(value: string | null | undefined) {
  const digits = String(value || '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
}

function isAuthorized(request: Request) {
  const configuredSecret = Deno.env.get('DONATION_REMINDER_CRON_SECRET');
  if (!configuredSecret) return false;
  const suppliedSecret = request.headers.get('x-cron-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  return suppliedSecret === configuredSecret;
}

async function sendWhatsApp(phone: string, message: string) {
  const providerUrl = Deno.env.get('WHATSAPP_PROVIDER_URL');
  const providerToken = Deno.env.get('WHATSAPP_PROVIDER_TOKEN');
  const providerKind = (Deno.env.get('WHATSAPP_PROVIDER_KIND') || 'generic').toLowerCase();

  if (!providerUrl || !providerToken) {
    throw new Error('Provider WhatsApp belum dikonfigurasi di Edge Function secrets.');
  }

  const target = normalizeIndonesianPhone(phone);
  if (!target) throw new Error('Nomor WhatsApp donatur tidak tersedia.');

  const isFonnte = providerKind === 'fonnte';
  const response = await fetch(providerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(isFonnte ? { Authorization: providerToken } : { Authorization: `Bearer ${providerToken}` })
    },
    body: JSON.stringify(isFonnte ? {
      target,
      message
    } : {
      to: target,
      message
    })
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Provider WhatsApp ${response.status}: ${responseText.slice(0, 500)}`);
  }

  let providerMessageId = '';
  try {
    const parsed = JSON.parse(responseText);
    providerMessageId = String(parsed.id || parsed.message_id || parsed.data?.id || '');
  } catch (_) {
    // Some providers return plain text; the successful HTTP status is enough.
  }
  return providerMessageId;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!isAuthorized(request)) return json({ error: 'Unauthorized reminder worker' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Supabase service secrets belum dikonfigurasi' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: enqueued, error: enqueueError } = await supabase
    .rpc('enqueue_due_donation_reminders');
  if (enqueueError) return json({ error: enqueueError.message }, 500);

  const { data: reminders, error: claimError } = await supabase
    .rpc('claim_donation_reminders', { p_limit: 100 });
  if (claimError) return json({ error: claimError.message }, 500);

  const results: Array<Record<string, unknown>> = [];
  for (const reminder of reminders || []) {
    try {
      const providerMessageId = await sendWhatsApp(reminder.donor_phone, reminder.message);
      const { error: completeError } = await supabase.rpc('complete_donation_reminder', {
        p_reminder_id: reminder.reminder_id,
        p_status: 'SENT',
        p_provider_message_id: providerMessageId || null,
        p_error_message: null
      });
      if (completeError) throw completeError;
      results.push({ reminder_id: reminder.reminder_id, status: 'SENT' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await supabase.rpc('complete_donation_reminder', {
        p_reminder_id: reminder.reminder_id,
        p_status: 'FAILED',
        p_provider_message_id: null,
        p_error_message: message.slice(0, 1000)
      });
      results.push({ reminder_id: reminder.reminder_id, status: 'FAILED', error: message });
    }
  }

  return json({
    enqueued: Number(enqueued || 0),
    claimed: (reminders || []).length,
    results
  });
});
