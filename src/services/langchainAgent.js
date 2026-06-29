/**
 * LangChain Agent Service for DRE Processing
 * Suporta múltiplos LLM providers
 */

const logger = require('../utils/logger');

// Imports dinâmicos para cada provider
let ChatOpenAI, ChatAnthropic, ChatCohere, ChatGoogle;

// System prompt para o agente
const DRE_AGENT_SYSTEM_PROMPT = `## CONTEXTO & PERSONA

Você é um especialista em contabilidade e transformação de dados financeiros com 15 anos de experiência em análise de Demonstrações do Resultado do Exercício (DRE).
Sua expertise está em normalizar dados financeiros de diferentes formatos e sistemas contábeis para um formato estruturado padrão.

## CAMPOS PADRÃO ICONPLUS - DRE

| Campo Interno       | Label                  | Tipo    | Obrigatório | Default |
|---------------------|------------------------|---------|-------------|---------|
| receita_liquida     | Receita Líquida        | float   | SIM         | 0       |
| cmv                 | CMV / Custo Produto    | float   | SIM         | 0       |
| lucro_bruto         | Lucro Bruto            | float   | NÃO         | null    |
| despesas_vendas     | Despesas com Vendas    | float   | NÃO         | 0       |
| despesas_admin      | Desp. Administrativas  | float   | NÃO         | 0       |
| despesas_gerais     | Despesas Gerais        | float   | NÃO         | 0       |
| outras_despesas_op  | Outras Despesas Op.    | float   | NÃO         | 0       |
| total_despesas_op   | Total Despesas Op.     | float   | NÃO         | null    |
| ebitda              | EBITDA                 | float   | NÃO         | null    |
| depreciacao         | Depreciação/Amort.     | float   | NÃO         | 0       |
| ebit                | EBIT / LAIR            | float   | NÃO         | null    |
| resultado_financeiro| Resultado Financeiro   | float   | NÃO         | 0       |
| outras_receitas_op  | Outras Rec. Operac.    | float   | NÃO         | 0       |
| lair                | LAIR                   | float   | NÃO         | null    |
| ir_csll             | IR / CSLL              | float   | NÃO         | 0       |
| lucro_liquido       | Lucro Líquido          | float   | SIM         | 0       |

## RESTRIÇÕES

- [HARD] Valores monetários devem preservar precisão original (2 casas decimais)
- [HARD] Campos obrigatórios não podem ser nulos/vazios: receita_liquida, cmv, lucro_liquido
- [PROIBIDO] Não inventar valores quando não encontrados - flag para revisão humana

## TÉCNICAS DE INFERÊNCIA

Quando campo não está explícito:
- Lucro Bruto = Receita Líquida - CMV
- Total Despesas = Soma das despesas operacionais
- LAIR = EBIT + Resultado Financeiro
- Lucro Líquido = LAIR - IR/CSLL

Documentar sempre que valor foi calculado/inferido.

## FORMATO DE OUTPUT JSON

Retorne APENAS o JSON, sem texto adicional:

\`\`\`json
{
  "metadados": {
    "empresa": "string",
    "cnpj": "string",
    "versao": "1.0.0",
    "data_base": "YYYY-MM-DD"
  },
  "anos": [
    {
      "ano_exercicio": 2024,
      "inputs": {
        "receita_liquida": 1000000.00,
        "cmv": 600000.00,
        "lucro_bruto": 400000.00,
        "despesas_vendas": 50000.00,
        "despesas_admin": 100000.00,
        "ebitda": 250000.00,
        "depreciacao": 30000.00,
        "ebit": 220000.00,
        "resultado_financeiro": -10000.00,
        "lair": 210000.00,
        "ir_csll": 50000.00,
        "lucro_liquido": 160000.00
      },
      "campos_calculados": ["lucro_bruto"],
      "avisos": ["Lucro Bruto calculado: Receita Líquida - CMV"]
    }
  ]
}
\`\`\``;

class LangchainAgent {
  constructor(config) {
    this.provider = config.provider || 'anthropic';
    this.config = config;
    this.model = null;

    this.initializeModel();
  }

