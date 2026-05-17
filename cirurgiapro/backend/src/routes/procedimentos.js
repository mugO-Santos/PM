const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/procedimentos — listar todos
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT id, nome, cid, valor_base, hora_base_minutos,
             valor_hora_excedente, tipo_anestesia, observacoes,
             criado_em, atualizado_em
      FROM procedimentos
    `;
    const params = [];
    if (search) {
      query += ` WHERE nome ILIKE $1 OR cid ILIKE $1`;
      params.push(`%${search}%`);
    }
    query += ` ORDER BY nome ASC`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao buscar procedimentos' });
  }
});

// GET /api/procedimentos/:id — buscar por id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM procedimentos WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Procedimento não encontrado' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao buscar procedimento' });
  }
});

// POST /api/procedimentos — criar
router.post('/', async (req, res) => {
  try {
    const { nome, cid, valor_base, hora_base_minutos, valor_hora_excedente, tipo_anestesia, observacoes } = req.body;

    if (!nome || !cid || valor_base == null || hora_base_minutos == null || valor_hora_excedente == null || !tipo_anestesia) {
      return res.status(400).json({ success: false, error: 'Campos obrigatórios ausentes' });
    }

    const result = await pool.query(
      `INSERT INTO procedimentos (nome, cid, valor_base, hora_base_minutos, valor_hora_excedente, tipo_anestesia, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [nome.trim(), cid.trim().toUpperCase(), valor_base, hora_base_minutos, valor_hora_excedente, tipo_anestesia, observacoes || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao criar procedimento' });
  }
});

// PUT /api/procedimentos/:id — atualizar
router.put('/:id', async (req, res) => {
  try {
    const { nome, cid, valor_base, hora_base_minutos, valor_hora_excedente, tipo_anestesia, observacoes } = req.body;

    const result = await pool.query(
      `UPDATE procedimentos SET
        nome = COALESCE($1, nome),
        cid = COALESCE($2, cid),
        valor_base = COALESCE($3, valor_base),
        hora_base_minutos = COALESCE($4, hora_base_minutos),
        valor_hora_excedente = COALESCE($5, valor_hora_excedente),
        tipo_anestesia = COALESCE($6, tipo_anestesia),
        observacoes = $7,
        atualizado_em = NOW()
       WHERE id = $8
       RETURNING *`,
      [nome, cid ? cid.toUpperCase() : null, valor_base, hora_base_minutos, valor_hora_excedente, tipo_anestesia, observacoes || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Procedimento não encontrado' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao atualizar procedimento' });
  }
});

// DELETE /api/procedimentos/:id — excluir
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM procedimentos WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Procedimento não encontrado' });
    }
    res.json({ success: true, message: 'Procedimento excluído com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao excluir procedimento' });
  }
});

module.exports = router;
