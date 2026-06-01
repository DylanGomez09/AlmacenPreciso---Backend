const { Router } = require('express');
const crypto = require('crypto');
const supabase = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = Router();

function generarCodigo() {
  const num = crypto.randomInt(1000, 9999);
  return `AP-${num}`;
}

router.post('/', authMiddleware, requireRole('dueño'), async (req, res) => {
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del comercio es obligatorio' });
  }

  let codigo_unico = generarCodigo();

  const { data: existente } = await supabase
    .from('comercios')
    .select('id')
    .eq('codigo_unico', codigo_unico)
    .single();

  if (existente) {
    codigo_unico = generarCodigo();
  }

  const { data: comercio, error } = await supabase
    .from('comercios')
    .insert([{ nombre, codigo_unico }])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  await supabase
    .from('usuarios')
    .update({ comercio_id: comercio.id })
    .eq('id', req.user.id);

  res.status(201).json(comercio);
});

router.get('/:codigo', async (req, res) => {
  const { codigo } = req.params;

  const { data: comercio, error } = await supabase
    .from('comercios')
    .select('*')
    .eq('codigo_unico', codigo.toUpperCase())
    .single();

  if (error || !comercio) {
    return res.status(404).json({ error: 'Comercio no encontrado' });
  }

  res.json(comercio);
});

module.exports = router;
