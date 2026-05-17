import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/index.js';
import { formatBRL, formatMinutes } from '../utils/format.js';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.getStats()
      .then((r) => setStats(r.data))
      .catch(() => setError('Erro ao carregar estatísticas'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" style={{ borderTopColor: 'var(--azul-principal)', borderColor: 'var(--cinza-200)' }} />
        <span>Carregando...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Bem-vindo ao CirurgiaPro</h2>
          <p className="page-subtitle">Resumo geral do sistema</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/calculo')}>
          ⊕ Novo Cálculo
        </button>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon azul">🔬</div>
          <div>
            <div className="stat-value">{stats?.total_procedimentos ?? 0}</div>
            <div className="stat-label">Procedimentos cadastrados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon verde">📋</div>
          <div>
            <div className="stat-value">{stats?.total_calculos ?? 0}</div>
            <div className="stat-label">Cálculos realizados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon laranja">💰</div>
          <div>
            <div className="stat-value" style={{ fontSize: '1.2rem' }}>{formatBRL(stats?.soma_calculos)}</div>
            <div className="stat-label">Total em honorários</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Top procedimentos */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Procedimentos mais realizados</span>
          </div>
          <div className="card-body">
            {!stats?.top_procedimentos?.length ? (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-title">Sem dados ainda</div>
                <div className="empty-state-text">Realize cálculos para ver aqui</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stats.top_procedimentos.map((p, i) => (
                  <div key={p.nome} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, background: 'var(--azul-claro)',
                      color: 'var(--azul-principal)', fontSize: '0.78rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--cinza-700)' }}>{p.nome}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--cinza-400)' }}>{p.cid}</div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--cinza-500)' }}>{p.total}x</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cálculos recentes */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Cálculos recentes</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/historico')}>Ver todos</button>
          </div>
          <div className="card-body">
            {!stats?.calculos_recentes?.length ? (
              <div className="empty-state">
                <div className="empty-state-icon">◷</div>
                <div className="empty-state-title">Nenhum cálculo</div>
                <div className="empty-state-text">Os cálculos aparecerão aqui</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stats.calculos_recentes.map((c) => (
                  <div key={c.id} style={{
                    padding: '10px 14px', borderRadius: 8,
                    background: 'var(--cinza-50)', border: '1px solid var(--cinza-200)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--cinza-700)' }}>
                        {c.procedimento_nome}
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--verde-medico)', whiteSpace: 'nowrap', marginLeft: 8 }}>
                        {formatBRL(c.valor_total)}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--cinza-400)', marginTop: 2 }}>
                      {c.horario_inicio?.slice(0, 5)} → {c.horario_termino?.slice(0, 5)} · {new Date(c.data_procedimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <span className="card-title">Ações rápidas</span>
        </div>
        <div className="card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/calculo')}>⊕ Calcular procedimento</button>
          <button className="btn btn-ghost" onClick={() => navigate('/procedimentos')}>◉ Cadastrar procedimento</button>
          <button className="btn btn-ghost" onClick={() => navigate('/historico')}>◷ Ver histórico</button>
        </div>
      </div>
    </div>
  );
}
