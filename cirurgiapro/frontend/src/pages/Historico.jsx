import { useState, useEffect } from 'react';
import { api } from '../api/index.js';
import { formatBRL, formatMinutes, anestesiaBadgeClass } from '../utils/format.js';

export default function Historico() {
  const [calculos, setCalculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    api.getCalculos(100)
      .then((r) => setCalculos(r.data))
      .catch(() => setError('Erro ao carregar histórico'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    try {
      await api.deleteCalculo(id);
      setCalculos((c) => c.filter((x) => x.id !== id));
      setDeleteConfirm(null);
    } catch {
      setError('Erro ao excluir cálculo');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Histórico de Cálculos</h2>
          <p className="page-subtitle">{calculos.length} registro(s)</p>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      <div className="table-wrap">
        {loading ? (
          <div className="loading-page">
            <div className="spinner" style={{ borderTopColor: 'var(--azul-principal)', borderColor: 'var(--cinza-200)' }} />
          </div>
        ) : calculos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">◷</div>
            <div className="empty-state-title">Nenhum cálculo realizado</div>
            <div className="empty-state-text">Os cálculos salvos aparecerão aqui</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Procedimento</th>
                <th>Anestesia</th>
                <th>Horário</th>
                <th>Duração</th>
                <th>Excedente</th>
                <th>Valor Base</th>
                <th>Valor Exc.</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {calculos.map((c) => (
                <tr key={c.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem', color: 'var(--cinza-500)' }}>
                    {new Date(c.data_procedimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--cinza-800)', fontSize: '0.88rem' }}>{c.procedimento_nome}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--cinza-400)' }}>{c.cid}</div>
                  </td>
                  <td>
                    <span className={`badge ${anestesiaBadgeClass(c.tipo_anestesia)}`}>{c.tipo_anestesia}</span>
                  </td>
                  <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    {c.horario_inicio?.slice(0, 5)} → {c.horario_termino?.slice(0, 5)}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{formatMinutes(c.duracao_total_minutos)}</td>
                  <td>
                    {c.tempo_excedente_minutos > 0
                      ? <span style={{ color: 'var(--laranja)', fontWeight: 500, fontSize: '0.85rem' }}>{formatMinutes(c.tempo_excedente_minutos)}</span>
                      : <span style={{ color: 'var(--verde-medico)', fontSize: '0.82rem' }}>—</span>
                    }
                  </td>
                  <td style={{ fontSize: '0.88rem' }}>{formatBRL(c.valor_base)}</td>
                  <td style={{ fontSize: '0.88rem', color: c.valor_excedente > 0 ? 'var(--laranja)' : 'var(--cinza-400)' }}>
                    {c.valor_excedente > 0 ? formatBRL(c.valor_excedente) : '—'}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--verde-medico)', whiteSpace: 'nowrap' }}>
                    {formatBRL(c.valor_total)}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm"
                      style={{ background: 'var(--vermelho-claro)', color: 'var(--vermelho)' }}
                      onClick={() => setDeleteConfirm(c)}
                    >🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Totalizador */}
      {calculos.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-body" style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cinza-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total de registros</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--cinza-900)' }}>{calculos.length}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cinza-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Soma total honorários</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--verde-medico)' }}>
                {formatBRL(calculos.reduce((acc, c) => acc + parseFloat(c.valor_total), 0))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cinza-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total excedentes</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--laranja)' }}>
                {formatBRL(calculos.reduce((acc, c) => acc + parseFloat(c.valor_excedente), 0))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <span className="modal-title">Excluir registro</span>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.92rem', color: 'var(--cinza-600)' }}>
                Deseja excluir o cálculo de <strong>{deleteConfirm.procedimento_nome}</strong> ({formatBRL(deleteConfirm.valor_total)})?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>🗑 Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