  /**
   * Initialize model based on provider
   */
  initializeModel() {
    try {
      // Verificar se tem API key para o provider selecionado
      const providerConfig = this.config[this.provider];
      if (!providerConfig || !providerConfig.apiKey) {
        logger.warn(`No API key found for ${this.provider}, agent will not be available`);
        logger.info('To use agent, set the corresponding API key in .env');
        return;
      }

      switch (this.provider) {
        case 'openai':
          ChatOpenAI = require('@langchain/openai').ChatOpenAI;
          this.model = new ChatOpenAI({
            modelName: this.config.openai.model,
            temperature: this.config.openai.temperature,
            maxTokens: this.config.openai.maxTokens,
            openAIApiKey: this.config.openai.apiKey
          });
          logger.info('Initialized OpenAI model', { model: this.config.openai.model });
          break;

        case 'cohere':
          ChatCohere = require('@langchain/cohere').ChatCohere;
          this.model = new ChatCohere({
            model: this.config.cohere.model,
            temperature: this.config.cohere.temperature,
            maxTokens: this.config.cohere.maxTokens,
            apiKey: this.config.cohere.apiKey
          });
          logger.info('Initialized Cohere model', { model: this.config.cohere.model });
          break;

        case 'google':
          // Para Google Gemini (Vertex AI ou API)
          ChatGoogle = require('@langchain/google-genai').ChatGoogle;
          this.model = new ChatGoogle({
            model: this.config.google.model,
            temperature: this.config.google.temperature,
            maxTokens: this.config.google.maxTokens,
            apiKey: this.config.google.apiKey
          });
          logger.info('Initialized Google model', { model: this.config.google.model });
          break;

        case 'anthropic':
        default:
          ChatAnthropic = require('@langchain/anthropic').ChatAnthropic;
          this.model = new ChatAnthropic({
            modelName: this.config.anthropic.model,
            temperature: this.config.anthropic.temperature,
            maxTokens: this.config.anthropic.maxTokens,
            anthropicApiKey: this.config.anthropic.apiKey
          });
          logger.info('Initialized Anthropic model', { model: this.config.anthropic.model });
          break;
      }
    } catch (error) {
      logger.error('Failed to initialize model:', error);
      this.model = null; // Marcar como não inicializado
    }
  }

  /**
   * Process DRE data with agent
   */
  async processDre(parsedData, context = {}) {
    try {
      // Verificar se model foi inicializado
      if (!this.model) {
        logger.warn('LLM agent not available, model not initialized');
        return {
          success: false,
          provider: this.provider,
          error: 'LLM agent not available - check API key configuration'
        };
      }

      logger.info('Starting LLM agent processing', { provider: this.provider });

      const prompt = this.buildPrompt(parsedData, context);

      const { HumanMessage, SystemMessage } = require('@langchain/core/messages');

      const messages = [
        new SystemMessage({ content: DRE_AGENT_SYSTEM_PROMPT }),
        new HumanMessage({ content: prompt })
      ];

      const response = await this.model.invoke(messages);

      const result = this.parseResponse(response.content);

      logger.info('LLM agent processing completed', {
        provider: this.provider,
        yearsProcessed: result.anos?.length || 0
      });

      return {
        success: true,
        provider: this.provider,
        model: this.config[this.provider]?.model,
        data: result
      };

    } catch (error) {
      logger.error('LLM agent error:', error);
      return {
        success: false,
        provider: this.provider,
        error: error.message
      };
    }
  }

  /**
   * Build prompt for agent
   */
  buildPrompt(parsedData, context) {
    return `## DADOS PARSEADOS DO ARQUIVO

\`\`\`json
${JSON.stringify(parsedData, null, 2)}
\`\`\`

## CONTEXTO ADICIONAL

\`\`\`json
${JSON.stringify(context, null, 2)}
\`\`\`

## TAREFA

Processar os dados da DRE acima e transformá-los no formato padrão IconPlus.

REQUISITOS:
1. Extrair metadados (empresa, CNPJ, período)
2. Mapear campos para o schema IconPlus
3. Preservar precisão dos valores (2 casas decimais)
4. Inferir campos não explícitos quando possível
5. Validar lógica contábil básica
6. Documentar campos calculados/inferidos

OUTPUT: Apenas o JSON final no formato especificado, sem texto adicional.`;
  }

  /**
   * Parse agent response
   */
  parseResponse(content) {
    try {
      // Try direct parse
      return JSON.parse(content);
    } catch (error) {
      // Try to extract JSON from markdown
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Try to find JSON object
      const objectMatch = content.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        return JSON.parse(objectMatch[0]);
      }

      throw new Error('Could not extract JSON from agent response');
    }
  }
}

module.exports = LangchainAgent;
