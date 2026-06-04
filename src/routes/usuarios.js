const { Router } = require('express');
const supabase = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = Router();

router.get('/', authMiddleware, requireRole('dueño'), async (req, res) => {
  const comercioId = req.query.comercio_id || req.user.comercio_id;

  const { data: empleados, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('comercio_id', comercioId)
    .eq('rol', 'empleado');

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(empleados);
});

router.post('/invitar', authMiddleware, requireRole('dueño'), async (req, res) => {
  const { email, password, nombre } = req.body;

  if (!email || !password || !nombre) {
    return res.status(400).json({ error: 'email, password y nombre son obligatorios' });
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return res.status(400).json({ error: authError.message });
  }

  if (!authData.user) {
    return res.status(500).json({ error: 'Error al crear el usuario' });
  }

  const { data: empleado, error: perfilError } = await supabase
    .from('usuarios')
    .insert([
      {
        id: authData.user.id,
        email,
        nombre,
        rol: 'empleado',
        comercio_id: req.user.comercio_id,
      },
    ])
    .select()
    .single();

  if (perfilError) {
    return res.status(400).json({ error: perfilError.message });
  }

  res.status(201).json({
    mensaje: 'Empleado invitado correctamente',
    usuario: empleado,
  });
});

module.exports = router;
