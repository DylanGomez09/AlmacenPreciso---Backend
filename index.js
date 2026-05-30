const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Inicializar Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 1. OBTENER FALTANTES: Trae solo los productos donde 'falta' es true
app.get('/api/faltantes', async (req, res) => {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('falta', true)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// 2. AGREGAR FALTANTE: Anota un producto nuevo
app.post('/api/faltantes', async (req, res) => {
  const { nombre, categoria, actualizado_por } = req.body;
  
  if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });

  const { data, error } = await supabase
    .from('productos')
    .insert([{ nombre, categoria: categoria || 'General', actualizado_por, falta: true }]);

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ mensaje: "Producto anotado correctamente" });
});

// 3. MARCAR COMPRADO: Cambia 'falta' a false usando el ID
app.put('/api/faltantes/:id', async (req, res) => {
  const { id } = req.params;
  const { actualizado_por } = req.body;

  const { data, error } = await supabase
    .from('productos')
    .update({ falta: false, actualizado_por })
    .eq('id', id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ mensaje: "Producto marcado como comprado" });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});