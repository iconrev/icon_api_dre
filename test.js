/**
 * Teste de diagnóstico
 */

console.log('=== Teste de diagnóstico ===');

// Test 1: Carregar módulos
console.log('\n1. Testando carregamento de módulos...');
try {
  require('dotenv').config();
  console.log('✅ dotenv OK');
} catch (e) {
  console.log('❌ dotenv erro:', e.message);
}

try {
  require('express');
  console.log('✅ express OK');
} catch (e) {
  console.log('❌ express erro:', e.message);
}

// Test 2: Carregar config
console.log('\n2. Testando config...');
try {
  const config = require('./src/config/config');
  console.log('✅ config carregado');
  console.log('   LLM Provider:', config.llm.provider);
  console.log('   API Key existe:', !!config.llm.cohere?.apiKey);
} catch (e) {
  console.log('❌ config erro:', e.message);
  console.log('   Stack:', e.stack);
}

// Test 3: Carregar services
console.log('\n3. Testando services...');
try {
  const LangchainAgent = require('./src/services/langchainAgent');
  console.log('✅ LangchainAgent carregado');
} catch (e) {
  console.log('❌ LangchainAgent erro:', e.message);
  console.log('   Stack:', e.stack);
}

try {
  const FileParser = require('./src/services/fileParser');
  console.log('✅ FileParser carregado');
} catch (e) {
  console.log('❌ FileParser erro:', e.message);
  console.log('   Stack:', e.stack);
}

try {
  const DreService = require('./src/services/dreService');
  console.log('✅ DreService carregado');
} catch (e) {
  console.log('❌ DreService erro:', e.message);
  console.log('   Stack:', e.stack);
}

// Test 4: Carregar server
console.log('\n4. Testando server...');
try {
  const app = require('./src/server');
  console.log('✅ Server carregado');
} catch (e) {
  console.log('❌ Server erro:', e.message);
  console.log('   Stack:', e.stack);
}

console.log('\n=== Teste concluído ===');
