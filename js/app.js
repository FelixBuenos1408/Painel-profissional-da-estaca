/**
 * ==============================================================================
 * GUIA PROFISSIONAL DA ESTACA - ORQUESTRADOR PRINCIPAL (APP.JS)
 * ==============================================================================
 * Conecta a camada de visualização (UI e Modais) aos serviços de negócio
 * (Auth e Profissionais) em uma arquitetura Single Page Application (SPA).
 * ==============================================================================
 */

import { 
  fazerLogin, 
  fazerLogout, 
  obterSessaoAtual, 
  inscreverMudancaAutenticacao 
} from './servicos/authService.js';

import { 
  listarProfissionais, 
  cadastrarProfissional, 
  atualizarProfissional,
  excluirProfissional,
  uploadFotoProfissional
} from './servicos/profissionaisService.js';

import { 
  abrirModal, 
  fecharModal, 
  inicializarModais 
} from './componentes/modal.js';

import { 
  renderizarCardsProfissionais, 
  renderizarModalPerfil,
  abrirVisualizadorFoto,
  renderizarSkeleton, 
  renderizarEstadoVazio, 
  mostrarToast, 
  aplicarMascaraTelefone 
} from './componentes/ui.js';

import { isConfiguracaoPadrao } from './config/supabaseClient.js';

// ==============================================================================
// 1. ESTADO DA APLICAÇÃO (SINGLETON STATE)
// ==============================================================================
const estado = {
  usuario: null,
  perfil: null,
  profissionais: [],
  filtroAla: 'todas',
  termoBusca: '',
  profissionalParaExcluir: null,
  profissionalEmEdicao: null,
  arquivoFotoSelecionado: null,
  fotoOriginalUrl: null,
  carregando: false
};

// ==============================================================================
// 2. REFERÊNCIAS DO DOM (CACHED DOM ELEMENTS)
// ==============================================================================
const DOM = {
  // Autenticação & Header
  adminHeaderArea: document.getElementById('adminHeaderArea'),
  adminHeaderName: document.getElementById('adminHeaderName'),
  adminHeaderWard: document.getElementById('adminHeaderWard'),
  btnOpenLoginModal: document.getElementById('btnOpenLoginModal'),
  btnOpenAddModal: document.getElementById('btnOpenAddModal'),
  btnLogout: document.getElementById('btnLogout'),
  
  // Busca & Filtros
  searchBoxContainer: document.getElementById('searchBoxContainer'),
  searchInput: document.getElementById('searchInput'),
  searchClearBtn: document.getElementById('searchClearBtn'),
  alaFilterContainer: document.getElementById('alaFilterContainer'),
  resultsCount: document.getElementById('resultsCount'),
  professionalsGrid: document.getElementById('professionalsGrid'),

  // Formulário de Login
  formLogin: document.getElementById('formLogin'),
  loginEmail: document.getElementById('loginEmail'),
  loginPassword: document.getElementById('loginPassword'),
  btnLoginSubmit: document.getElementById('btnLoginSubmit'),

  // Formulário de Cadastro / Edição
  formAddPro: document.getElementById('formAddPro'),
  modalAddProTitle: document.getElementById('modalAddProTitle'),
  proName: document.getElementById('proName'),
  proRole: document.getElementById('proRole'),
  proPhone: document.getElementById('proPhone'),
  proWard: document.getElementById('proWard'),
  proDescription: document.getElementById('proDescription'),
  photoUploadWrapper: document.getElementById('photoUploadWrapper'),
  photoPreviewBox: document.getElementById('photoPreviewBox'),
  proPhotoInput: document.getElementById('proPhotoInput'),
  btnRemovePhoto: document.getElementById('btnRemovePhoto'),
  btnSaveProSubmit: document.getElementById('btnSaveProSubmit'),

  // Modal de Exclusão
  deleteProNameTarget: document.getElementById('deleteProNameTarget'),
  btnConfirmDeleteSubmit: document.getElementById('btnConfirmDeleteSubmit')
};

// ==============================================================================
// 3. CARREGAMENTO E ATUALIZAÇÃO DE DADOS
// ==============================================================================

/**
 * Carrega os profissionais do Supabase de acordo com a busca e a ala selecionada.
 */
