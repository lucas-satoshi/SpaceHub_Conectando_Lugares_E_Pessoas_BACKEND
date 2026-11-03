/**
 * SpaceHub - Database & Service Keep-Alive
 * 
 * Este script é executado periodicamente pelo GitHub Actions para:
 * 1. Fazer uma query no Supabase (PostgreSQL), evitando que o banco seja pausado por inatividade no plano gratuito.
 * 2. Enviar uma requisição HTTP ao backend no Render, evitando cold-starts e verificando a disponibilidade.
 */

let Client;
try {
  Client = require('pg').Client;
} catch (err) {
  console.error('❌ Módulo "pg" não encontrado. Instale com: npm install pg');
  process.exit(1);
}

async function pingDatabase() {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

  if (!connectionString) {
    console.warn('⚠️ AVISO: Variável DATABASE_URL ou DIRECT_URL não foi definida.');
    console.warn('👉 Adicione a secret DATABASE_URL no seu repositório no GitHub (Settings -> Secrets and variables -> Actions).');
    return false;
  }

  // Ocultar a senha no log para manter a segurança
  const maskedUrl = connectionString.replace(/:(.*?)@/, ':******@');
  console.log(`🔄 Conectando ao PostgreSQL em: ${maskedUrl}`);

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    const startTime = Date.now();
    const res = await client.query('SELECT NOW() as current_time, 1 as alive;');
    const latency = Date.now() - startTime;

    console.log('✅ Conexão com o banco estabelecida com sucesso!');
    console.log(`⏱️ Latência da query: ${latency}ms`);
    console.log(`🕒 Timestamp do servidor DB: ${res.rows[0].current_time}`);
    console.log('🎉 Supabase mantido ativo (Keep-Alive confirmado)!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao consultar o banco de dados:', error.message);
    throw error;
  } finally {
    await client.end().catch(() => {});
  }
}

async function pingBackend() {
  const backendUrl = process.env.RENDER_BACKEND_URL || 'https://spacehub-backend-9gih.onrender.com';
  console.log(`\n🔄 Enviando ping ao backend Render: ${backendUrl}`);

  try {
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'SpaceHub-KeepAlive-Bot/1.0' },
      signal: AbortSignal.timeout(30000), // timeout de 30s para acomodar cold start do Render
    });

    const body = await response.text();
    console.log(`✅ Backend respondeu com status ${response.status}: ${body.slice(0, 150)}`);
  } catch (error) {
    console.warn('⚠️ Alerta ao consultar o backend Render (pode estar em inicialização/cold-start):', error.message);
  }
}

async function main() {
  console.log('==============================================');
  console.log('🚀 Iniciando tarefa agendada de Keep-Alive');
  console.log(`📅 Data/Hora da execução: ${new Date().toISOString()}`);
  console.log('==============================================\n');

  let dbSuccess = false;
  try {
    dbSuccess = await pingDatabase();
  } catch (err) {
    process.exitCode = 1;
  }

  await pingBackend();

  console.log('\n==============================================');
  if (dbSuccess) {
    console.log('✨ Tarefa de Keep-Alive concluída com sucesso!');
  } else {
    console.log('⚠️ Tarefa concluída com pendências na conexão do banco.');
  }
  console.log('==============================================');
}

main();
