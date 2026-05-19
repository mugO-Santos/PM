// Botão fixo de resetar app (voltar ao questionário inicial)
const resetAppBtn = document.getElementById('reset-app-btn');
function showResetAppBtn(show) {
  if (resetAppBtn) resetAppBtn.style.display = show ? 'block' : 'none';
}
if (resetAppBtn) {
  resetAppBtn.addEventListener('click', () => {
    if (confirm('Deseja realmente resetar o app e responder o questionário novamente? Todo o progresso será apagado.')) {
      localStorage.clear();
      location.reload();
    }
  });
}
// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    let refreshing = false;
    let updateToast = null;

    function forceActivateWaitingSW(registration) {
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    }

    function hideUpdateToast() {
      if (!updateToast) return;
      updateToast.classList.remove('show');
      setTimeout(() => {
        if (updateToast && updateToast.parentNode) {
          updateToast.parentNode.removeChild(updateToast);
        }
        updateToast = null;
      }, 180);
    }

    function showUpdateToast(registration) {
      if (updateToast) return;

      updateToast = document.createElement('div');
      updateToast.className = 'update-toast show';
      updateToast.innerHTML = `
        <div class="update-toast-content">
          <div class="update-toast-title">Nova versão disponível</div>
          <div class="update-toast-text">Toque em Atualizar para aplicar melhorias visuais.</div>
          <div class="update-toast-actions">
            <button type="button" class="update-toast-btn ghost" data-action="dismiss">Agora não</button>
            <button type="button" class="update-toast-btn" data-action="update">Atualizar</button>
          </div>
        </div>
      `;

      updateToast.addEventListener('click', (event) => {
        const action = event.target && event.target.dataset ? event.target.dataset.action : null;
        if (action === 'dismiss') {
          hideUpdateToast();
        }
        if (action === 'update') {
          forceActivateWaitingSW(registration);
          hideUpdateToast();
        }
      });

      document.body.appendChild(updateToast);
    }

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('Service Worker registrado com sucesso:', reg);

        // Verifica atualização ao abrir o app
        reg.update();

        // Em instalações já existentes, mostra aviso para o usuario atualizar
        if (reg.waiting) {
          showUpdateToast(reg);
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateToast(reg);
            }
          });
        });

        // Revalida versão periodicamente para reduzir desatualização no celular
        setInterval(() => {
          reg.update();
        }, 60 * 60 * 1000);
      })
      .catch(err => console.error('Erro ao registrar Service Worker:', err));
  });
}
// Documentos opcionais - abrir/fechar modal
const showOptionalBtn = document.getElementById('show-optional-btn');
const optionalModal = document.getElementById('optional-modal');
const optionalClose = document.getElementById('optional-close');
if (showOptionalBtn && optionalModal && optionalClose) {
  showOptionalBtn.addEventListener('click', () => {
    optionalModal.style.display = 'flex';
  });
  optionalClose.addEventListener('click', () => {
    optionalModal.style.display = 'none';
  });
  optionalModal.addEventListener('click', (e) => {
    if (e.target === optionalModal) optionalModal.style.display = 'none';
  });
}
document.addEventListener('DOMContentLoaded', () => {
  updateOperationalStatus();
  initAppVersionBadge();
  initApp();
  setInterval(updateOperationalStatus, 60000);
});
function loadProfile() {
  const saved = localStorage.getItem(PROFILE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch {}
  }
  return null;
}

// Checklist de Documentos Premium Gamificado
// Usa dados de profileData.js
const STORAGE_KEY = 'checklist_docs_v3';
const PROFILE_KEY = 'checklist_profile_v1';

let optionalDocs = [];
let profile = null;
let state = [];

function updateOperationalStatus() {
  const statusTime = document.getElementById('last-update');
  if (!statusTime) return;
  statusTime.textContent = 'Atualizado: ' + new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function initAppVersionBadge() {
  const versionEl = document.getElementById('app-version');
  if (!versionEl) return;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      const cacheVersion = registration.active ? registration.active.scriptURL.split('?')[0] : 'unknown';
      const versionMatch = document.body.getAttribute('data-version') || 'v2026.05';
      versionEl.textContent = versionMatch;
    }).catch(() => {
      versionEl.textContent = 'v2026.05';
    });
  } else {
    versionEl.textContent = 'v2026.05';
  }
}