async function carregarProfissionais() {
  estado.carregando = true;
  renderizarSkeleton(DOM.professionalsGrid, 6);
  DOM.resultsCount.textContent = 'Buscando profissionais...';

  const { dados, error } = await listarProfissionais({
    termoBusca: estado.termoBusca,
    ala: estado.filtroAla
  });

  estado.carregando = false;

  if (error) {
    if (isConfiguracaoPadrao) {
      exibirAvisoConfiguracaoSupabase();
      return;
    }
    mostrarToast(`Erro ao carregar profissionais: ${error.message}`, 'error');
    renderizarEstadoVazio(DOM.professionalsGrid, 'Não foi possível conectar ao banco de dados.');
    DOM.resultsCount.textContent = 'Erro ao carregar dados';
    return;
  }

  estado.profissionais = dados;
  atualizarContadorResultados(dados.length);
  renderizarCards();
}

/**
 * Renderiza os cards de profissionais com todos os manipuladores de eventos necessários.
 */
function renderizarCards() {
  renderizarCardsProfissionais(
    DOM.professionalsGrid, 
    estado.profissionais, 
    estado.perfil, 
    abrirModalVisualizacaoPerfil,
    abrirModalEdicao,
    solicitarExclusaoProfissional,
    abrirVisualizadorFoto
  );
}

/**
 * Abre o modal de visualização detalhada do perfil do profissional.
 * @param {object} pro 
 */
function abrirModalVisualizacaoPerfil(pro) {
  renderizarModalPerfil(
    pro, 
    estado.perfil, 
    abrirModalEdicao, 
    solicitarExclusaoProfissional, 
    abrirVisualizadorFoto
  );
  abrirModal('modalProfileView');
}

/**
 * Atualiza o texto do contador de profissionais encontrados.
 * @param {number} total 
 */
function atualizarContadorResultados(total) {
  const alaTexto = estado.filtroAla === 'todas' ? 'todas as alas' : estado.filtroAla;
  if (total === 0) {
    DOM.resultsCount.innerHTML = `Nenhum profissional encontrado em <strong>${alaTexto}</strong>`;
  } else if (total === 1) {
    DOM.resultsCount.innerHTML = `<strong>1 profissional</strong> encontrado em <strong>${alaTexto}</strong>`;
  } else {
    DOM.resultsCount.innerHTML = `<strong>${total} profissionais</strong> encontrados em <strong>${alaTexto}</strong>`;
  }
}

/**
 * Exibe estado explicativo caso o projeto ainda utilize os placeholders padrão de configuração.
 */
function exibirAvisoConfiguracaoSupabase() {
  DOM.resultsCount.innerHTML = 'Ambiente pronto para conexão com o Supabase';
  DOM.professionalsGrid.innerHTML = `
    <div class="empty-state-box">
      <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
      </svg>
      <h4 class="empty-state-title">Estrutura Pronta para Produção!</h4>
      <p class="empty-state-desc">
        Execute o script <strong>DDL_SUPABASE.sql</strong> no seu painel Supabase e configure a URL e chave anônima no <code>supabaseClient.js</code>.
      </p>
    </div>
  `;
}

// ==============================================================================
// 4. FLUXO DE AUTENTICAÇÃO E ATUALIZAÇÃO DA UI
// ==============================================================================

/**
 * Atualiza os elementos visuais do cabeçalho conforme o estado de login do usuário.
 */
function atualizarInterfaceAutenticacao() {
  if (estado.usuario && estado.perfil) {
    DOM.adminHeaderArea.classList.add('active');
    DOM.btnOpenLoginModal.style.display = 'none';
    DOM.adminHeaderName.textContent = estado.perfil.nome || 'Administrador';
    
    if (estado.perfil.e_super_admin) {
      DOM.adminHeaderWard.textContent = '⚡ Super Admin';
      DOM.adminHeaderWard.title = 'Acesso Geral: Você pode cadastrar e gerenciar profissionais em todas as Alas';
    } else {
      DOM.adminHeaderWard.textContent = estado.perfil.ala || 'Ala';
      DOM.adminHeaderWard.title = `Administrador da ${estado.perfil.ala}`;
    }
  } else {
    DOM.adminHeaderArea.classList.remove('active');
    DOM.btnOpenLoginModal.style.display = 'inline-flex';
  }

  renderizarCards();
}

/**
 * Processa a submissão do formulário de login.
 * @param {Event} e 
 */
