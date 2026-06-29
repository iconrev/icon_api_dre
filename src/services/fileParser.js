/**
 * File Parser Service
 *
 * Suporta: Excel, CSV, PDF
 */

const ExcelJS = require('exceljs');
const pdfParse = require('pdf-parse');
const path = require('path');
const logger = require('../utils/logger');

class FileParser {
  /**
   * Parse file based on format
   */
  async parseFile(buffer, filename) {
    const ext = this.getExtension(filename);

    logger.info(`Parsing file: ${filename}, format: ${ext}`);

    switch (ext) {
      case '.xlsx':
      case '.xls':
        return await this.parseExcel(buffer, filename);

      case '.csv':
        return await this.parseCSV(buffer, filename);

      case '.pdf':
        return await this.parsePDF(buffer, filename);

      default:
        throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  /**
   * Get file extension
   */
  getExtension(filename) {
    return path.extname(filename).toLowerCase();
  }

  /**
   * Parse Excel file
   */
  async parseExcel(buffer, filename) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    // Get first sheet or find DRE sheet
    const sheet = this.findDreSheet(workbook);
    if (!sheet) {
      throw new Error('No DRE sheet found in workbook');
    }

    // Extract data
    const data = this.extractSheetData(sheet);

    return {
      format: 'excel',
      filename,
      sheetName: sheet.name,
      data
    };
  }

  /**
   * Find DRE sheet
   */
  findDreSheet(workbook) {
    // Try to find sheet with DRE-related name
    const drePatterns = ['dre', 'd.r.e', 'demonstração', 'demonstracao', 'resultado', 'financeiro'];

    for (const sheet of workbook.worksheets) {
      const name = sheet.name.toLowerCase();
      if (drePatterns.some(pattern => name.includes(pattern))) {
        return sheet;
      }
    }

    // Fallback to first sheet with data
    return workbook.worksheets.find(ws => ws.rowCount > 0);
  }

  /**
   * Extract data from sheet
   */
  extractSheetData(sheet) {
    const result = {
      metadata: {},
      years: [],
      rawData: []
    };

    let currentYear = null;
    let yearColumns = {};

    // Scan first 10 rows for metadata and years
    for (let rowNumber = 1; rowNumber <= Math.min(10, sheet.rowCount); rowNumber++) {
      const row = sheet.getRow(rowNumber);
      if (row.cellCount === 0) continue;

      row.eachCell((cell, colNumber) => {
        const value = this.getCellValue(cell);
        if (!value) return;

        // Detect CNPJ
        if (value.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/)) {
          result.metadata.cnpj = value;
        }

        // Detect company name
        if (rowNumber <= 2 && typeof value === 'string' && value.length > 5 && !value.match(/\d{3,}/)) {
          result.metadata.empresa = value;
        }

        // Detect years
        const yearMatch = value.match(/\b(20\d{2})\b/);
        if (yearMatch) {
          const year = parseInt(yearMatch[1]);
          if (!yearColumns[year]) {
            yearColumns[year] = colNumber;
          }
        }
      });
    }

    // Get list of years
    const years = Object.keys(yearColumns).map(Number).sort((a, b) => b - a);
    if (years.length === 0) {
      years.push(new Date().getFullYear());
      yearColumns[years[0]] = 2; // Assume column 2
    }

    // Extract DRE fields for each year
    for (const year of years) {
      const yearData = {
        ano_exercicio: year,
        inputs: {},
        raw_values: {}
      };

      const valueCol = yearColumns[year];

      // Scan rows for DRE fields
      for (let rowNumber = 1; rowNumber <= sheet.rowCount; rowNumber++) {
        const row = sheet.getRow(rowNumber);
        const labelCell = row.getCell(1);
        const label = this.getCellValue(labelCell);

        if (!label || label.trim() === '') continue;

        const fieldMatch = this.matchField(label);
        if (fieldMatch) {
          const valueCell = row.getCell(valueCol);
          const value = this.parseNumber(this.getCellValue(valueCell));
          yearData.inputs[fieldMatch] = value;
        }

        yearData.raw_values[label] = this.getCellValue(row.getCell(valueCol));
      }

      result.years.push(yearData);
    }

    return result;
  }

  /**
   * Parse CSV file
   */
  async parseCSV(buffer, filename) {
    const content = buffer.toString('utf-8');
    const lines = content.split(/\r?\n/).filter(line => line.trim());

    const result = {
      format: 'csv',
      filename,
      data: {
        metadata: {},
        years: [],
        rawData: []
      }
    };

    // Detect delimiter
    const firstLine = lines[0];
    const delimiter = this.detectDelimiter(firstLine);

    // Parse data
    const currentYear = new Date().getFullYear();
    const yearData = {
      ano_exercicio: currentYear,
      inputs: {},
      raw_values: {}
    };

    for (const line of lines) {
      const fields = line.split(delimiter).map(f => f.trim());
      if (fields.length < 2) continue;

      const label = fields[0];
      const value = this.parseNumber(fields[1]);

      const fieldMatch = this.matchField(label);
      if (fieldMatch) {
        yearData.inputs[fieldMatch] = value;
      }

      yearData.raw_values[label] = value;
    }

    result.data.years.push(yearData);

    return result;
  }

