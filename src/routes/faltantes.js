const { Router } = require('express');
const supabase = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  let query = supabase
    .from('faltantes')
    .select('*')
    .eq('comercio_id', req.user.comercio_id)
    .order('created_at', { ascending: false });

  if (req.query.estado) {
    query = query.eq('estado', req.query.estado);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

router.post('/', authMiddleware, async (req, res) => {
  const { nombre, categoria } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  const { data, error } = await supabase
    .from('faltantes')
    .insert([
      {
        nombre,
        categoria: categoria || 'General',
        estado: 'activo',
        comercio_id: req.user.comercio_id,
        actualizado_por: req.user.nombre,
      },
    ])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data);
});

router.patch('/:id/estado', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  const estadosValidos = ['activo', 'comprado', 'pendiente_borrado'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: `Estado inválido. Válidos: ${estadosValidos.join(', ')}` });
  }

  const { data: faltante, error: findError } = await supabase
    .from('faltantes')
    .select('*')
    .eq('id', id)
    .eq('comercio_id', req.user.comercio_id)
    .single();

  if (findError || !faltante) {
    return res.status(404).json({ error: 'Faltante no encontrado' });
  }

  if (req.user.rol === 'empleado') {
    if (estado !== 'pendiente_borrado') {
      return res.status(403).json({
        error: 'Como empleado solo puedes solicitar la eliminación (estado: pendiente_borrado)',
      });
    }
  }

  const { data, error } = await supabase
    .from('faltantes')
    .update({ estado, actualizado_por: req.user.nombre })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

router.delete('/:id/aprobar', authMiddleware, requireRole('dueño'), async (req, res) => {
  const { id } = req.params;

  const { data: faltante, error: findError } = await supabase
    .from('faltantes')
    .select('*')
    .eq('id', id)
    .eq('comercio_id', req.user.comercio_id)
    .single();

  if (findError || !faltante) {
    return res.status(404).json({ error: 'Faltante no encontrado' });
  }

  const { error } = await supabase
    .from('faltantes')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ mensaje: 'Faltante eliminado correctamente' });
});

router.patch('/:id/rechazar', authMiddleware, requireRole('dueño'), async (req, res) => {
  const { id } = req.params;

  const { data: faltante, error: findError } = await supabase
    .from('faltantes')
    .select('*')
    .eq('id', id)
    .eq('comercio_id', req.user.comercio_id)
    .single();

  if (findError || !faltante) {
    return res.status(404).json({ error: 'Faltante no encontrado' });
  }

  const { data, error } = await supabase
    .from('faltantes')
    .update({ estado: 'activo', actualizado_por: req.user.nombre })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

module.exports = router;