async function processarLogin(e) {
  e.preventDefault();
  const email = DOM.loginEmail.value;
  const senha = DOM.loginPassword.value;

  DOM.btnLoginSubmit.disabled = true;
  DOM.btnLoginSubmit.innerHTML = '<span class="spinner"></span><span>Entrando...</span>';

  const { user, perfil, error } = await fazerLogin(email, senha);

  DOM.btnLoginSubmit.disabled = false;
  DOM.btnLoginSubmit.innerHTML = '<span>Entrar</span>';

  if (error) {
    mostrarToast(error.message, 'error');
    return;
  }

  estado.usuario = user;
  estado.perfil = perfil;

  fecharModal('modalLogin');
  DOM.formLogin.reset();
  atualizarInterfaceAutenticacao();
  
  const cargoTexto = perfil.e_super_admin ? 'Super Administrador (Acesso Geral)' : `Administrador da ${perfil.ala}`;
  mostrarToast(`Bem-vindo, ${perfil.nome}! ${cargoTexto}.`, 'success');
}

/**
 * Processa o logout do administrador.
 */
async function processarLogout() {
  const { error } = await fazerLogout();
  if (error) {
    mostrarToast(`Erro ao sair: ${error.message}`, 'error');
    return;
  }

  estado.usuario = null;
  estado.perfil = null;
  atualizarInterfaceAutenticacao();
  mostrarToast('Sessão encerrada com sucesso.', 'info');
}

/**
 * Configura os ouvintes para upload de imagem e pré-visualização.
 */
function configurarUploadFoto() {
  DOM.proPhotoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      mostrarToast('Por favor, selecione um arquivo de imagem (PNG, JPG ou WEBP).', 'error');
      DOM.proPhotoInput.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      mostrarToast('A foto não pode ultrapassar 5MB.', 'error');
      DOM.proPhotoInput.value = '';
      return;
    }

    estado.arquivoFotoSelecionado = file;
    const reader = new FileReader();
    reader.onload = (event) => {
      DOM.photoPreviewBox.innerHTML = `<img src="${event.target.result}" alt="Pré-visualização da foto" />`;
      DOM.photoUploadWrapper.classList.add('has-file');
    };
    reader.readAsDataURL(file);
  });

  DOM.btnRemovePhoto.addEventListener('click', limparFotoSelecionada);
}

/**
 * Reseta o campo de upload de foto para o estado inicial.
 */
