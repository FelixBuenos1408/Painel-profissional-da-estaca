/**
 * ==============================================================================
 * GUIA PROFISSIONAL DA ESTACA - COMPONENTES DE INTERFACE (UI)
 * ==============================================================================
 * Renderização modular de componentes visuais, formatações e notificações toast.
 * ==============================================================================
 */

/**
 * Mapeia o nome formal da Ala para a classe CSS correspondente.
 * @param {string} ala 
 * @returns {string}
 */
export function obterClasseCssAla(ala) {
  const mapa = {
    'Ala Jatobá': 'ala-jatoba',
    'Ala Lisboa 1': 'ala-lisboa-1',
    'Ala Lisboa 2': 'ala-lisboa-2',
    'Ala Nova Conquista': 'ala-nova-conquista',
    'Ala Novo Araturi': 'ala-novo-araturi'
  };
  return mapa[ala] || 'ala-jatoba';
}

/**
 * Obtém até duas iniciais em maiúsculo a partir do nome completo.
 * @param {string} nome 
 * @returns {string}
 */
export function obterIniciais(nome) {
  if (!nome) return 'PR';
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/**
 * Formata um número de telefone com máscara brasileira (XX) XXXXX-XXXX.
 * @param {string} telefone 
 * @returns {string}
 */
export function formatarTelefone(telefone) {
  if (!telefone) return '';
  const digitos = telefone.replace(/\D/g, '');

  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }
  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return telefone;
}

/**
 * Gera o link direto para início de conversa no WhatsApp.
 * @param {string} telefone 
 * @param {string} nome 
 * @returns {string}
 */
export function gerarLinkWhatsApp(telefone, nome) {
  const digitos = (telefone || '').replace(/\D/g, '');
  const mensagem = encodeURIComponent(`Olá ${nome}! Encontrei seu contato no Guia Profissional da Estaca.`);
  return `https://wa.me/55${digitos}?text=${mensagem}`;
}

/**
 * Aplica máscara de telefone dinâmica em tempo real em um elemento <input>.
 * @param {HTMLInputElement} input 
 */
export function aplicarMascaraTelefone(input) {
  input.addEventListener('input', (e) => {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length > 11) valor = valor.slice(0, 11);

    if (valor.length > 10) {
      e.target.value = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7)}`;
    } else if (valor.length > 6) {
      e.target.value = `(${valor.slice(0, 2)}) ${valor.slice(2, 6)}-${valor.slice(6)}`;
    } else if (valor.length > 2) {
      e.target.value = `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
    } else if (valor.length > 0) {
      e.target.value = `(${valor}`;
    } else {
      e.target.value = '';
    }
  });
}

/**
 * Renderiza a lista de cards de profissionais no container informado.
 * @param {HTMLElement} container - Elemento container da grid
 * @param {Array} listaProfissionais - Lista de registros
 * @param {object|null} perfilAdmin - Perfil do administrador logado (se houver)
/**
 * Abre o visualizador de imagem ampliada (Lightbox).
 * @param {string} fotoUrl 
 * @param {string} nome 
 */
