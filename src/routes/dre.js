/**
 * DRE Routes
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const DreController = require('../controllers/dreController');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.xlsx', '.xls', '.csv', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedExts.join(', ')}`));
    }
  }
});

const controller = new DreController();

/**
 * @swagger
 * /api/dre/process:
 *   post:
 *     summary: Processar arquivo DRE
 *     description: Recebe um arquivo Excel, CSV ou PDF contendo DRE e retorna os dados processados
 *     tags: [DRE]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo DRE (.xlsx, .xls, .csv, .pdf)
 *     responses:
 *       200:
 *         description: Arquivo processado com sucesso
 *       400:
 *         description: Requisição inválida ou arquivo não enviado
 *       500:
 *         description: Erro interno ao processar arquivo
 */
router.post('/process', upload.single('file'), controller.process);

/**
 * @swagger
 * /api/dre/process/base64:
 *   post:
 *     summary: Processar arquivo DRE em base64
 *     description: Recebe um arquivo DRE codificado em base64 e retorna os dados processados
 *     tags: [DRE]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 description: Arquivo DRE codificado em base64
 *               filename:
 *                 type: string
 *                 description: Nome do arquivo com extensão
 *     responses:
 *       200:
 *         description: Arquivo processado com sucesso
 *       400:
 *         description: Requisição inválida
 *       500:
 *         description: Erro interno ao processar arquivo
 */
router.post('/process/base64', controller.processBase64);

/**
 * @swagger
 * /api/dre/validate:
 *   post:
 *     summary: Validar dados DRE
 *     description: Valida um objeto JSON contendo dados de DRE
 *     tags: [DRE]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Objeto contendo os dados do DRE a serem validados
 *     responses:
 *       200:
 *         description: Dados validados com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno na validação
 */
router.post('/validate', controller.validate);

/**
 * @swagger
 * /api/dre/formats:
 *   get:
 *     summary: Listar formatos suportados
 *     description: Retorna a lista de formatos de arquivo suportados para upload de DRE
 *     tags: [DRE]
 *     responses:
 *       200:
 *         description: Lista de formatos retornada com sucesso
 */
router.get('/formats', controller.getFormats);

/**
 * @swagger
 * /api/dre/health:
 *   get:
 *     summary: Health check do serviço DRE
 *     description: Verifica se o serviço de processamento de DRE está disponível
 *     tags: [DRE]
 *     responses:
 *       200:
 *         description: Serviço DRE saudável
 */
router.get('/health', controller.health);

module.exports = router;
