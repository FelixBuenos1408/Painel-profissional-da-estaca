/**
 * ==============================================================================
 * GUIA PROFISSIONAL DA ESTACA - SERVIÇO DE PROFISSIONAIS
 * ==============================================================================
 * Gerencia operações de CRUD e busca no catálogo de profissionais.
 * Todas as operações de gravação e exclusão são protegidas pelas políticas
 * de Row Level Security (RLS) configuradas no banco PostgreSQL.
 * ==============================================================================
 */

import { supabase } from '../config/supabaseClient.js';

export const ALAS_PERMITIDAS = [
  'Ala Jatobá',
  'Ala Lisboa 1',
  'Ala Lisboa 2',
  'Ala Nova Conquista',
  'Ala Novo Araturi'
];

/**
 * Validação Fail-Fast para os dados do profissional.
 * @param {object} dados 
 */
export function validarDadosProfissional(dados) {
  const { nome, profissao, telefone, ala } = dados || {};

  if (!nome || typeof nome !== 'string' || nome.trim().length < 3) {
    throw new Error('O nome do profissional deve ter pelo menos 3 caracteres.');
  }

  if (!profissao || typeof profissao !== 'string' || profissao.trim().length < 2) {
    throw new Error('A profissão/área de atuação deve ser informada.');
  }

  // Sanitiza apenas dígitos para validação
  const apenasDigitos = (telefone || '').replace(/\D/g, '');
  if (!telefone || apenasDigitos.length < 10 || apenasDigitos.length > 11) {
    throw new Error('Informe um telefone válido com DDD (10 ou 11 dígitos).');
  }

  if (!ala || !ALAS_PERMITIDAS.includes(ala)) {
    throw new Error(`Ala inválida. As opções válidas são: ${ALAS_PERMITIDAS.join(', ')}.`);
  }
}

/**
 * Faz upload da foto do profissional para o bucket do Supabase Storage.
 * @param {File} arquivo 
 * @returns {Promise<{ url: string|null, error: Error|null }>}
 */
export async function uploadFotoProfissional(arquivo) {
  if (!arquivo) return { url: null, error: null };

  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!tiposPermitidos.includes(arquivo.type)) {
    return { url: null, error: new Error('Formato não suportado. Envie uma imagem JPG, PNG ou WEBP.') };
  }

  // Limite de tamanho: 5MB
  if (arquivo.size > 5 * 1024 * 1024) {
    return { url: null, error: new Error('A imagem deve ter no máximo 5MB.') };
  }

  try {
    const extensao = arquivo.name.split('.').pop() || 'jpg';
    const nomeArquivo = `pro_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extensao}`;
    const caminho = `avatares/${nomeArquivo}`;

    const { error: uploadError } = await supabase.storage
      .from('fotos_profissionais')
      .upload(caminho, arquivo, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('fotos_profissionais')
      .getPublicUrl(caminho);

    return { url: data?.publicUrl || null, error: null };
  } catch (err) {
    console.error('[profissionaisService] Erro no upload da foto:', err.message);
    return { url: null, error: err };
  }
}

/**
 * Lista profissionais com suporte a busca textual e filtro por Ala.
 * Consulta pública aberta para todos os visitantes.
 * @param {object} filtros - { termoBusca?: string, ala?: string }
 * @returns {Promise<{ dados: Array, error: Error|null }>}
 */
export async function listarProfissionais({ termoBusca = '', ala = 'todas' } = {}) {
  try {
    let query = supabase
      .from('profissionais')
      .select('id, nome, profissao, telefone, ala, foto_url, descricao, criado_por, criado_em')
      .order('nome', { ascending: true });

    // Aplica filtro por Ala se for diferente de 'todas'
    if (ala && ala !== 'todas') {
      query = query.eq('ala', ala);
    }

    // Aplica busca textual case-insensitive no nome ou na profissão
    const termoLimpo = termoBusca.trim();
    if (termoLimpo) {
      query = query.or(`nome.ilike.%${termoLimpo}%,profissao.ilike.%${termoLimpo}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { dados: data || [], error: null };
  } catch (err) {
    console.error('[profissionaisService] Erro ao listar profissionais:', err.message);
    return { dados: [], error: err };
  }
}

/**
 * Cadastra um novo profissional no banco de dados.
 * O RLS do Supabase rejeitará a inserção se o usuário não pertencer à mesma Ala.
 * @param {object} dadosProfissional - { nome, profissao, telefone, ala, foto_url, descricao }
 * @returns {Promise<{ dados: object|null, error: Error|null }>}
 */
export async function cadastrarProfissional(dadosProfissional) {
  try {
    // Validação Fail-Fast
    validarDadosProfissional(dadosProfissional);

    const { nome, profissao, telefone, ala, foto_url, descricao } = dadosProfissional;

    // Sanitiza e formata
    const novoRegistro = {
      nome: nome.trim(),
      profissao: profissao.trim(),
      telefone: telefone.trim(),
      ala: ala,
      foto_url: foto_url ? foto_url.trim() : null,
      descricao: descricao ? descricao.trim() : null
    };

    const { data, error } = await supabase
      .from('profissionais')
      .insert([novoRegistro])
      .select()
      .single();

    if (error) throw error;
    return { dados: data, error: null };
  } catch (err) {
    console.error('[profissionaisService] Erro ao cadastrar profissional:', err.message);
    return { dados: null, error: err };
  }
}

/**
 * Atualiza os dados de um profissional existente no banco de dados.
 * O RLS do Supabase garante que apenas o Administrador da respectiva Ala ou Super Admin pode atualizar.
 * @param {string} id - UUID do profissional
 * @param {object} dadosProfissional - { nome, profissao, telefone, ala, foto_url, descricao }
 * @returns {Promise<{ dados: object|null, error: Error|null }>}
 */
export async function atualizarProfissional(id, dadosProfissional) {
  if (!id || typeof id !== 'string') {
    return { dados: null, error: new Error('ID do profissional é obrigatório para atualização.') };
  }

  try {
    // Validação Fail-Fast
    validarDadosProfissional(dadosProfissional);

    const { nome, profissao, telefone, ala, foto_url, descricao } = dadosProfissional;

    const registroAtualizado = {
      nome: nome.trim(),
      profissao: profissao.trim(),
      telefone: telefone.trim(),
      ala: ala,
      descricao: descricao !== undefined ? (descricao ? descricao.trim() : null) : undefined
    };

    // Se uma nova foto_url foi informada ou explicitamente alterada
    if (foto_url !== undefined) {
      registroAtualizado.foto_url = foto_url ? foto_url.trim() : null;
    }

    const { data, error } = await supabase
      .from('profissionais')
      .update(registroAtualizado)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { dados: data, error: null };
  } catch (err) {
    console.error('[profissionaisService] Erro ao atualizar profissional:', err.message);
    return { dados: null, error: err };
  }
}

/**
 * Remove um profissional pelo seu ID.
 * O RLS do Supabase rejeitará a exclusão se o usuário não for administrador da mesma Ala.
 * @param {string} id - UUID do profissional
 * @returns {Promise<{ success: boolean, error: Error|null }>}
 */
export async function excluirProfissional(id) {
  if (!id || typeof id !== 'string') {
    return { success: false, error: new Error('ID do profissional é obrigatório para exclusão.') };
  }

  try {
    const { error } = await supabase
      .from('profissionais')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    console.error('[profissionaisService] Erro ao excluir profissional:', err.message);
    return { success: false, error: err };
  }
}
