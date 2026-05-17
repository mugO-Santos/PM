const BASE_URL = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
}

export const api = {
  // Procedimentos
  getProcedimentos: (search) =>
    request(`/procedimentos${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getProcedimento: (id) => request(`/procedimentos/${id}`),
  createProcedimento: (body) => request('/procedimentos', { method: 'POST', body: JSON.stringify(body) }),
  updateProcedimento: (id, body) => request(`/procedimentos/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProcedimento: (id) => request(`/procedimentos/${id}`, { method: 'DELETE' }),

  // Cálculos
  previewCalculo: (body) => request('/calculos/preview', { method: 'POST', body: JSON.stringify(body) }),
  saveCalculo: (body) => request('/calculos', { method: 'POST', body: JSON.stringify(body) }),
  getCalculos: (limit = 50) => request(`/calculos?limit=${limit}`),
  getStats: () => request('/calculos/stats'),
  deleteCalculo: (id) => request(`/calculos/${id}`, { method: 'DELETE' }),
};
