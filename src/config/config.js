/**
 * Configuração da Aplicação
 */

module.exports = {
  // Server
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',

  // LLM Provider (suporte múltiplos)
  llm: {
    provider: process.env.LLM_PROVIDER || 'anthropic', // 'anthropic' | 'openai' | 'cohere' | 'google'
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      temperature: 0,
      maxTokens: 4096
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4',
      temperature: 0,
      maxTokens: 4096
    },
    cohere: {
      apiKey: process.env.COHERE_API_KEY,
      model: process.env.COHERE_MODEL || 'command-r-plus',
      temperature: 0,
      maxTokens: 4096
    },
    google: {
      apiKey: process.env.GOOGLE_API_KEY,
      model: process.env.GOOGLE_MODEL || 'gemini-pro',
      temperature: 0,
      maxTokens: 4096
    }
  },

  // Database (opcional)
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    name: process.env.DB_NAME || 'iconplus',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    dialect: 'mysql'
  },

  // API Security
  apiKey: process.env.API_KEY,

  // Upload
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedFormats: ['.xlsx', '.xls', '.csv', '.pdf'],
    uploadDir: './uploads'
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log'
  }
};
