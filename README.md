# Icon API DRE

API isolada para processamento de DRE (Demonstrações do Resultado do Exercício) com LangChain - **Suporta múltiplos LLM providers** - Deploy na Railway.

## 🚀 Features

- **Multi-formato**: Excel (.xlsx, .xls), CSV, PDF
- **Múltiplos LLMs**: OpenAI (GPT-4), Anthropic (Claude), Google (Gemini), Cohere
- **Validação**: Verificação de fórmulas contábeis
- **Quality Score**: Pontuação de qualidade dos dados
- **API REST**: Endpoints simples e documentados
- **Deploy Railway**: Configurado e pronto para deploy

## 💡 LLM Providers Suportados

| Provider | Modelos | Custo (aprox) | Recomendação |
|----------|---------|---------------|--------------|
| **OpenAI** | GPT-4, GPT-3.5 Turbo | $1-25/mês | ✅ Recomendado |
| **Anthropic** | Claude 3.5 Sonnet | ~$9/mês | ✅ Excelente PT-BR |
| **Google** | Gemini Pro | ~$1/mês | ✅ Econômico |
| **Cohere** | Command R+ | ~$1.5/mês | Bom para RAG |

> **Recomendação:** Começar com **OpenAI GPT-3.5 Turbo** - melhor custo/benefício.

Ver [docs/LLM_PROVIDERS.md](docs/LLM_PROVIDERS.md) para detalhes.

## 📁 Estrutura

```
icon-api-dre/
├── src/
│   ├── config/          # Configurações (multi-provider)
│   ├── controllers/     # Controllers
│   ├── routes/          # Rotas Express
│   ├── services/        # Serviços (Parser, Agent, Validator)
│   ├── utils/           # Utilitários (logger)
│   └── server.js        # Entry point
├── docs/                # Documentação
│   └── LLM_PROVIDERS.md # Guia de providers
├── logs/                # Logs
├── uploads/             # Uploads temporários
├── .env.example         # Variáveis de ambiente
├── railway.json         # Config Railway
├── Procfile             # Config Railway
├── package.json         # Dependências
└── README.md            # Documentação
```

## 🔧 Setup Local

### 1. Instalar dependências

```bash
cd icon-api-dre
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Escolher provider: openai, anthropic, google, cohere
LLM_PROVIDER=openai

# OpenAI (recomendado)
OPENAI_API_KEY=sk-proj-xxx
OPENAI_MODEL=gpt-4

# Ou Anthropic Claude
# ANTHROPIC_API_KEY=sk-ant-xxx
# ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### 3. Iniciar servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

Servidor vai rodar em `http://localhost:3000`

## 🚢 Deploy na Railway

### 1. Push para GitHub

```bash
git init
git add .
git commit -m "Icon API DRE - Multi LLM Provider"
git remote add origin https://github.com/seu-usuario/icon-api-dre.git
git push -u origin main
```

### 2. Criar projeto na Railway

1. Acesse [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Selecione `icon-api-dre`

### 3. Configurar variáveis de ambiente

No dashboard Railway, adicione:

```
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-xxx
NODE_ENV=production
```

### 4. Deploy automático!

URL: `https://icon-api-dre.up.railway.app`

## 📚 API Documentation

### POST /api/dre/process/base64

Processa arquivo DRE via base64 (ideal para frontend).

**Request:**

```bash
curl -X POST https://sua-api.railway.app/api/dre/process/base64 \
  -H "Content-Type: application/json" \
  -d '{
    "file": "base64_encoded_file",
    "filename": "dre.xlsx",
    "useAgent": true
  }'
```

**Response:**

```json
{
  "success": true,
  "processingTime": 3245,
  "processing": {
    "agentUsed": true,
    "provider": "openai",
    "model": "gpt-4"
  },
  "data": {
    "metadados": {
      "empresa": "Empresa ABC",
      "cnpj": "12.345.678/0001-90"
    },
    "anos": [
      {
        "ano_exercicio": 2024,
        "inputs": {
          "receita_liquida": 1000000.00,
          "cmv": 600000.00,
          "lucro_bruto": 400000.00,
          "lucro_liquido": 160000.00
        }
      }
    ]
  },
  "validation": {
    "isValid": true,
    "qualityScore": 95
  }
}
```

### GET /api/dre/formats

Lista formatos suportados.

### GET /api/dre/health

Health check com provider atual.

## 🎯 Integração Frontend

```javascript
// React/Vue/ qualquer frontend
async function processDre(file) {
  const base64 = await toBase64(file);

  const response = await fetch('https://sua-api.railway.app/api/dre/process/base64', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file: base64,
      filename: file.name,
      useAgent: true
    })
  });

  const result = await response.json();

  if (result.validation.isValid) {
    console.log('Quality Score:', result.validation.qualityScore);
    console.log('Provider:', result.processing.provider);
    console.log('DRE Data:', result.data);
  }
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
}
```

## 💰 Custos

### Railway
- Free: $5/mês (5 horas)
- Paid: ~$20/mês (ilimitado)

### LLM (estimado 100 processamentos/mês)
| Provider | Custo mensal |
|----------|-------------|
| OpenAI GPT-3.5 | ~$1 |
| OpenAI GPT-4 | ~$25 |
| Anthropic Claude | ~$9 |
| Google Gemini | ~$1 |
| Cohere | ~$1.5 |

**Total estimado:** ~$21-45/mês (dependendo do LLM)

## 📖 Documentação

- [LLM Providers](docs/LLM_PROVIDERS.md) - Guia completo de providers
- [Deploy](DEPLOYMENT.md) - Deploy na Railway
- [.env.example](.env.example) - Variáveis de ambiente

## 🔐 Segurança

Adicione autenticação conforme necessário:

```javascript
// src/routes/dre.js
router.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
});
```

## 🔄 Trocar LLM Provider

```bash
# .env
# De OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-xxx

# Para Anthropic
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxx

# Ou Google
LLM_PROVIDER=google
GOOGLE_API_KEY=xxx
```

## 📊 Campos Padrão IconPlus

| Campo | Obrigatório |
|-------|-------------|
| receita_liquida | ✅ SIM |
| cmv | ✅ SIM |
| lucro_liquido | ✅ SIM |
| lucro_bruto | ❌ NÃO |
| ebitda | ❌ NÃO |
| ebit | ❌ NÃO |
| depreciacao | ❌ NÃO |

---

**IconPlus Team** 🚀
