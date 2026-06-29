/**
 * DRE Controller
 */

const DreService = require('../services/dreService');
const config = require('../config/config');
const logger = require('../utils/logger');

class DreController {
  constructor() {
    this.service = new DreService(config);
  }

  /**
   * Process DRE file (multipart upload)
   */
  process = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      logger.info('Processing DRE file upload', {
        filename: req.file.originalname,
        size: req.file.size
      });

      const options = {
        useAgent: req.body.useAgent !== 'false',
        empresaId: req.body.empresaId,
        usuarioId: req.body.usuarioId
      };

      const result = await this.service.processFile(
        req.file.buffer,
        req.file.originalname,
        options
      );

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }

    } catch (error) {
      logger.error('Error processing DRE file:', error);

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Process DRE file from base64 (alternative endpoint)
   */
  processBase64 = async (req, res) => {
    try {
      const { file, filename, useAgent, empresaId, usuarioId } = req.body;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'Missing file field in request body'
        });
      }

      if (!filename) {
        return res.status(400).json({
          success: false,
          error: 'Missing filename field in request body'
        });
      }

      logger.info('Processing DRE base64', {
        filename,
        size: file.length
      });

      // Convert base64 to buffer
      const buffer = Buffer.from(file, 'base64');

      const options = {
        useAgent: useAgent !== false,
        empresaId,
        usuarioId
      };

      const result = await this.service.processFile(buffer, filename, options);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }

    } catch (error) {
      logger.error('Error processing DRE base64:', error);

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Validate existing DRE data
   */
  validate = async (req, res) => {
    try {
      const { dreData } = req.body;

      if (!dreData) {
        return res.status(400).json({
          success: false,
          error: 'Missing dreData field in request body'
        });
      }

      const validation = this.service.validate(dreData);

      res.json({
        success: true,
        validation
      });

    } catch (error) {
      logger.error('Error validating DRE:', error);

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get supported file formats
   */
  getFormats = async (req, res) => {
    res.json({
      success: true,
      formats: [
        {
          name: 'excel',
          extensions: ['.xlsx', '.xls'],
          mimeTypes: [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
          ]
        },
        {
          name: 'csv',
          extensions: ['.csv'],
          mimeTypes: ['text/csv', 'application/csv']
        },
        {
          name: 'pdf',
          extensions: ['.pdf'],
          mimeTypes: ['application/pdf']
        }
      ]
    });
  };

  /**
   * Health check
   */
  health = async (req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      service: 'icon-api-dre',
      timestamp: new Date().toISOString(),
      config: {
        anthropicEnabled: !!config.anthropic.apiKey,
        model: config.anthropic.model
      }
    });
  };
}

module.exports = DreController;
