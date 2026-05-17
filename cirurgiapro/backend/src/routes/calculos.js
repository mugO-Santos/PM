const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Função central de cálculo
function calcularProcedimento({ horaBase, valorBase, valorHoraExcedente, inicio, termino }) {
  const parseMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  let inicioMin = parseMinutes(inicio);
  let terminoMin = parseMinutes(termino);

  // Suporte a virada de meia-noite
  if (terminoMin <= inicioMin) {
    terminoMin += 24 * 60;
  }

  const duracaoTotalMinutos = terminoMin - inicioMin;
  const horaBaseMinutos = horaBase; // já em minutos
  const excedenteMinutos = Math.max(0, duracaoTotalMinutos - horaBaseMinutos);

  // Cálculo proporcional ao minuto
  const excedenteHoras = excedenteMinutos / 60;
  const valorExcedente = parseFloat((excedenteHoras * valorHoraExcedente).toFixed(2));
  const valorTotal = parseFloat((parseFloat(valorBase) + valorExcedente).toFixed(2));

  return {
    duracao_total_minutos: duracaoTotalMinutos,
    tempo_excedente_minutos: excedenteMinutos,
    valor_base: parseFloat(valorBase),
    valor_excedente: valorExcedente,
    valor_total: valorTotal,
  };
}

// POST /api/calculos/preview — cálculo sem salvar
router.post('/preview', async (req, res) => {
  try {
    const { procedimento_id, horario_inicio, horario_termino } = req.body;

    if (!procedimento_id || !horario_inicio || !horario_termino) {
      return res.status(400).json({ success: false, error: 'Campos obrigatórios ausentes' });
    }

    const proc = await pool.query('SELECT * FROM procedimentos WHERE id = $1', [procedimento_id]);
    if (proc.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Procedimento não encontrado' });
    }

    const p = proc.rows[0];
    const resultado = calcularProcedimento({
      horaBase: p.hora_base_minutos,
      valorBase: p.valor_base,
      valorHoraExcedente: p.valor_hora_excedente,
      inicio: horario_inicio,
      termino: horario_termino,
    });

    res.json({
      success: true,
      data: {
        procedimento: {
          id: p.id,
          nome: p.nome,
          cid: p.cid,
          tipo_anestesia: p.tipo_anestesia,
          hora_base_minutos: p.hora_base_minutos,
          valor_base: parseFloat(p.valor_base),
          valor_hora_excedente: parseFloat(p.valor_hora_excedente),
        },
        horario_inicio,
        horario_termino,
        ...resultado,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao calcular procedimento' });
  }
});

// POST /api/calculos — salvar cálculo
router.post('/', async (req, res) => {
  try {
    const { procedimento_id, horario_inicio, horario_termino, data_procedimento, observacoes } = req.body;

    if (!procedimento_id || !horario_inicio || !horario_termino) {
      return res.status(400).json({ success: false, error: 'Campos obrigatórios ausentes' });
    }

    const proc = await pool.query('SELECT * FROM procedimentos WHERE id = $1', [procedimento_id]);
    if (proc.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Procedimento não encontrado' });
    }

    const p = proc.rows[0];
    const resultado = calcularProcedimento({
      horaBase: p.hora_base_minutos,
      valorBase: p.valor_base,
      valorHoraExcedente: p.valor_hora_excedente,
      inicio: horario_inicio,
      termino: horario_termino,
    });

    const saved = await pool.query(
      `INSERT INTO calculos (procedimento_id, horario_inicio, horario_termino,
        duracao_total_minutos, tempo_excedente_minutos, valor_base,
        valor_excedente, valor_total, data_procedimento, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        procedimento_id, horario_inicio, horario_termino,
        resultado.duracao_total_minutos, resultado.tempo_excedente_minutos,
        resultado.valor_base, resultado.valor_excedente, resultado.valor_total,
        data_procedimento || new Date().toISOString().split('T')[0],
        observacoes || null,
      ]
    );

    res.status(201).json({ success: true, data: { ...saved.rows[0], procedimento: { nome: p.nome, cid: p.cid } } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao salvar cálculo' });
  }
});

// GET /api/calculos — histórico
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const result = await pool.query(
      `SELECT c.*, p.nome as procedimento_nome, p.cid, p.tipo_anestesia
       FROM calculos c
       JOIN procedimentos p ON c.procedimento_id = p.id
       ORDER BY c.criado_em DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao buscar histórico' });
  }
});

// GET /api/calculos/stats — estatísticas para o dashboard
router.get('/stats', async (req, res) => {
  try {
    const [totalProc, totalCalc, topProc, recentes] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM procedimentos'),
      pool.query('SELECT COUNT(*) as total, COALESCE(SUM(valor_total), 0) as soma FROM calculos'),
      pool.query(`
        SELECT p.nome, p.cid, COUNT(c.id) as total
        FROM procedimentos p
        LEFT JOIN calculos c ON c.procedimento_id = p.id
        GROUP BY p.id, p.nome, p.cid
        ORDER BY total DESC
        LIMIT 5
      `),
      pool.query(`
        SELECT c.id, p.nome as procedimento_nome, c.valor_total,
               c.data_procedimento, c.horario_inicio, c.horario_termino
        FROM calculos c
        JOIN procedimentos p ON c.procedimento_id = p.id
        ORDER BY c.criado_em DESC
        LIMIT 5
      `),
    ]);

    res.json({
      success: true,
      data: {
        total_procedimentos: parseInt(totalProc.rows[0].total),
        total_calculos: parseInt(totalCalc.rows[0].total),
        soma_calculos: parseFloat(totalCalc.rows[0].soma),
        top_procedimentos: topProc.rows,
        calculos_recentes: recentes.rows,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao buscar estatísticas' });
  }
});

// DELETE /api/calculos/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM calculos WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cálculo não encontrado' });
    }
    res.json({ success: true, message: 'Cálculo excluído com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao excluir cálculo' });
  }
});

module.exports = router;
