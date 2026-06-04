const { Router } = require('express');
const supabase = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { notificarDuenio } = require('../notificaciones');

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

  notificarDuenio(
    req.user.comercio_id,
    'Nuevo faltante',
    `${data.nombre} fue reportado como faltante`
  );

  res.status(201).json(data);
});

router.patch('/:id/estado', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  const estadosValidos = ['activo', 'comprado', 'pendiente_borrado', 'aprobado', 'rechazado'];
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
    if (estado !== 'pendiente_borrado' && estado !== 'comprado' && estado !== 'activo') {
      return res.status(403).json({
        error: 'Como empleado solo puedes cambiar a: activo, comprado o pendiente_borrado',
      });
    }
  }

  if ((estado === 'aprobado' || estado === 'rechazado') && req.user.rol !== 'dueño') {
    return res.status(403).json({
      error: 'Solo el dueño puede aprobar o rechazar',
    });
  }

  if (estado === 'aprobado') {
    const { error } = await supabase
      .from('faltantes')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ mensaje: 'Faltante eliminado correctamente' });
  }

  const nuevoEstado = estado === 'rechazado' ? 'activo' : estado;

  const { data, error } = await supabase
    .from('faltantes')
    .update({ estado: nuevoEstado, actualizado_por: req.user.nombre })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

router.delete('/:id', authMiddleware, requireRole('dueño'), async (req, res) => {
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

module.exports = router;
