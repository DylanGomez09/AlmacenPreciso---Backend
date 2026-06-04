const { Router } = require('express');
const supabase = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = Router();

router.get('/metrics', authMiddleware, async (req, res) => {
  const comercioId = req.user.comercio_id;

  if (!comercioId) {
    return res.status(400).json({ error: 'No tienes un comercio asignado' });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const { count: faltantesHoy, error: errFaltantes } = await supabase
    .from('faltantes')
    .select('id', { count: 'exact', head: true })
    .eq('comercio_id', comercioId)
    .gte('created_at', todayISO);

  if (errFaltantes) {
    return res.status(400).json({ error: errFaltantes.message });
  }

  const { count: empleadosActivos, error: errEmpleados } = await supabase
    .from('usuarios')
    .select('id', { count: 'exact', head: true })
    .eq('comercio_id', comercioId)
    .eq('rol', 'empleado');

  if (errEmpleados) {
    return res.status(400).json({ error: errEmpleados.message });
  }

  res.json({
    faltantes_hoy: faltantesHoy || 0,
    empleados_activos: empleadosActivos || 0,
  });
});

module.exports = router;