export function abrirVisualizadorFoto(fotoUrl, nome) {
  if (!fotoUrl) return;
  const imgEl = document.getElementById('photoViewerImg');
  const captionEl = document.getElementById('photoViewerCaption');
  const modal = document.getElementById('modalPhotoViewer');

  if (imgEl) imgEl.src = fotoUrl;
  if (captionEl) captionEl.textContent = nome || 'Foto do Profissional';
  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Renderiza e preenche o modal de perfil detalhado do profissional.
 * @param {object} pro - Dados do profissional
 * @param {object|null} perfilAdmin - Perfil do administrador autenticado
 * @param {Function} onEditarClick - Callback de edição
 * @param {Function} onExcluirClick - Callback de exclusão
 * @param {Function} onFotoClick - Callback ao clicar na foto
 */
export function renderizarModalPerfil(pro, perfilAdmin, onEditarClick, onExcluirClick, onFotoClick) {
  if (!pro) return;

  const avatarContainer = document.getElementById('profileModalAvatar');
  const nameEl = document.getElementById('profileModalName');
  const roleEl = document.getElementById('profileModalRole');
  const wardBadgeEl = document.getElementById('profileModalWardBadge');
  const bioEl = document.getElementById('profileModalBio');
  const phoneEl = document.getElementById('profileModalPhone');
  const whatsAppBtn = document.getElementById('profileModalWhatsAppBtn');
  const editBtn = document.getElementById('btnProfileModalEdit');

  const classeAla = obterClasseCssAla(pro.ala);
  const iniciais = obterIniciais(pro.nome);
  const telefoneFormatado = formatarTelefone(pro.telefone);
  const linkWhatsApp = gerarLinkWhatsApp(pro.telefone, pro.nome);
  const podeGerenciar = perfilAdmin && (perfilAdmin.e_super_admin || perfilAdmin.ala === pro.ala);

  // Avatar com zoom se houver foto
  if (avatarContainer) {
    if (pro.foto_url) {
      avatarContainer.className = 'profile-avatar-wrapper clickable-photo';
      avatarContainer.innerHTML = `<img src="${escapeHtml(pro.foto_url)}" alt="${escapeHtml(pro.nome)}" />`;
      avatarContainer.onclick = () => {
        if (onFotoClick) onFotoClick(pro.foto_url, pro.nome);
      };
    } else {
      avatarContainer.className = 'profile-avatar-wrapper';
      avatarContainer.innerHTML = `<span>${iniciais}</span>`;
      avatarContainer.onclick = null;
    }
  }

  if (nameEl) nameEl.textContent = pro.nome;
  if (roleEl) roleEl.textContent = pro.profissao;
  if (wardBadgeEl) {
    wardBadgeEl.innerHTML = `<div class="ward-badge ${classeAla}">${escapeHtml(pro.ala)}</div>`;
  }

  if (bioEl) {
    if (pro.descricao && pro.descricao.trim().length > 0) {
      bioEl.textContent = pro.descricao;
      bioEl.style.fontStyle = 'normal';
      bioEl.style.color = 'var(--text-main)';
    } else {
      bioEl.textContent = 'Nenhuma descrição detalhada informada para este profissional.';
      bioEl.style.fontStyle = 'italic';
      bioEl.style.color = 'var(--text-muted)';
    }
  }

  if (phoneEl) phoneEl.textContent = telefoneFormatado;
  if (whatsAppBtn) whatsAppBtn.href = linkWhatsApp;

  if (editBtn) {
    if (podeGerenciar) {
      editBtn.style.display = 'inline-flex';
      editBtn.onclick = () => {
        const modalPerfil = document.getElementById('modalProfileView');
        if (modalPerfil) {
          modalPerfil.classList.remove('active');
          modalPerfil.setAttribute('aria-hidden', 'true');
        }
        if (onEditarClick) onEditarClick(pro);
      };
    } else {
      editBtn.style.display = 'none';
      editBtn.onclick = null;
    }
  }
}

/**
 * Renderiza a lista de cards de profissionais no container informado.
 * @param {HTMLElement} container - Elemento container da grid
 * @param {Array} listaProfissionais - Lista de registros
 * @param {object|null} perfilAdmin - Perfil do administrador logado (se houver)
 * @param {Function} onVerPerfil - Callback ao clicar para ver o perfil
 * @param {Function} onEditarClick - Callback ao clicar em editar
 * @param {Function} onExcluirClick - Callback ao clicar em excluir
 * @param {Function} onFotoClick - Callback ao clicar na foto
 */
export function renderizarCardsProfissionais(
  container, 
  listaProfissionais, 
  perfilAdmin, 
  onVerPerfil, 
  onEditarClick, 
  onExcluirClick,
  onFotoClick
) {
  container.innerHTML = '';

  if (!listaProfissionais || listaProfissionais.length === 0) {
    renderizarEstadoVazio(container, 'Nenhum profissional encontrado com os filtros selecionados.');
    return;
  }

  listaProfissionais.forEach((pro) => {
    const card = document.createElement('article');
    card.className = 'pro-card';
    card.setAttribute('data-id', pro.id);

    const classeAla = obterClasseCssAla(pro.ala);
    const iniciais = obterIniciais(pro.nome);
    const telefoneFormatado = formatarTelefone(pro.telefone);
    const linkWhatsApp = gerarLinkWhatsApp(pro.telefone, pro.nome);

    // Permissão de gerenciamento (Super Admin ou Administrador da mesma Ala)
    const podeGerenciar = perfilAdmin && (perfilAdmin.e_super_admin || perfilAdmin.ala === pro.ala);

    const temFoto = !!pro.foto_url;
    const avatarHtml = temFoto 
      ? `<div class="pro-avatar with-photo clickable-photo" title="Clique para ampliar a foto" aria-label="Ampliar foto">
           <img src="${escapeHtml(pro.foto_url)}" alt="${escapeHtml(pro.nome)}" class="pro-avatar-img" onerror="this.parentElement.classList.remove('with-photo','clickable-photo'); this.parentElement.innerHTML='${iniciais}';" />
         </div>`
      : `<div class="pro-avatar" aria-hidden="true">${iniciais}</div>`;

    const descricaoSnippet = pro.descricao 
      ? `<p class="pro-desc-snippet">${escapeHtml(pro.descricao)}</p>` 
      : '';

    card.innerHTML = `
      <div class="pro-card-content" title="Clique para ver o perfil completo de ${escapeHtml(pro.nome)}">
        <div class="pro-card-header">
          ${avatarHtml}
          <div class="pro-details">
            <h3 class="pro-name truncate">${escapeHtml(pro.nome)}</h3>
            <span class="pro-role truncate">${escapeHtml(pro.profissao)}</span>
          </div>
        </div>

        <div class="ward-badge ${classeAla}">
          ${escapeHtml(pro.ala)}
        </div>

        ${descricaoSnippet}
      </div>

      <div class="pro-card-footer">
        <a 
          href="${linkWhatsApp}" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="whatsapp-link"
          title="Conversar com ${escapeHtml(pro.nome)} no WhatsApp"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.28-2.42 5.84-1.56 1.56-3.64 2.42-5.84 2.42-1.42 0-2.82-.37-4.04-1.08l-.29-.17-3.11.82.83-3.03-.19-.3A8.196 8.196 0 0 1 3.8 11.91c0-4.54 3.7-8.24 8.25-8.24zm4.52 11.66c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07s.89 2.4 1.02 2.57c.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.3z"/>
          </svg>
          <span>WhatsApp</span>
        </a>

        ${podeGerenciar ? `
          <div class="card-actions-group">
            <button 
              type="button" 
              class="btn-card-action btn-edit-pro" 
              title="Editar informações do profissional"
              aria-label="Editar profissional"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>

            <button 
              type="button" 
              class="btn-card-action btn-delete-pro" 
              title="Excluir profissional"
              aria-label="Excluir profissional"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        ` : ''}
      </div>
    `;

    // Evento de clique no corpo do card para abrir perfil detalhado
    const cardContent = card.querySelector('.pro-card-content');
    if (cardContent && onVerPerfil) {
      cardContent.addEventListener('click', (e) => {
        // Se clicou diretamente no avatar com foto, não abre o perfil (abre o lightbox)
        if (e.target.closest('.pro-avatar.clickable-photo')) return;
        onVerPerfil(pro);
      });
    }

    // Evento de clique na foto para zoom (Lightbox)
    if (temFoto) {
      const avatarEl = card.querySelector('.pro-avatar.clickable-photo');
      if (avatarEl && onFotoClick) {
        avatarEl.addEventListener('click', (e) => {
          e.stopPropagation();
          onFotoClick(pro.foto_url, pro.nome);
        });
      }
    }

    // Eventos administrativos (Editar e Excluir)
    if (podeGerenciar) {
      const editBtn = card.querySelector('.btn-edit-pro');
      if (editBtn && onEditarClick) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          onEditarClick(pro);
        });
      }

      const deleteBtn = card.querySelector('.btn-delete-pro');
      if (deleteBtn && onExcluirClick) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          onExcluirClick(pro);
        });
      }
    }

    container.appendChild(card);
  });
}