function saveProfile() {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function getInitialState(profile) {
  // Filtra documentos conforme perfil
  return DOCS.filter(doc => !doc.cond || doc.cond(profile)).map(doc => ({
    ...doc,
    done: false,
    obs: '',
    progressing: false,
    prazo: '',
    urgente: false,
    concluidoEm: null
  }));
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    // Retorna [obrigatórios, opcionais]
    function splitDocsByProfile(profile) {
      const obrig = [], opc = [];
      DOCS.forEach(doc => {
        if (doc.cond && doc.cond(profile)) obrig.push(doc);
        else if (doc.cond) opc.push(doc);
        else obrig.push(doc); // docs sem cond são sempre obrigatórios
      });
      return [obrig, opc];
    }

    try { return JSON.parse(saved); } catch {}
  }
  return null;
}

// Perguntas condicionais
function renderProfileQuestions() {
  const section = document.getElementById('profile-questions-section');
  const list = document.getElementById('profile-questions-list');
  list.innerHTML = '';
  PROFILE_QUESTIONS.forEach(q => {
    const div = document.createElement('div');
    div.className = 'profile-question';
    const label = document.createElement('label');
    label.textContent = q.question;
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = q.key;
    input.id = 'profile-' + q.key;
    div.appendChild(label);
    div.appendChild(input);
    list.appendChild(div);
  });
  section.style.display = 'block';
  document.getElementById('main-app').style.display = 'none';
}

function handleProfileSubmit(e) {
  e.preventDefault();
  profile = {};
  PROFILE_QUESTIONS.forEach(q => {
    profile[q.key] = document.getElementById('profile-' + q.key).checked;
  });
  saveProfile();
  state = getInitialState(profile);
  saveState();
  document.getElementById('profile-questions-section').style.display = 'none';
  document.getElementById('main-app').style.display = 'block';
  renderAll();
}

// Inicialização condicional
function initApp() {
  updateOperationalStatus();
  profile = loadProfile();
  if (!profile) {
    renderProfileQuestions();
    document.getElementById('profile-questions-form').onsubmit = handleProfileSubmit;
    showResetAppBtn(false);
    return;
  }
  state = loadState();
  if (!state) {
    state = getInitialState(profile);
    saveState();
  }
  document.getElementById('profile-questions-section').style.display = 'none';
  document.getElementById('main-app').style.display = 'block';
  showResetAppBtn(true);
  renderAll();
}

function getProgress() {
  const total = state.length;
  const done = state.filter(d => d.done).length;
  const percent = Math.round((done / total) * 100);
  return { total, done, percent };
}

function motivationalMessage(percent) {
  if (percent === 100) return 'Operacao concluida com sucesso!';
  if (percent >= 90) return 'Operacao quase finalizada!';
  if (percent >= 70) return 'Falta pouco para finalizar!';
  if (percent >= 40) return 'Você já concluiu ' + percent + '%! Continue!';
  if (percent > 0) return 'Ótimo começo! Siga em frente!';
  return 'Inicie sua operacao!';
}

function renderDashboard() {
  const dashTotal = document.getElementById('dash-total');
  const dashPending = document.getElementById('dash-pending');
  const dashDone = document.getElementById('dash-done');
  const dashNextList = document.getElementById('dash-next-list');
  const { total, done } = getProgress();
  dashTotal.textContent = total;
  dashDone.textContent = done;
  dashPending.textContent = total - done;
  // Próximos importantes: pendentes de prioridade alta/média
  dashNextList.innerHTML = '';
  state.forEach((doc, idx) => {
    if (!doc.done && (DOCS[idx].priority === 'alta' || DOCS[idx].priority === 'media')) {
      const li = document.createElement('li');
      li.textContent = doc.title;
      dashNextList.appendChild(li);
    }
  });

  document.querySelectorAll('.dashboard-card').forEach((card, index) => {
    card.classList.remove('stagger-in');
    card.style.animationDelay = `${index * 70}ms`;
    card.classList.add('stagger-in');
  });
}

function renderProgressBar() {
  const { total, done, percent } = getProgress();
  document.getElementById('progress-count').textContent = `${done} de ${total} documentos concluídos`;
  document.getElementById('progress-percent').textContent = percent + '%';
  const bar = document.getElementById('progress-bar');
  bar.style.width = percent + '%';
}

function renderMotivation() {
  const { percent } = getProgress();
  document.getElementById('motivational-message').textContent = motivationalMessage(percent);
}

