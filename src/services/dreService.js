/**
 * DRE Service - Orchestrator
 *
 * Orquestra: File Parser + LangChain Agent + Validator
 */

const FileParser = require('./fileParser');
const LangchainAgent = require('./langchainAgent');
const logger = require('../utils/logger');

class DreService {
  constructor(config) {
    this.parser = new FileParser();
    this.config = config;
    this.agent = null;
  }

  /**
   * Get or initialize agent
   */
  getAgent() {
    if (!this.agent) {
      const provider = this.config.llm.provider;
      const providerConfig = this.config.llm[provider] || {};

      this.agent = new LangchainAgent({
        provider: provider,
        [provider]: providerConfig
      });
    }
    return this.agent;
  }

  /**
   * Process DRE file
   */
  async processFile(buffer, filename, options = {}) {
    const startTime = Date.now();

    try {
      logger.info(`Processing DRE file: ${filename}`);

      // 1. Parse file
      const parsedData = await this.parser.parseFile(buffer, filename);

      logger.info('File parsed successfully', {
        format: parsedData.format,
        years: parsedData.data.years?.length || 0
      });

      // 2. Use LangChain agent if enabled
      let finalData = parsedData.data;
      let agentUsed = false;

      if (options.useAgent !== false) {
        logger.info('Invoking LangChain agent');

        const agentResult = await this.getAgent().processDre(
          parsedData.data,
          {
            filename,
            empresaId: options.empresaId,
            usuarioId: options.usuarioId
          }
        );

        if (agentResult.success) {
          finalData = agentResult.data;
          agentUsed = true;
          logger.info('LangChain agent completed successfully');
        } else {
          logger.warn('LangChain agent failed, using parsed data', {
            error: agentResult.error
          });
        }
      }

      // 3. Validate result
      const validation = this.validate(finalData);

      logger.info('DRE processing completed', {
        processingTime: Date.now() - startTime,
        validation: validation.isValid ? 'PASS' : 'FAIL',
        qualityScore: validation.qualityScore
      });

      return {
        success: true,
        processingTime: Date.now() - startTime,
        file: {
          filename,
          format: parsedData.format,
          size: buffer.length
        },
        processing: {
          agentUsed,
          parserUsed: true
        },
        data: finalData,
        validation
      };

    } catch (error) {
      logger.error('DRE processing error:', error);

      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Validate DRE data
   */
  validate(dreData) {
    const errors = [];
    const warnings = [];

    // Check structure
    if (!dreData.anos || !Array.isArray(dreData.anos)) {
      errors.push('Missing or invalid anos array');
      return {
        isValid: false,
        errors,
        warnings,
        qualityScore: 0
      };
    }

    let totalFields = 0;
    let mappedFields = 0;

    // Validate each year
    for (const yearData of dreData.anos) {
      const { ano_exercicio, inputs } = yearData;

      if (!ano_exercicio) {
        errors.push('Missing ano_exercicio');
      }

      if (inputs) {
        // Required fields
        const required = ['receita_liquida', 'cmv', 'lucro_liquido'];
        for (const field of required) {
          totalFields++;
          if (inputs[field] !== undefined && inputs[field] !== null) {
            mappedFields++;
          } else {
            errors.push(`Missing required field: ${field}`);
          }
        }

        // Optional fields
        const optional = [
          'lucro_bruto', 'despesas_vendas', 'despesas_admin',
          'ebitda', 'depreciacao', 'ebit', 'resultado_financeiro',
          'lair', 'ir_csll'
        ];
        for (const field of optional) {
          totalFields++;
          if (inputs[field] !== undefined && inputs[field] !== null) {
            mappedFields++;
          }
        }

        // Validate accounting logic
        if (inputs.receita_liquida && inputs.cmv && inputs.lucro_bruto) {
          const expected = inputs.receita_liquida - inputs.cmv;
          const diff = Math.abs(inputs.lucro_bruto - expected);
          if (diff > 0.01) {
            warnings.push(`Lucro Bruto mismatch: expected ${expected}, got ${inputs.lucro_bruto}`);
          }
        }
      }
    }

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(errors, warnings, mappedFields, totalFields);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      qualityScore,
      qualityLevel: this.getQualityLevel(qualityScore),
      summary: {
        totalFields,
        mappedFields,
        missingFields: totalFields - mappedFields
      }
    };
  }

  /**
   * Calculate quality score
   */
  calculateQualityScore(errors, warnings, mapped, total) {
    let score = 100;

    score -= errors.length * 25;
    score -= warnings.length * 5;

    const mappedRatio = mapped / Math.max(total, 1);
    score -= (1 - mappedRatio) * 20;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get quality level label
   */
  getQualityLevel(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Acceptable';
    if (score >= 40) return 'Poor';
    return 'Very Poor';
  }
}

module.exports = DreService;