/**
 * Renderiza skeletons animados enquanto os dados estão sendo carregados.
 * @param {HTMLElement} container 
 * @param {number} quantidade 
 */
export function renderizarSkeleton(container, quantidade = 6) {
  container.innerHTML = '';
  for (let i = 0; i < quantidade; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-card';
    skeleton.innerHTML = `
      <div class="skeleton-avatar"></div>
      <div class="skeleton-line" style="width: 80%;"></div>
      <div class="skeleton-line short"></div>
      <div class="skeleton-line medium" style="margin-top: 1rem;"></div>
      <div class="skeleton-line btn"></div>
    `;
    container.appendChild(skeleton);
  }
}

/**
 * Renderiza um estado visual agradável quando nenhum resultado é encontrado.
 * @param {HTMLElement} container 
 * @param {string} mensagem 
 */
export function renderizarEstadoVazio(container, mensagem) {
  container.innerHTML = `
    <div class="empty-state-box">
      <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
      </svg>
      <h4 class="empty-state-title">Nenhum profissional encontrado</h4>
      <p class="empty-state-desc">${escapeHtml(mensagem)}</p>
    </div>
  `;
}

/**
 * Exibe uma notificação toast temporária na interface.
 * @param {string} mensagem 
 * @param {'success'|'error'|'info'} tipo 
 * @param {number} duracao - Tempo em ms (padrão: 4000)
 */
export function mostrarToast(mensagem, tipo = 'info', duracao = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;

  let iconeSvg = '';
  if (tipo === 'success') {
    iconeSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
  } else if (tipo === 'error') {
    iconeSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
  } else {
    iconeSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  }

  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.65rem;">
      ${iconeSvg}
      <span class="toast-message">${escapeHtml(mensagem)}</span>
    </div>
    <button type="button" class="btn-icon" style="padding: 2px;" aria-label="Fechar notificação">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  const closeBtn = toast.querySelector('button');
  closeBtn.addEventListener('click', () => {
    toast.remove();
  });

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duracao);
}

/**
 * Escapa strings para inserção segura no HTML, prevenindo XSS.
 * @param {string} str 
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