function limparFotoSelecionada() {
  estado.arquivoFotoSelecionado = null;
  estado.fotoOriginalUrl = null;
  DOM.proPhotoInput.value = '';
  DOM.photoUploadWrapper.classList.remove('has-file');
  DOM.photoPreviewBox.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>
  `;
}

// ==============================================================================
// 5. FLUXO DE CADASTRO, EDIÇÃO E EXCLUSÃO DE PROFISSIONAIS
// ==============================================================================

/**
 * Abre o modal para cadastro de um novo profissional.
 */
function abrirModalCadastro() {
  if (!estado.perfil) {
    mostrarToast('Você precisa estar logado para cadastrar um profissional.', 'error');
    return;
  }

  estado.profissionalEmEdicao = null;
  DOM.formAddPro.reset();
  limparFotoSelecionada();

  if (DOM.modalAddProTitle) {
    DOM.modalAddProTitle.textContent = 'Cadastrar Novo Profissional';
  }
  DOM.btnSaveProSubmit.querySelector('span').textContent = 'Salvar Profissional';

  const hintEl = document.getElementById('proWardHint');

  if (estado.perfil.e_super_admin) {
    DOM.proWard.disabled = false;
    DOM.proWard.value = (estado.filtroAla && estado.filtroAla !== 'todas') 
      ? estado.filtroAla 
      : (estado.perfil.ala || 'Ala Jatobá');
    if (hintEl) {
      hintEl.textContent = '⚡ Como Super Admin, você pode selecionar qualquer Ala da Estaca.';
    }
  } else {
    DOM.proWard.value = estado.perfil.ala;
    DOM.proWard.disabled = true;
    if (hintEl) {
      hintEl.textContent = 'Definida automaticamente com base na sua Ala de administrador.';
    }
  }

  abrirModal('modalAddPro');
}

/**
 * Abre o modal preenchido com os dados atuais para edição do profissional.
 * @param {object} pro 
 */
function abrirModalEdicao(pro) {
  if (!estado.perfil) {
    mostrarToast('Você precisa estar logado para editar um profissional.', 'error');
    return;
  }

  estado.profissionalEmEdicao = pro;
  DOM.formAddPro.reset();
  limparFotoSelecionada();

  if (DOM.modalAddProTitle) {
    DOM.modalAddProTitle.textContent = 'Editar Profissional';
  }
  DOM.btnSaveProSubmit.querySelector('span').textContent = 'Atualizar Informações';

  DOM.proName.value = pro.nome || '';
  DOM.proRole.value = pro.profissao || '';
  DOM.proPhone.value = pro.telefone || '';
  DOM.proDescription.value = pro.descricao || '';

  const hintEl = document.getElementById('proWardHint');

  if (estado.perfil.e_super_admin) {
    DOM.proWard.disabled = false;
    DOM.proWard.value = pro.ala;
    if (hintEl) {
      hintEl.textContent = '⚡ Como Super Admin, você pode alterar a Ala de destino.';
    }
  } else {
    DOM.proWard.value = pro.ala;
    DOM.proWard.disabled = true;
    if (hintEl) {
      hintEl.textContent = 'Profissional vinculado à sua Ala de administrador.';
    }
  }

  // Pré-visualização da foto existente (se houver)
  if (pro.foto_url) {
    estado.fotoOriginalUrl = pro.foto_url;
    DOM.photoPreviewBox.innerHTML = `<img src="${escapeHtml(pro.foto_url)}" alt="Foto atual" />`;
    DOM.photoUploadWrapper.classList.add('has-file');
  }

  abrirModal('modalAddPro');
}

/**
 * Processa o envio do formulário (Cadastro ou Atualização).
 * @param {Event} e 
 */
async function processarCadastroProfissional(e) {
  e.preventDefault();

  if (!estado.perfil) {
    mostrarToast('Sessão expirada. Faça login novamente.', 'error');
    return;
  }

  const alaDestino = estado.perfil.e_super_admin ? DOM.proWard.value : estado.perfil.ala;
  const isEdicao = !!estado.profissionalEmEdicao;

  DOM.btnSaveProSubmit.disabled = true;
  let fotoFinalUrl = isEdicao ? estado.fotoOriginalUrl : null;

  // Realiza upload da nova foto caso o usuário tenha selecionado um novo arquivo
  if (estado.arquivoFotoSelecionado) {
    DOM.btnSaveProSubmit.innerHTML = '<span class="spinner"></span><span>Enviando foto...</span>';
    const { url, error: fotoError } = await uploadFotoProfissional(estado.arquivoFotoSelecionado);
    if (fotoError) {
      mostrarToast(`Aviso ao enviar foto: ${fotoError.message}`, 'error');
    } else {
      fotoFinalUrl = url;
    }
  }

  const dados = {
    nome: DOM.proName.value,
    profissao: DOM.proRole.value,
    telefone: DOM.proPhone.value,
    ala: alaDestino,
    descricao: DOM.proDescription.value,
    foto_url: fotoFinalUrl
  };

  DOM.btnSaveProSubmit.innerHTML = `<span class="spinner"></span><span>${isEdicao ? 'Atualizando...' : 'Salvando...'}</span>`;

  let resultado;
  if (isEdicao) {
    resultado = await atualizarProfissional(estado.profissionalEmEdicao.id, dados);
  } else {
    resultado = await cadastrarProfissional(dados);
  }

  DOM.btnSaveProSubmit.disabled = false;
  DOM.btnSaveProSubmit.innerHTML = `<span>${isEdicao ? 'Atualizar Informações' : 'Salvar Profissional'}</span>`;

  if (resultado.error) {
    mostrarToast(`Erro ao salvar: ${resultado.error.message}`, 'error');
    return;
  }

  fecharModal('modalAddPro');
  DOM.formAddPro.reset();
  limparFotoSelecionada();
  
  const msgSucesso = isEdicao 
    ? 'Informações do profissional atualizadas com sucesso!'
    : `Profissional cadastrado com sucesso na ${alaDestino}!`;

  mostrarToast(msgSucesso, 'success');
  estado.profissionalEmEdicao = null;
  carregarProfissionais();
}

/**
 * Abre o modal de confirmação para exclusão de um profissional.
 * @param {object} profissional 
 */
function solicitarExclusaoProfissional(profissional) {
  estado.profissionalParaExcluir = profissional;
  DOM.deleteProNameTarget.textContent = `${profissional.nome} (${profissional.profissao})`;
  abrirModal('modalDeleteConfirm');
}

/**
 * Confirma e executa a exclusão no Supabase.
 */
async function confirmarExclusaoProfissional() {
  if (!estado.profissionalParaExcluir) return;

  DOM.btnConfirmDeleteSubmit.disabled = true;
  DOM.btnConfirmDeleteSubmit.innerHTML = '<span class="spinner"></span><span>Excluindo...</span>';

  const { error } = await excluirProfissional(estado.profissionalParaExcluir.id);

  DOM.btnConfirmDeleteSubmit.disabled = false;
  DOM.btnConfirmDeleteSubmit.innerHTML = '<span>Sim, Excluir</span>';

  if (error) {
    mostrarToast(`Erro ao excluir: ${error.message}`, 'error');
    return;
  }

  fecharModal('modalDeleteConfirm');
  fecharModal('modalProfileView');
  mostrarToast('Profissional removido com sucesso!', 'success');
  estado.profissionalParaExcluir = null;
  carregarProfissionais();
}

// ==============================================================================
// 6. EVENTOS DE BUSCA E FILTROS
// ==============================================================================

/**
 * Configura o campo de pesquisa com debounce de 300ms.
 */
function configurarBusca() {
  let debounceTimeout = null;

  DOM.searchInput.addEventListener('input', (e) => {
    const valor = e.target.value;
    estado.termoBusca = valor;

    if (valor.trim().length > 0) {
      DOM.searchBoxContainer.classList.add('has-text');
    } else {
      DOM.searchBoxContainer.classList.remove('has-text');
    }

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      carregarProfissionais();
    }, 300);
  });

  DOM.searchClearBtn.addEventListener('click', () => {
    DOM.searchInput.value = '';
    estado.termoBusca = '';
    DOM.searchBoxContainer.classList.remove('has-text');
    DOM.searchInput.focus();
    carregarProfissionais();
  });
}

/**
 * Configura os botões de filtro por Ala.
 */
function configurarFiltrosAla() {
  DOM.alaFilterContainer.addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;

    DOM.alaFilterContainer.querySelectorAll('.filter-pill').forEach(btn => {
      btn.classList.remove('active');
    });
    pill.classList.add('active');

    estado.filtroAla = pill.getAttribute('data-ala');
    carregarProfissionais();
  });
}

/**
 * Escuta tecla de escape ou clique fora para fechar o visualizador de lightbox de foto.
 */
function configurarVisualizadorFoto() {
  const lightboxModal = document.getElementById('modalPhotoViewer');
  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal || e.target.classList.contains('lightbox-container')) {
        fecharModal('modalPhotoViewer');
      }
    });
  }
}

// ==============================================================================
// 7. INICIALIZAÇÃO DA APLICAÇÃO (BOOTSTRAP)
// ==============================================================================
async function init() {
  // Inicialização de componentes e utilitários
  inicializarModais();
  configurarBusca();
  configurarFiltrosAla();
  aplicarMascaraTelefone(DOM.proPhone);
  configurarUploadFoto();
  configurarVisualizadorFoto();

  // Event Listeners de Ações
  DOM.btnOpenLoginModal.addEventListener('click', () => abrirModal('modalLogin'));
  DOM.btnOpenAddModal.addEventListener('click', abrirModalCadastro);
  DOM.btnLogout.addEventListener('click', processarLogout);
  DOM.formLogin.addEventListener('submit', processarLogin);
  DOM.formAddPro.addEventListener('submit', processarCadastroProfissional);
  DOM.btnConfirmDeleteSubmit.addEventListener('click', confirmarExclusaoProfissional);

  // Recupera sessão ativa no Supabase
  const { user, perfil } = await obterSessaoAtual();
  estado.usuario = user;
  estado.perfil = perfil;
  atualizarInterfaceAutenticacao();

  // Ouve mudanças futuras no estado de autenticação
  inscreverMudancaAutenticacao(({ user: novoUser, perfil: novoPerfil }) => {
    estado.usuario = novoUser;
    estado.perfil = novoPerfil;
    atualizarInterfaceAutenticacao();
  });

  // Carrega catálogo inicial de profissionais
  await carregarProfissionais();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Inicia a aplicação assim que o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);
