/**
 * ==============================================================================
 * GUIA PROFISSIONAL DA ESTACA - SERVIÇO DE AUTENTICAÇÃO
 * ==============================================================================
 * Gerencia autenticação de Administradores de Ala com Supabase Auth e
 * mapeamento de perfil vinculado à tabela 'perfis_administradores'.
 * Padrão Fail-Fast e funções com responsabilidade única.
 * ==============================================================================
 */

import { supabase } from '../config/supabaseClient.js';

/**
 * Busca o perfil de administrador associado ao usuário autenticado.
 * @param {string} userId - UUID do usuário no Supabase Auth
 * @returns {Promise<{ perfil: object|null, error: Error|null }>}
 */
export async function obterPerfilAdministrador(userId) {
  if (!userId) {
    return { perfil: null, error: new Error('ID de usuário não fornecido.') };
  }

  try {
    const { data, error } = await supabase
      .from('perfis_administradores')
      .select('id, nome, ala, e_super_admin, criado_em')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return { perfil: data, error: null };
  } catch (err) {
    console.error('[authService] Erro ao obter perfil do administrador:', err.message);
    return { perfil: null, error: err };
  }
}
/**
 * @param { string } email
 * @param { string } senha
 * @returns { Promise < { user: object | null, perfil: object | null, error: Error | null } >}
 */
export async function fazerLogin(email, senha) {

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return { user: null, perfil: null, error: new Error('Por favor, informe um e-mail válido.') };
  }
  if (!senha || typeof senha !== 'string' || senha.length < 6) {
    return { user: null, perfil: null, error: new Error('A senha deve conter no mínimo 6 caracteres.') };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha
    });

    if (error) throw error;
    if (!data.user) throw new Error('Não foi possível autenticar o usuário.');


    const { perfil, error: perfilError } = await obterPerfilAdministrador(data.user.id);
    if (perfilError) throw perfilError;

    if (!perfil) {

      await supabase.auth.signOut();
      throw new Error('Este usuário não possui permissão de Administrador de Ala cadastrada no sistema.');
    }

    return { user: data.user, perfil, error: null };
  } catch (err) {
    console.error('[authService] Falha na autenticação:', err.message);
    let mensagemAmigavel = err.message;
    if (err.message.includes('Invalid login credentials')) {
      mensagemAmigavel = 'E-mail ou senha incorretos.';
    } else if (err.message.includes('Email not confirmed')) {
      mensagemAmigavel = 'E-mail ainda não confirmado. Verifique sua caixa de entrada.';
    } else if (err.message.includes('Failed to fetch')) {
      mensagemAmigavel = 'Falha ao conectar com o Supabase. Verifique sua conexão com a internet.';
    }
    return { user: null, perfil: null, error: new Error(mensagemAmigavel) };
  }
}

/**
 * Encerra a sessão ativa do usuário.
 * @returns {Promise<{ success: boolean, error: Error|null }>}
 */
export async function fazerLogout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    console.error('[authService] Erro ao deslogar:', err.message);
    return { success: false, error: err };
  }
}

/**
 * Obtém a sessão e o perfil do usuário logado atualmente (se houver).
 * @returns {Promise<{ session: object|null, user: object|null, perfil: object|null }>}
 */
export async function obterSessaoAtual() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) {
      return { session: null, user: null, perfil: null };
    }

    const { perfil } = await obterPerfilAdministrador(session.user.id);
    return { session, user: session.user, perfil };
  } catch (err) {
    console.error('[authService] Erro ao recuperar sessão:', err.message);
    return { session: null, user: null, perfil: null };
  }
}

/**
 * Registra um ouvinte para mudanças no estado da autenticação (login, logout, refresh).
 * @param {Function} callback - Chamado com ({ event, session, user, perfil })
 * @returns {object} Subscription do Supabase para cancelamento se necessário
 */
export function inscreverMudancaAutenticacao(callback) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    let perfil = null;
    if (session?.user) {
      const res = await obterPerfilAdministrador(session.user.id);
      perfil = res.perfil;
    }
    callback({ event, session, user: session?.user || null, perfil });
  });
}