function renderLists() {
  const pendingList = document.getElementById('pending-list');
  const progressingList = document.getElementById('progressing-list');
  const completedList = document.getElementById('completed-list');
  pendingList.innerHTML = '';
  progressingList.innerHTML = '';
  completedList.innerHTML = '';

  state.forEach((doc, idx) => {
    const docData = DOCS[idx];
    const li = document.createElement('li');
    li.classList.add('stagger-in');
    li.style.animationDelay = `${(idx % 10) * 45}ms`;
    // Prioridade visual
    if (docData.priority === 'alta') li.classList.add('priority-high');
    else if (docData.priority === 'media') li.classList.add('priority-medium');
    else li.classList.add('priority-low');
    if (doc.done) li.classList.add('completed');
    if (doc.progressing && !doc.done) li.classList.add('progressing');

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'checkbox';
    checkbox.checked = !!doc.done;
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        li.classList.add('conquered');
        setTimeout(() => li.classList.remove('conquered'), 700);
      }
      state[idx].done = checkbox.checked;
      if (checkbox.checked) state[idx].progressing = false;
      saveState();
      renderAll();
      // Troféu ao concluir tudo
      if (getProgress().percent === 100) showTrophy();
    });

    // Info
    const infoDiv = document.createElement('div');
    infoDiv.className = 'doc-info';
    const title = document.createElement('div');
    title.className = 'doc-title';
    title.textContent = doc.title;
    // Prioridade badge
    const badge = document.createElement('span');
    badge.className = 'priority-badge';
    if (docData.priority === 'alta') {
      badge.classList.add('priority-badge-high');
      badge.textContent = 'A! Alta';
    } else if (docData.priority === 'media') {
      badge.classList.add('priority-badge-medium');
      badge.textContent = 'M* Media';
    } else {
      badge.classList.add('priority-badge-low');
      badge.textContent = 'B- Baixa';
    }
    title.appendChild(badge);
    infoDiv.appendChild(title);

    // Botão info/modal
    const infoBtn = document.createElement('button');
    infoBtn.className = 'info-btn';
    infoBtn.title = 'Ver detalhes';
    infoBtn.innerHTML = 'ℹ️';
    infoBtn.addEventListener('click', () => showModal(doc.title, docData.details));
    infoDiv.appendChild(infoBtn);

    // Observação
    const obsInput = document.createElement('textarea');
    obsInput.className = 'obs-input';
    obsInput.placeholder = 'Adicionar observação...';
    obsInput.value = doc.obs || '';
    obsInput.addEventListener('input', () => {
      state[idx].obs = obsInput.value;
      saveState();
    });
    infoDiv.appendChild(obsInput);

    // Botão "Em andamento"
    if (!doc.done) {
      const progBtn = document.createElement('button');
      progBtn.className = 'info-btn';
      progBtn.title = 'Marcar como em andamento';
      progBtn.innerHTML = '⏳';
      progBtn.style.fontSize = '1.1em';
      progBtn.addEventListener('click', () => {
        state[idx].progressing = !state[idx].progressing;
        saveState();
        renderAll();
      });
      infoDiv.appendChild(progBtn);
    }

    li.appendChild(checkbox);
    li.appendChild(infoDiv);

    if (doc.done) completedList.appendChild(li);
    else if (doc.progressing) progressingList.appendChild(li);
    else pendingList.appendChild(li);
  });

  addEmptyStateIfNeeded(pendingList, 'Sem pendencias no momento.');
  addEmptyStateIfNeeded(progressingList, 'Nenhum documento em andamento.');
  addEmptyStateIfNeeded(completedList, 'Ainda nao ha documentos concluidos.');
}

function addEmptyStateIfNeeded(listElement, message) {
  if (listElement.children.length > 0) return;
  const li = document.createElement('li');
  li.className = 'empty-state';
  li.textContent = message;
  listElement.appendChild(li);
}

function renderAll() {
  updateOperationalStatus();
  renderDashboard();
  renderProgressBar();
  renderMotivation();
  renderLists();
}