  /**
   * Parse PDF file
   */
  async parsePDF(buffer, filename) {
    const data = await pdfParse(buffer);
    const text = data.text;

    const result = {
      format: 'pdf',
      filename,
      pages: data.numpages,
      data: {
        metadata: {},
        years: [],
        rawData: []
      }
    };

    // Extract lines
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);

    // Parse similar to Excel
    const currentYear = new Date().getFullYear();
    const yearData = {
      ano_exercicio: currentYear,
      inputs: {},
      raw_values: {}
    };

    for (const line of lines) {
      const { field, value, label } = this.extractFieldValue(line);
      if (field) {
        yearData.inputs[field] = value;
      }
      if (label) {
        yearData.raw_values[label] = value;
      }
    }

    result.data.years.push(yearData);

    return result;
  }

  /**
   * Detect CSV delimiter
   */
  detectDelimiter(line) {
    const delimiters = [';', ',', '\t', '|'];
    let bestDelimiter = ',';
    let maxCount = 0;

    for (const delim of delimiters) {
      const count = (line.match(new RegExp(delim, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = delim;
      }
    }

    return bestDelimiter;
  }

  /**
   * Get cell value
   */
  getCellValue(cell) {
    if (!cell || !cell.value) return '';

    const value = cell.value;

    if (typeof value === 'object') {
      if (value.formula) {
        return value.result ? value.result.toString() : '';
      }
      if (value.text) return value.text;
      if (value.richText) {
        return value.richText.map(rt => rt.text).join('');
      }
      return '';
    }

    return value.toString();
  }

  /**
   * Match field label to standard IconPlus field
   */
  matchField(label) {
    const patterns = {
      receita_liquida: /receita.*liquida|vendas.*liquida/i,
      cmv: /cmv|custo.*vendidas|custo.*produtos|cpv/i,
      lucro_bruto: /lucro.*bruto|resultado.*bruto/i,
      despesas_vendas: /despesas.*vendas|despesas.*comerciais/i,
      despesas_admin: /despesas.*administrativas|desp\.*adm/i,
      despesas_gerais: /despesas.*gerais/i,
      outras_despesas_op: /outras.*despesas.*operacionais/i,
      total_despesas_op: /total.*despesas.*operacionais/i,
      ebitda: /ebitda|lajida/i,
      depreciacao: /deprecia|amortiza/i,
      ebit: /ebit|lucro.*operacional/i,
      resultado_financeiro: /resultado.*financeiro/i,
      outras_receitas_op: /outras.*receitas.*operacionais/i,
      lair: /lair|lucro.*antes.*ir/i,
      ir_csll: /ir.*csll|imposto.*renda/i,
      lucro_liquido: /lucro.*liquido|lucro.*exercicio/i
    };

    const normalized = label.toLowerCase().trim();

    for (const [field, pattern] of Object.entries(patterns)) {
      if (pattern.test(normalized)) {
        return field;
      }
    }

    return null;
  }

  /**
   * Extract field-value pair from line (PDF)
   */
  extractFieldValue(line) {
    for (const [field, pattern] of Object.entries({
      receita_liquida: /receita.*liquida/i,
      cmv: /cmv/i,
      lucro_bruto: /lucro.*bruto/i,
      lucro_liquido: /lucro.*liquido/i
    })) {
      const match = line.match(pattern);
      if (match) {
        const value = this.extractValue(line, match.index + match[0].length);
        return {
          field,
          value,
          label: match[0]
        };
      }
    }

    return { field: null, value: 0, label: null };
  }

  /**
   * Extract numeric value from text
   */
  extractValue(text, startPos) {
    const remaining = text.substring(startPos);
    const patterns = [
      /[R\$]?\s*[\(]?\s*([\d\.\-]+)[,\d]*[\)]?/,
      /-?\s*([\d\.\-]+)[,\d]+/
    ];

    for (const pattern of patterns) {
      const match = remaining.match(pattern);
      if (match) {
        return this.parseNumber(match[0]);
      }
    }

    return 0;
  }

  /**
   * Parse number from various formats
   */
  parseNumber(value) {
    if (!value) return 0;

    if (typeof value === 'number') return value;

    const text = value.toString().trim();
    const clean = text
      .replace(/[R\$]/g, '')
      .replace(/\(/g, '-')
      .replace(/\)/g, '')
      .trim();

    // Brazilian format: 1.000,00
    if (clean.match(/\d{1,3}\.\d{3}(,\d+)?$/)) {
      return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
    }

    // Standard format
    return parseFloat(clean.replace(/,/g, '')) || 0;
  }
}

module.exports = FileParser;
