/**
 * Icon API DRE - Server Principal
 *
 * API isolada para processamento de DRE com LangChain
 * Deploy na Railway
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const { getSpecs } = require('./config/swagger');

// Import config
const config = require('./config/config');

// Import routes
const dreRoutes = require('./routes/dre');
const healthRoutes = require('./routes/health');

// Initialize Express
const app = express();

// Trust proxy (Railway/NGINX) so req.protocol reflects the public scheme
app.enable('trust proxy');

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '50mb' })); // JSON parser
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // URL encoded

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.use('/health', healthRoutes);

// API Routes
app.use('/api/dre', dreRoutes);

// Swagger UI + spec dinâmico
// O spec é servido em /api-docs/swagger.json para refletir o host/protocolo da requisição
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(getSpecs(req));
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, {
  swaggerUrl: '/api-docs/swagger.json'
}));

/**
 * @swagger
 * /:
 *   get:
 *     summary: Informações da API
 *     description: Retorna informações gerais sobre a API Icon API DRE
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Informações da API retornadas com sucesso
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Icon API DRE',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      process: '/api/dre/process',
      validate: '/api/dre/validate',
      formats: '/api/dre/formats'
    },
    docs: 'https://github.com/your-repo/icon-api-dre'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Icon API DRE running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`📚 API: http://localhost:${PORT}/api/dre/process`);
});

module.exports = app;