// Modal de detalhes
// Integração progressiva: Modal busca dados em DOCUMENTOS_DETALHADOS
function showModal(doc, docData) {
  // Busca documento detalhado pelo id/key
  let docDetalhado = undefined;
  if (typeof DOCUMENTOS_DETALHADOS !== 'undefined') {
    docDetalhado = DOCUMENTOS_DETALHADOS.find(d => d.id === doc.key);
  }

  // Fallback seguro: se não encontrar, usa dados antigos
  const nome = docDetalhado?.nome || doc.title || 'Documento';
  const descricao = docDetalhado?.descricao || docData.details || '';
  const observacoes = docDetalhado?.observacoes || [];
  const exigencias = docDetalhado?.exigencias || [];
  const condicao = docDetalhado?.condicao || '';
  const ondeEmitir = docDetalhado?.ondeEmitir || docData.ondeEmitir || '-';
  const linkOficial = docDetalhado?.linkOficial || '';
  const prioridade = docDetalhado?.prioridade || docData.priority || '-';
  const condicaoEspecial = docDetalhado?.condicaoEspecial || false;
  const copiaRepro = docDetalhado?.copiaRepro || false;

  // Visual premium e organizado
  let html = `<div class="modal-doc-header">
    <span class="modal-doc-title">${nome}</span>
    <span class="modal-doc-priority priority-${prioridade}">${prioridade.charAt(0).toUpperCase() + prioridade.slice(1)}</span>
    ${condicaoEspecial ? '<span class="modal-doc-alert" title="Condição especial">⚠️</span>' : ''}
  </div>`;
  html += `<div class="modal-doc-descricao">${descricao}</div>`;
  if (exigencias.length > 0) {
    html += `<div class="modal-doc-exigencias"><b>Exigências:</b><ul>`;
    exigencias.forEach(ex => {
      html += `<li>🔹 ${ex}</li>`;
    });
    html += `</ul></div>`;
  }
  if (observacoes.length > 0) {
    html += `<div class="modal-doc-observacoes"><b>Observações obrigatórias:</b><ul>`;
    observacoes.forEach(obs => {
      html += `<li>⚠️ ${obs}</li>`;
    });
    html += `</ul></div>`;
  }
  if (condicao) {
    html += `<div class="modal-doc-condicao"><b>Quando se aplica:</b> ${condicao}</div>`;
  }
  if (copiaRepro) {
    html += `<div class="modal-doc-copia"><b>⚠️ Exige cópia reprográfica</b></div>`;
  }
  html += `<div class="modal-doc-onde"><b>Onde emitir:</b> ${ondeEmitir}</div>`;
  if (linkOficial) {
    html += `<div class="modal-doc-link"><a href="${linkOficial}" target="_blank" class="official-link-btn">🌐 Acessar site oficial</a></div>`;
  }
  // Alertas condicionais
  if (condicaoEspecial) {
    html += `<div class="modal-doc-alerta">⚠️ Documento com regra especial. Leia atentamente as exigências.</div>`;
  }
  // Observação do usuário
  if (doc.obs) html += `<div class="modal-doc-userobs"><b>Sua observação:</b> ${doc.obs}</div>`;
  if (doc.prazo) html += `<div class="modal-doc-prazo"><b>Prazo:</b> ${doc.prazo}</div>`;
  if (doc.urgente) html += `<div class="modal-doc-urgente" style="color:var(--danger);"><b>URGENTE</b></div>`;
  if (doc.concluidoEm) html += `<div class='concluido-em'><b>Concluído em:</b> ${doc.concluidoEm}</div>`;

  document.getElementById('modal-title').textContent = nome;
  document.getElementById('modal-details').innerHTML = html;
  document.getElementById('modal-bg').style.display = 'flex';
}
document.getElementById('modal-close').onclick = () => {
  document.getElementById('modal-bg').style.display = 'none';
};
document.getElementById('modal-bg').onclick = (e) => {
  if (e.target.id === 'modal-bg') document.getElementById('modal-bg').style.display = 'none';
};

// Troféu gamificado
// Sistema de níveis gamificados
function renderLevel() {
  const { percent } = getProgress();
  const level = getLevel(percent);
  const badge = document.getElementById('level-badge');
  badge.innerHTML = `<span class='level-icon'>${level.icon}</span> <span style='color:${level.color}'>${level.name}</span> <span style='font-size:0.95em;color:var(--muted);'>${percent}%</span>`;
}

// Tela final especial
function showMissionComplete() {
  const mission = document.getElementById('mission-complete');
  const summary = document.getElementById('mission-summary');
  const total = state.length;
  const concluido = state.filter(i=>i.done).length;
  const data = new Date().toLocaleString();
  let html = `<div style='margin-bottom:0.7em;'>Você concluiu <b>${concluido} de ${total}</b> documentos!</div>`;
  html += `<div>Data de finalização: <b>${data}</b></div>`;
  summary.innerHTML = html;
  mission.style.display = 'flex';
  setTimeout(() => { mission.style.display = 'none'; }, 6000);
}

// Reset inteligente
const resetBtn = document.getElementById('reset-btn');
resetBtn.addEventListener('click', () => {
  if (confirm('Tem certeza que deseja resetar o checklist?')) {
    state = getInitialState(profile);
    saveState();
    renderAll();
  }
});

// Exportação PDF
const exportBtn = document.getElementById('export-pdf-btn');
exportBtn.addEventListener('click', () => {
  exportChecklistPDF(state, profile);
});

// Animação lembrete
const style = document.createElement('style');
style.innerHTML = `
@keyframes pulse {
  0% { color: var(--accent); }
  50% { color: var(--danger); }
  100% { color: var(--accent); }
}`;
document.head.appendChild(style);

// Inicializar
renderAll();
