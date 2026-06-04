const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const comerciosRoutes = require('./src/routes/comercios');
const usuariosRoutes = require('./src/routes/usuarios');
const faltantesRoutes = require('./src/routes/faltantes');
const dashboardRoutes = require('./src/routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/comercios', comerciosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/faltantes', faltantesRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
