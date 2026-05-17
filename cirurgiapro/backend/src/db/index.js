const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS procedimentos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR(255) NOT NULL,
        cid VARCHAR(20) NOT NULL,
        valor_base NUMERIC(12, 2) NOT NULL,
        hora_base_minutos INTEGER NOT NULL,
        valor_hora_excedente NUMERIC(10, 2) NOT NULL,
        tipo_anestesia VARCHAR(50) NOT NULL,
        observacoes TEXT,
        criado_em TIMESTAMPTZ DEFAULT NOW(),
        atualizado_em TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS calculos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        procedimento_id UUID NOT NULL REFERENCES procedimentos(id) ON DELETE CASCADE,
        horario_inicio TIME NOT NULL,
        horario_termino TIME NOT NULL,
        duracao_total_minutos INTEGER NOT NULL,
        tempo_excedente_minutos INTEGER NOT NULL DEFAULT 0,
        valor_base NUMERIC(12, 2) NOT NULL,
        valor_excedente NUMERIC(12, 2) NOT NULL DEFAULT 0,
        valor_total NUMERIC(12, 2) NOT NULL,
        data_procedimento DATE DEFAULT CURRENT_DATE,
        observacoes TEXT,
        criado_em TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_procedimentos_nome ON procedimentos(nome);
      CREATE INDEX IF NOT EXISTS idx_procedimentos_cid ON procedimentos(cid);
      CREATE INDEX IF NOT EXISTS idx_calculos_procedimento ON calculos(procedimento_id);
      CREATE INDEX IF NOT EXISTS idx_calculos_data ON calculos(data_procedimento);
    `);
    console.log('✅ Banco de dados inicializado com sucesso');
  } catch (err) {
    console.error('❌ Erro ao inicializar banco de dados:', err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, initDb };
