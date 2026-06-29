/**
 * Configuração do Swagger/OpenAPI
 *
 * O servidor listado na documentação é definido dinamicamente para funcionar
 * tanto em desenvolvimento (localhost) quanto no deploy da Railway.
 */

const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const baseDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Icon API DRE',
    version: '1.0.0',
    description: 'API isolada para processamento de DRE (Demonstração do Resultado do Exercício) com LangChain',
    contact: {
      name: 'IconPlus Team'
    }
  },
  tags: [
    {
      name: 'Health',
      description: 'Endpoints de verificação de saúde'
    },
    {
      name: 'DRE',
      description: 'Endpoints para processamento e validação de DRE'
    }
  ]
};

const options = {
  definition: baseDefinition,
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../server.js')
  ]
};

const specs = swaggerJsdoc(options);

/**
 * Retorna a especificação Swagger com o servidor ajustado para o host da requisição.
 * Usa RAILWAY_PUBLIC_DOMAIN quando disponível (variável injetada automaticamente pela Railway),
 * caso contrário utiliza o host/cabeçalhos da requisição.
 */
function getSpecs(req) {
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';

  let url;
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    url = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  } else {
    const host = req.get('x-forwarded-host') || req.get('host') || `localhost:${process.env.PORT || 3000}`;
    url = `${protocol}://${host}`;
  }

  return {
    ...specs,
    servers: [
      {
        url,
        description: process.env.RAILWAY_ENVIRONMENT ? 'Servidor Railway' : 'Servidor de desenvolvimento'
      }
    ]
  };
}

module.exports = { specs, getSpecs };
