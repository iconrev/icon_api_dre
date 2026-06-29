# Deploy na Railway - Guia Rápido

## 1. Preparar o Repositório

```bash
cd icon-api-dre

# Inicializar git
git init
git add .
git commit -m "Initial commit: Icon API DRE"

# Adicionar remote
git remote add origin https://github.com/seu-usuario/icon-api-dre.git

# Push
git push -u origin main
```

## 2. Criar Projeto na Railway

1. Acesse https://railway.app
2. Clique em "New Project" → "Deploy from GitHub repo"
3. Selecione `icon-api-dre`
4. Clique em "Deploy Now"

## 3. Configurar Variáveis de Ambiente

No dashboard do projeto Railway, vá em "Variables" e adicione:

```
ANTHROPIC_API_KEY=sk-ant-xxxxxx
NODE_ENV=production
```

## 4. Deploy Automático

Railway detectará mudanças e fará deploy automático.

URL será algo como: `https://icon-api-dre.up.railway.app`

## 5. Testar

```bash
# Health check
curl https://icon-api-dre.up.railway.app/health

# Testar processamento
curl -X POST https://icon-api-dre.up.railway.app/api/dre/process/base64 \
  -H "Content-Type: application/json" \
  -d @examples/request-example.json
```

## Troubleshooting

### Build falha

Verificar logs em "Deployments" → "View Logs"

### Variáveis não funcionam

Ir em "Variables" e clicar em "Restart" para reiniciar com novas variáveis

### Ver domain URL

No dashboard, em "Settings" → "Generate Domain" para ver a URL

---

Deploy concluído! 🚀
