import { useState, useEffect, useRef } from 'react';
import { api } from '../api/index.js';
import { formatBRL, formatMinutes, anestesiaBadgeClass, minutesToHHMM } from '../utils/format.js';

export default function Calculo() {
  const [procedimentos, setProcedimentos] = useState([]);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState(null);
  const [inicio, setInicio] = useState('');
  const [termino, setTermino] = useState('');
  const [dataProcedimento, setDataProcedimento] = useState(new Date().toISOString().split('T')[0]);
  const [observacoes, setObservacoes] = useState('');
  const [preview, setPreview] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    api.getProcedimentos().then((r) => setProcedimentos(r.data)).catch(() => {});
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handler = (e) => { if (!dropdownRef.current?.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = procedimentos.filter((p) =>
    !search || p.nome.toLowerCase().includes(search.toLowerCase()) || p.cid.toLowerCase().includes(search.toLowerCase())
  );

  const selectProcedimento = (p) => {
    setSelected(p);
    setSearch(p.nome);
    setShowDropdown(false);
    setPreview(null);
    setSaved(false);
    setError('');
  };

  const handleCalcular = async () => {
    setError('');
    setSaved(false);
    if (!selected) { setError('Selecione um procedimento.'); return; }
    if (!inicio || !termino) { setError('Informe os horários de início e término.'); return; }
    if (inicio === termino) { setError('Horário de início e término não podem ser iguais.'); return; }
    setCalculating(true);
    try {
      const r = await api.previewCalculo({
        procedimento_id: selected.id,
        horario_inicio: inicio,
        horario_termino: termino,
      });
      setPreview(r.data);
    } catch (err) {
      setError(err.message || 'Erro ao calcular');
    } finally {
      setCalculating(false);
    }
  };

  const handleSalvar = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      await api.saveCalculo({
        procedimento_id: selected.id,
        horario_inicio: inicio,
        horario_termino: termino,
        data_procedimento: dataProcedimento,
        observacoes: observacoes || null,
      });
      setSaved(true);
    } catch (err) {
      setError(err.message || 'Erro ao salvar cálculo');
    } finally {
      setSaving(false);
    }
  };

  const handleLimpar = () => {
    setSelected(null);
    setSearch('');
    setInicio('');
    setTermino('');
    setPreview(null);
    setError('');
    setSaved(false);
    setObservacoes('');
    setDataProcedimento(new Date().toISOString().split('T')[0]);
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">Cálculo de Honorários</h2>
          <p className="page-subtitle">Selecione o procedimento e informe os horários</p>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}
      {saved && <div className="alert alert-success">✓ Cálculo salvo no histórico com sucesso!</div>}

      <div className="card">
        <div className="card-body">

          {/* Busca de procedimento */}
          <div className="form-group" ref={dropdownRef} style={{ position: 'relative' }}>
            <label className="form-label">Procedimento *</label>
            <div className="search-input-wrap">
              <span className="search-icon">🔬</span>
              <input
                className="form-control"
                placeholder="Digite para buscar procedimento ou CID..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); setSelected(null); setPreview(null); setSaved(false); }}
                onFocus={() => setShowDropdown(true)}
              />
            </div>
            {showDropdown && filtered.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: '#fff', border: '1.5px solid var(--cinza-200)',
                borderRadius: 10, boxShadow: 'var(--shadow-lg)', zIndex: 100,
                maxHeight: 260, overflowY: 'auto', marginTop: 4,
              }}>
                {filtered.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => selectProcedimento(p)}
                    style={{
                      padding: '11px 16px', cursor: 'pointer',
                      borderBottom: '1px solid var(--cinza-100)',
                      transition: 'background 0.12s',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--azul-claro)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--cinza-800)' }}>{p.nome}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--cinza-400)', marginTop: 1 }}>
                        CID: {p.cid} · {p.tipo_anestesia} · Base: {minutesToHHMM(p.hora_base_minutos)}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--verde-medico)' }}>
                      {formatBRL(p.valor_base)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info do procedimento selecionado */}
          {selected && (
            <div style={{
              background: 'var(--azul-claro)', borderRadius: 8, padding: '12px 16px',
              marginBottom: 18, border: '1px solid var(--azul-borda)',
              display: 'flex', flexWrap: 'wrap', gap: 16,
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--azul-profundo)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>CID</div>
                <div style={{ fontWeight: 600, color: 'var(--azul-profundo)' }}>{selected.cid}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--azul-profundo)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Anestesia</div>
                <div style={{ fontWeight: 600, color: 'var(--azul-profundo)' }}>{selected.tipo_anestesia}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--azul-profundo)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hora Base</div>
                <div style={{ fontWeight: 600, color: 'var(--azul-profundo)' }}>{minutesToHHMM(selected.hora_base_minutos)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--azul-profundo)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor Base</div>
                <div style={{ fontWeight: 600, color: 'var(--azul-profundo)' }}>{formatBRL(selected.valor_base)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--azul-profundo)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor/h Exc.</div>
                <div style={{ fontWeight: 600, color: 'var(--azul-profundo)' }}>{formatBRL(selected.valor_hora_excedente)}/h</div>
              </div>
            </div>
          )}

          {/* Horários */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Horário de Início *</label>
              <input type="time" className="form-control" value={inicio} onChange={(e) => { setInicio(e.target.value); setPreview(null); setSaved(false); }} />
            </div>
            <div className="form-group">
              <label className="form-label">Horário de Término *</label>
              <input type="time" className="form-control" value={termino} onChange={(e) => { setTermino(e.target.value); setPreview(null); setSaved(false); }} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Data do Procedimento</label>
              <input type="date" className="form-control" value={dataProcedimento} onChange={(e) => setDataProcedimento(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Observações</label>
              <input type="text" className="form-control" placeholder="Opcional..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
            </div>
          </div>

          {/* Botões */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn btn-primary btn-lg" onClick={handleCalcular} disabled={calculating} style={{ flex: 1 }}>
              {calculating ? <><span className="spinner" /> Calculando...</> : '⊕ Calcular'}
            </button>
            <button className="btn btn-ghost" onClick={handleLimpar}>Limpar</button>
          </div>
        </div>
      </div>

      {/* Resultado */}
      {preview && (
        <div className="calculo-result" style={{ animation: 'slideUp 0.25s cubic-bezier(.4,0,.2,1)' }}>
          <div className="result-header">
            <div style={{
              width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0,
            }}>🏥</div>
            <div>
              <div className="result-proc-name">{preview.procedimento.nome}</div>
              <div className="result-cid">CID: {preview.procedimento.cid} · {preview.procedimento.tipo_anestesia}</div>
            </div>
          </div>

          <div className="result-row">
            <span className="result-label">⏱ Horário</span>
            <span className="result-value">{preview.horario_inicio} → {preview.horario_termino}</span>
          </div>
          <div className="result-row">
            <span className="result-label">⏳ Duração total</span>
            <span className="result-value">{formatMinutes(preview.duracao_total_minutos)}</span>
          </div>
          <div className="result-row">
            <span className="result-label">✔ Hora base inclusa</span>
            <span className="result-value">{formatMinutes(preview.procedimento.hora_base_minutos)}</span>
          </div>

          {preview.tempo_excedente_minutos > 0 ? (
            <div className="result-excedente">
              <div className="result-row" style={{ padding: 0, border: 'none' }}>
                <span className="result-label">⚠ Tempo excedente</span>
                <span className="result-value" style={{ color: '#FFD166' }}>{formatMinutes(preview.tempo_excedente_minutos)}</span>
              </div>
              <div className="result-row" style={{ padding: '6px 0 0', border: 'none' }}>
                <span className="result-label">Cálculo excedente</span>
                <span className="result-value" style={{ fontSize: '0.85rem', color: '#FFD166' }}>
                  {(preview.tempo_excedente_minutos / 60).toFixed(2).replace('.', ',')}h × {formatBRL(preview.procedimento.valor_hora_excedente)} = {formatBRL(preview.valor_excedente)}
                </span>
              </div>
            </div>
          ) : (
            <div className="result-row">
              <span className="result-label">✔ Sem excedente</span>
              <span className="result-value" style={{ color: '#6EE7B7' }}>Dentro da hora base</span>
            </div>
          )}

          <div className="result-row">
            <span className="result-label">Valor base</span>
            <span className="result-value">{formatBRL(preview.valor_base)}</span>
          </div>

          <div className="result-total">
            <span className="result-total-label">💰 Total a receber</span>
            <span className="result-total-value">{formatBRL(preview.valor_total)}</span>
          </div>

          {!saved && (
            <button
              className="btn btn-success"
              style={{ marginTop: 20, width: '100%', justifyContent: 'center', fontSize: '0.95rem', padding: '13px' }}
              onClick={handleSalvar}
              disabled={saving}
            >
              {saving ? <><span className="spinner" /> Salvando...</> : '💾 Salvar no histórico'}
            </button>
          )}
          {saved && (
            <div style={{ marginTop: 16, textAlign: 'center', fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)' }}>
              ✓ Salvo no histórico
            </div>
          )}
        </div>
      )}
    </div>
  );
}
