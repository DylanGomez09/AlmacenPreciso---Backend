const supabase = require('./db');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function enviarPushAUsuarios(usuarios, title, body, data = {}) {
  if (!usuarios || usuarios.length === 0) return;

  const messages = usuarios.map(u => ({
    to: u.push_token,
    title,
    body,
    data,
  }));

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });

    if (!res.ok) {
      console.error(`Expo API error: ${res.status} ${await res.text()}`);
      return;
    }

    const tickets = await res.json();

    if (!tickets.data || !Array.isArray(tickets.data)) return;

    for (let i = 0; i < tickets.data.length; i++) {
      const ticket = tickets.data[i];
      if (ticket.status === 'error') {
        const errorMsg = ticket.details?.error || ticket.message;
        console.error(`Expo push error for user ${usuarios[i].id}: ${errorMsg}`);

        if (
          errorMsg === 'DeviceNotRegistered' ||
          errorMsg === 'InvalidCredentials'
        ) {
          await supabase
            .from('usuarios')
            .update({ push_token: null })
            .eq('id', usuarios[i].id);
        }
      }
    }
  } catch (err) {
    console.error('Error al enviar push notifications:', err);
  }
}

async function enviarPushAComercio(comercioId, title, body, data = {}) {
  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, push_token')
    .eq('comercio_id', comercioId)
    .not('push_token', 'is', null);

  await enviarPushAUsuarios(usuarios || [], title, body, data);
}

async function enviarPushAPorRol(comercioId, rol, title, body, data = {}) {
  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, push_token')
    .eq('comercio_id', comercioId)
    .eq('rol', rol)
    .not('push_token', 'is', null);

  await enviarPushAUsuarios(usuarios || [], title, body, data);
}

async function enviarPushAUsuario(userId, title, body, data = {}) {
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, push_token')
    .eq('id', userId)
    .not('push_token', 'is', null)
    .single();

  if (!usuario) return;

  await enviarPushAUsuarios([usuario], title, body, data);
}

module.exports = { enviarPushAUsuarios, enviarPushAComercio, enviarPushAPorRol, enviarPushAUsuario };
