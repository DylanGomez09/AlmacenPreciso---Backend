const { Router } = require('express');
const supabase = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = Router();

router.post('/register', async (req, res) => {
  const { email, password, nombre, rol, comercio_id } = req.body;

  if (!email || !password || !nombre || !rol) {
    return res.status(400).json({ error: 'email, password, nombre y rol son obligatorios' });
  }

  if (!['dueño', 'empleado'].includes(rol)) {
    return res.status(400).json({ error: 'rol debe ser "dueño" o "empleado"' });
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return res.status(400).json({ error: authError.message });
  }

  if (!authData.user) {
    return res.status(500).json({ error: 'Error al crear el usuario de autenticación' });
  }

  const { data: perfil, error: perfilError } = await supabase
    .from('usuarios')
    .insert([
      {
        id: authData.user.id,
        email,
        nombre,
        rol,
        comercio_id: comercio_id || null,
      },
    ])
    .select()
    .single();

  if (perfilError) {
    return res.status(400).json({ error: perfilError.message });
  }

  res.status(201).json({
    mensaje: 'Usuario registrado correctamente',
    usuario: perfil,
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email y password son obligatorios' });
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const { data: perfil, error: perfilError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (perfilError) {
    return res.status(500).json({ error: 'Error al obtener perfil de usuario' });
  }

  res.json({
    token: authData.session.access_token,
    usuario: perfil,
  });
});

router.get('/me', authMiddleware, async (req, res) => {
  res.json(req.user);
});

router.post('/join', authMiddleware, async (req, res) => {
  const { codigo_unico } = req.body;

  if (!codigo_unico) {
    return res.status(400).json({ message: 'codigo_unico es obligatorio' });
  }

  const { data: comercio, error: comercioError } = await supabase
    .from('comercios')
    .select('*')
    .eq('codigo_unico', codigo_unico.toUpperCase())
    .single();

  if (comercioError || !comercio) {
    return res.status(404).json({ message: 'Código de unión inválido' });
  }

  if (req.user.comercio_id) {
    return res.status(400).json({ message: 'Ya perteneces a un almacén' });
  }

  const { error: updateError } = await supabase
    .from('usuarios')
    .update({ comercio_id: comercio.id })
    .eq('id', req.user.id);

  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }

  res.json({ message: 'Te has unido al equipo', comercio_id: comercio.id });
});

module.exports = router;
