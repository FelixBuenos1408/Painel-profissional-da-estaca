/**
 * ==============================================================================
 * GUIA PROFISSIONAL DA ESTACA - GERENCIADOR DE MODAIS
 * ==============================================================================
 * Controla abertura, fechamento e acessibilidade dos modais do sistema.
 * ==============================================================================
 */

/**
 * Abre um modal especificado pelo ID.
 * @param {string} modalId - ID do elemento modal
 */
export function abrirModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Foca no primeiro campo de input editável dentro do modal, se existir
  const primeiroInput = modal.querySelector('input:not([disabled]):not([readonly]), button.btn-primary');
  if (primeiroInput) {
    setTimeout(() => primeiroInput.focus(), 100);
  }
}

/**
 * Fecha um modal especificado pelo ID.
 * @param {string} modalId - ID do elemento modal
 */
export function fecharModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');

  // Restaura o scroll do corpo da página se não houver outros modais abertos
  const outrosModaisAbertos = document.querySelectorAll('.modal-overlay.active');
  if (outrosModaisAbertos.length === 0) {
    document.body.style.overflow = '';
  }
}

/**
 * Fecha todos os modais atualmente abertos.
 */
export function fecharTodosModais() {
  document.querySelectorAll('.modal-overlay.active').forEach(modal => {
    fecharModal(modal.id);
  });
}

/**
 * Inicializa os ouvintes de eventos para fechar modais ao clicar no botão de fechar,
 * no backdrop ou pressionar a tecla Escape.
 */
export function inicializarModais() {
  // Fechamento via botões com atributo [data-close-modal]
  document.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('[data-close-modal]');
    if (closeBtn) {
      const targetModalId = closeBtn.getAttribute('data-close-modal');
      fecharModal(targetModalId);
    }
  });

  // Fechamento ao clicar na área escura de fundo (backdrop)
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        fecharModal(modal.id);
      }
    });
  });

  // Fechamento via tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      fecharTodosModais();
    }
  });
}
