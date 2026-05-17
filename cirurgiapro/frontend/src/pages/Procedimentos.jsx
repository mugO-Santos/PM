import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/index.js';
import { formatBRL, minutesToHHMM, hhmmToMinutes, tiposAnestesia, anestesiaBadgeClass } from '../utils/format.js';

const emptyForm = {
  nome: '', cid: '', valor_base: '', hora_base: '08:00',
  valor_hora_excedente: '', tipo_anestesia: 'Geral', observacoes: '',
};

export default function Procedimentos() {
  const [procedimentos, setProcedimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback((q) => {
    setLoading(true);
    api.getProcedimentos(q)
      .then((r) => setProcedimentos(r.data))
      .catch(() => setError('Erro ao carregar procedimentos'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => load(search), 350);
    return () => clearTimeout(t);
  }, [search, load]);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditItem(p);
    setForm({
      nome: p.nome,
      cid: p.cid,
      valor_base: p.valor_base,
      hora_base: minutesToHHMM(p.hora_base_minutos),
      valor_hora_excedente: p.valor_hora_excedente,
      tipo_anestesia: p.tipo_anestesia,
      observacoes: p.observacoes || '',
    });
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditItem(null); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    setError('');
    if (!form.nome || !form.cid || !form.valor_base || !form.hora_base || !form.valor_hora_excedente) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        cid: form.cid.trim(),
        valor_base: parseFloat(form.valor_base),
        hora_base_minutos: hhmmToMinutes(form.hora_base),
        valor_hora_excedente: parseFloat(form.valor_hora_excedente),
        tipo_anestesia: form.tipo_anestesia,
        observacoes: form.observacoes || null,
      };
      if (editItem) {
        await api.updateProcedimento(editItem.id, payload);
        setSuccess('Procedimento atualizado com sucesso!');
      } else {
        await api.createProcedimento(payload);
        setSuccess('Procedimento cadastrado com sucesso!');
      }
      closeModal();
      load(search);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Erro ao salvar procedimento');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteProcedimento(id);
      setProcedimentos((p) => p.filter((x) => x.id !== id));
      setDeleteConfirm(null);
      setSuccess('Procedimento excluído.');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError('Erro ao excluir procedimento');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Procedimentos Cirúrgicos</h2>
          <p className="page-subtitle">{procedimentos.length} procedimento(s) cadastrado(s)</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          ＋ Novo Procedimento
        </button>
      </div>

      {success && <div className="alert alert-success">✓ {success}</div>}
      {error && !modalOpen && <div className="alert alert-error">⚠ {error}</div>}

      {/* Search */}
      <div className="search-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="form-control"
            placeholder="Buscar por nome ou CID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        {loading ? (
          <div className="loading-page">
            <div className="spinner" style={{ borderTopColor: 'var(--azul-principal)', borderColor: 'var(--cinza-200)' }} />
          </div>
        ) : procedimentos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔬</div>
            <div className="empty-state-title">{search ? 'Nenhum resultado' : 'Nenhum procedimento cadastrado'}</div>
            <div className="empty-state-text">{search ? 'Tente outro termo de busca' : 'Clique em "Novo Procedimento" para começar'}</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Procedimento</th>
                <th>CID</th>
                <th>Anestesia</th>
                <th>Hora Base</th>
                <th>Valor Base</th>
                <th>Valor/h Exc.</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {procedimentos.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--cinza-900)' }}>{p.nome}</div>
                    {p.observacoes && <div style={{ fontSize: '0.75rem', color: 'var(--cinza-400)' }}>{p.observacoes}</div>}
                  </td>
                  <td><span className="badge badge-cinza">{p.cid}</span></td>
                  <td><span className={`badge ${anestesiaBadgeClass(p.tipo_anestesia)}`}>{p.tipo_anestesia}</span></td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{minutesToHHMM(p.hora_base_minutos)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--verde-medico)' }}>{formatBRL(p.valor_base)}</td>
                  <td style={{ color: 'var(--cinza-600)' }}>{formatBRL(p.valor_hora_excedente)}/h</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>✏ Editar</button>
                      <button className="btn btn-sm" style={{ background: 'var(--vermelho-claro)', color: 'var(--vermelho)' }} onClick={() => setDeleteConfirm(p)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal cadastro/edição */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editItem ? 'Editar Procedimento' : 'Novo Procedimento'}</span>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">⚠ {error}</div>}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nome do Procedimento *</label>
                  <input name="nome" className="form-control" placeholder="Ex: Mastopexia" value={form.nome} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">CID *</label>
                  <input name="cid" className="form-control" placeholder="Ex: N64.8" value={form.cid} onChange={handleChange} style={{ textTransform: 'uppercase' }} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Valor Base (R$) *</label>
                  <input name="valor_base" type="number" min="0" step="0.01" className="form-control" placeholder="0,00" value={form.valor_base} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora Base (HH:MM) *</label>
                  <input name="hora_base" type="time" className="form-control" value={form.hora_base} onChange={handleChange} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Valor Hora Excedente (R$/h) *</label>
                  <input name="valor_hora_excedente" type="number" min="0" step="0.01" className="form-control" placeholder="0,00" value={form.valor_hora_excedente} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo de Anestesia *</label>
                  <select name="tipo_anestesia" className="form-control" value={form.tipo_anestesia} onChange={handleChange}>
                    {tiposAnestesia.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Observações</label>
                <textarea name="observacoes" className="form-control" rows={2} placeholder="Opcional..." value={form.observacoes} onChange={handleChange} style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner" />Salvando...</> : (editItem ? '✓ Salvar alterações' : '＋ Cadastrar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmação exclusão */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <span className="modal-title">Confirmar exclusão</span>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.92rem', color: 'var(--cinza-600)' }}>
                Deseja excluir o procedimento <strong>{deleteConfirm.nome}</strong>? Esta ação também removerá todos os cálculos vinculados e não poderá ser desfeita.
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
