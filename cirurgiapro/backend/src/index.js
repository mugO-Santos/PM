require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');
const procedimentosRouter = require('./routes/procedimentos');
const calculosRouter = require('./routes/calculos');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/procedimentos', procedimentosRouter);
app.use('/api/calculos', calculosRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React frontend em produção
const frontendBuildPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendBuildPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

// Inicializar banco e subir servidor
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🏥 CirurgiaPro API rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Falha ao inicializar:', err);
    process.exit(1);
  });
