# LLM Providers - Guia de Configuração

A API suporta múltiplos provedores de LLM. Escolha aquele que melhor se adequa ao seu projeto.

## Provedores Disponíveis

### 1. OpenAI (GPT-4, GPT-3.5) ✅ Recomendado

**Vantagens:**
- Mais barato que Anthropic
- GPT-4 excelente para tarefas complexas
- GPT-3.5 Turbo muito econômico
- Amplamente disponível

**Custos (aproximados):**
- GPT-4: ~$0.03/1K tokens (input), $0.06/1K tokens (output)
- GPT-3.5 Turbo: ~$0.001/1K tokens (input), $0.002/1K tokens (output)

**Configuração:**

```bash
# .env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-xxx
OPENAI_MODEL=gpt-4  # ou gpt-3.5-turbo
```

**Obter API Key:**
1. Acesse https://platform.openai.com
2. Crie uma conta
3. Vá em "API Keys" → "Create new secret key"
4. Copie a chave

---

### 2. Anthropic Claude

**Vantagens:**
- Claude 3.5 Sonnet muito bom em português
- Contexto maior (200K tokens)
- Excelente para análise financeira

**Custos (aproximados):**
- Claude 3.5 Sonnet: ~$0.003/1K tokens (input), $0.015/1K tokens (output)

**Configuração:**

```bash
# .env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxx
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

**Obter API Key:**
1. Acesse https://console.anthropic.com
2. Crie uma conta
3. Vá em "API Keys"
4. Copie a chave

---

### 3. Google Gemini

**Vantagens:**
- Gemini Pro muito econômico
- Integração com Google Cloud
- Boa performance

**Custos (aproximados):**
- Gemini Pro: ~$0.00025/1K caracteres (grátis até 60 tokens/min)

**Configuração:**

```bash
# .env
LLM_PROVIDER=google
GOOGLE_API_KEY=xxx
GOOGLE_MODEL=gemini-pro
```

**Obter API Key:**
1. Acesse https://makersuite.google.com/app/apikey
2. Criar projeto Google Cloud
3. Habilitar Gemini API
4. Gerar API key

**Nota:** Requer instalação adicional:
```bash
npm install @langchain/google-genai
```

---

### 4. Cohere Command

**Vantagens:**
- Command R+ excelente para RAG
- Preço competitivo
- API simples

**Custos (aproximados):**
- Command R+: ~$0.003/1K tokens

**Configuração:**

```bash
# .env
LLM_PROVIDER=cohere
COHERE_API_KEY=xxx
COHERE_MODEL=command-r-plus
```

**Obter API Key:**
1. Acesse https://dashboard.cohere.com/apiKeys
2. Criar conta
3. Gerar API key

**Nota:** Requer instalação adicional:
```bash
npm install @langchain-cohere
```

---

## Comparação de Custos (Estimado para 100 processamentos/mês)

Assumindo 5K tokens por processamento:

| Provider | Modelo | Custo por 1K tokens | Custo mensal |
|----------|--------|-------------------|-------------|
| OpenAI | GPT-3.5 Turbo | $0.001-$0.002 | ~$1 |
| OpenAI | GPT-4 | $0.03-$0.06 | ~$25 |
| Anthropic | Claude 3.5 Sonnet | $0.003-$0.015 | ~$9 |
| Google | Gemini Pro | $0.00025 | ~$1 |
| Cohere | Command R+ | $0.003 | ~$1.5 |

**Recomendação:** Começar com **OpenAI GPT-3.5 Turbo** ou **Google Gemini** para testes, depois migrar para GPT-4 ou Claude se necessário.

---

## Exemplos de Uso

### Usar OpenAI (GPT-3.5 Turbo)

```bash
# .env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-abc123
OPENAI_MODEL=gpt-3.5-turbo
```

Request:
```bash
curl -X POST http://localhost:3000/api/dre/process/base64 \
  -H "Content-Type: application/json" \
  -d '{
    "file": "base64data",
    "filename": "dre.xlsx",
    "useAgent": true
  }'
```

Response:
```json
{
  "success": true,
  "processing": {
    "agentUsed": true,
    "provider": "openai",
    "model": "gpt-3.5-turbo"
  }
}
```

### Usar Anthropic (Claude)

```bash
# .env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xyz789
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### Mudar Provider Dinamicamente

```javascript
// No código
const config = require('./config/config');

// Mudar para OpenAI
config.llm.provider = 'openai';

// Reinicializar serviço
const dreService = new DreService(config);
```

---

## Teste de Provider

```bash
# Testar health check mostra provider atual
curl http://localhost:3000/api/dre/health

# Response:
{
  "success": true,
  "config": {
    "anthropicEnabled": true,
    "openaiEnabled": true,
    "currentProvider": "openai"
  }
}
```

---

## Troubleshooting

### Erro: "API key not found"

Verificar se a chave correta está configurada:

```bash
# Verificar .env
cat .env | grep API_KEY
```

### Erro: "Model not found"

Verificar se o modelo está correto para o provider:

```bash
# OpenAI: gpt-4, gpt-3.5-turbo
# Anthropic: claude-3-5-sonnet-20241022
# Google: gemini-pro, gemini-pro-vision
# Cohere: command-r-plus, command
```

### Trocar Provider em Produção (Railway)

1. Vá ao dashboard da Railway
2. Clique em "Variables"
3. Altere `LLM_PROVIDER` para o novo valor
4. Adicione a nova API key
5. Clique em "Restart"

---

## Performance

Tempos médios de processamento (5 anos de DRE):

| Provider | Modelo | Tempo |
|----------|--------|-------|
| OpenAI | GPT-3.5 Turbo | ~2-3s |
| OpenAI | GPT-4 | ~3-5s |
| Anthropic | Claude 3.5 Sonnet | ~3-4s |
| Google | Gemini Pro | ~2-3s |
| Cohere | Command R+ | ~3-4s |

---

## Recomendação Final

**Para produção:**
- 🥇 **OpenAI GPT-3.5 Turbo** - Melhor custo/benefício
- 🥈 **Google Gemini Pro** - Alternativa econômica
- 🥉 **OpenAI GPT-4** - Máxima qualidade (se orçamento permitir)

**Para desenvolvimento/testes:**
- Use GPT-3.5 Turbo ou Gemini Pro
- Mais econômico para testes frequentes

---

Escolha o provider que melhor se adapta ao seu orçamento e necessidades! 🚀
