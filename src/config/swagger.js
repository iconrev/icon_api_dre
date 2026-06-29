/**
 * Configuração do Swagger/OpenAPI
 */

const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Icon API DRE',
      version: '1.0.0',
      description: 'API isolada para processamento de DRE (Demonstração do Resultado do Exercício) com LangChain',
      contact: {
        name: 'IconPlus Team'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desenvolvimento'
      }
    ],
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
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../server.js')
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs;
