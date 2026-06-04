const supabase = require('./db');

async function notificarDuenio(comercioId, title, body) {
  try {
    const { data: duenios } = await supabase
      .from('usuarios')
      .select('push_token')
      .eq('comercio_id', comercioId)
      .eq('rol', 'dueño')
      .not('push_token', 'is', null);

    if (!duenios || duenios.length === 0) return;

    for (const d of duenios) {
      fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: d.push_token, title, body }),
      }).catch(() => {});
    }
  } catch {
  }
}

module.exports = { notificarDuenio };
