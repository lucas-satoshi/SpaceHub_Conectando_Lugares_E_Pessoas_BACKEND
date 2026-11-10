/**
 * SpaceHub - Database & Service Keep-Alive DEFINITIVO
 * 
 * Rotina multi-camada à prova de falhas:
 * 1. Escrita Real no PostgreSQL: Mantém a tabela `public._keep_alive` e faz UPSERT constante (gera WAL e modifica tuplas).
 * 2. Leitura Real de Tabelas de Usuário: Lê `users`, `spaces` e `bookings` para atualizar estatísticas de atividade em `pg_stat_user_tables`.
 * 3. Tráfego HTTP no Supabase API Gateway: Envia requisição HTTP para o Kong/PostgREST do Supabase.
 * 4. Ping no Backend (Render): Mantém a API aquecida e previne cold-starts.
 */

let Client;
try {
  Client = require('pg').Client;
} catch (err) {
  console.error('❌ Módulo "pg" não encontrado. Instale com: npm install pg');
  process.exit(1);
}

const SUPABASE_PROJECT_REF = 'jyleuldtdkmqnguhadqh';
const SUPABASE_REST_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co/rest/v1/`;
const RENDER_BACKEND_URL = process.env.RENDER_BACKEND_URL || 'https://spacehub-backend-9gih.onrender.com';

async function runDatabaseKeepAlive() {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

  if (!connectionString) {
    console.warn('⚠️ AVISO: Variável DATABASE_URL ou DIRECT_URL não foi definida.');
    console.warn('👉 Adicione a secret DATABASE_URL no seu repositório no GitHub (Settings -> Secrets and variables -> Actions).');
    return false;
  }

  // Ocultar a senha no log para manter a segurança
  const maskedUrl = connectionString.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:******@');
  console.log(`🔌 Conectando ao PostgreSQL em: ${maskedUrl}`);

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 20000,
  });

  try {
    await client.connect();
    console.log('✅ Conexão com o banco estabelecida com sucesso!');

    // 1. Criação/garantia da tabela de controle (atividade de schema)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public._keep_alive (
        id INT PRIMARY KEY,
        contador BIGINT NOT NULL DEFAULT 1,
        ultimo_ping TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        origem VARCHAR(50) NOT NULL DEFAULT 'github_actions',
        detalhes TEXT
      );
    `);

    // 2. Escrita real via UPSERT (gera WAL, grava dados no disco e atualiza pg_stat_user_tables)
    const upsertRes = await client.query(`
      INSERT INTO public._keep_alive (id, contador, ultimo_ping, origem, detalhes)
      VALUES (1, 1, NOW(), 'github_actions', 'SpaceHub Keep-Alive Heartbeat')
      ON CONFLICT (id) DO UPDATE
      SET contador = public._keep_alive.contador + 1,
          ultimo_ping = NOW(),
          detalhes = 'Heartbeat atualizado via GitHub Actions'
      RETURNING contador, ultimo_ping;
    `);

    const heartbeat = upsertRes.rows[0];
    console.log(`📝 Escrita real no banco concluída! Heartbeat #${heartbeat.contador} em: ${heartbeat.ultimo_ping}`);

    // 3. Leitura real nas tabelas de negócio do SpaceHub (gera seq_scan/idx_scan em tabelas do usuário)
    const usersCount = await client.query('SELECT COUNT(*) AS total FROM public.users;');
    const spacesCount = await client.query('SELECT COUNT(*) AS total FROM public.spaces;');
    const bookingsCount = await client.query('SELECT COUNT(*) AS total FROM public.bookings;');

    console.log('📊 Leitura real nas tabelas da aplicação:');
    console.log(`   - users: ${usersCount.rows[0].total} registros`);
    console.log(`   - spaces: ${spacesCount.rows[0].total} registros`);
    console.log(`   - bookings: ${bookingsCount.rows[0].total} registros`);
    console.log('🎉 Atividade real completa registrada no PostgreSQL!');
    return true;
  } catch (error) {
    console.error('❌ Erro na rotina de banco de dados:', error.message);
    throw error;
  } finally {
    await client.end().catch(() => {});
  }
}

async function pingSupabaseGateway() {
  console.log(`\n🌐 Enviando requisição ao Gateway HTTP do Supabase: ${SUPABASE_REST_URL}`);
  try {
    const res = await fetch(SUPABASE_REST_URL, {
      method: 'GET',
      headers: { 'User-Agent': 'SpaceHub-AntiPause-Bot/1.0' },
      signal: AbortSignal.timeout(15000),
    });
    console.log(`📡 Supabase Gateway alcançado (HTTP status ${res.status})`);
  } catch (err) {
    console.warn('⚠️ Alerta ao chamar Supabase Gateway:', err.message);
  }
}

async function pingBackend() {
  console.log(`\n🚀 Enviando ping ao backend Render: ${RENDER_BACKEND_URL}`);
  try {
    const response = await fetch(RENDER_BACKEND_URL, {
      method: 'GET',
      headers: { 'User-Agent': 'SpaceHub-KeepAlive-Bot/1.0' },
      signal: AbortSignal.timeout(45000),
    });
    const body = await response.text();
    console.log(`✅ Backend Render respondeu com status ${response.status}: ${body.slice(0, 150)}`);
  } catch (error) {
    console.warn('⚠️ Alerta ao consultar o backend Render (pode estar em inicialização/cold-start):', error.message);
  }
}

async function main() {
  console.log('====================================================');
  console.log('⏰ [SPACEHUB] ROTINA DEFINITIVA DE KEEP-ALIVE ANTI-PAUSA');
  console.log(`📅 Data/Hora: ${new Date().toISOString()}`);
  console.log('====================================================\n');

  let dbSuccess = false;
  try {
    dbSuccess = await runDatabaseKeepAlive();
  } catch (err) {
    process.exitCode = 1;
  }

  await pingSupabaseGateway();
  await pingBackend();

  console.log('\n====================================================');
  if (dbSuccess) {
    console.log('✨ Keep-Alive definitivo concluído com 100% de sucesso!');
  } else {
    console.log('⚠️ Keep-Alive finalizado com pendências na conexão do banco.');
  }
  console.log('====================================================');
}

main();
