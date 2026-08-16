/**
 * ==============================================================================
 * GUIA PROFISSIONAL DA ESTACA - CONFIGURAÇÃO DO CLIENTE SUPABASE
 * ==============================================================================
 * Inicialização centralizada do cliente Supabase (versão 2.x via ESM CDN).
 * Permite configuração via variáveis globais (window.ENV) ou armazenamento local
 * para facilidade de deployment e testes seguros sem expor segredos no repositório.
 * ==============================================================================
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Chaves padrão para ambiente de desenvolvimento / demonstração
// Em produção, defina no window.SUPABASE_CONFIG ou no localStorage
const DEFAULT_SUPABASE_URL = 'https://ddsqqysanjkfdlsbbmmo.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkc3FxeXNhbmprZmRsc2JibW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5MDM5NTgsImV4cCI6MjEwMjQ3OTk1OH0.LMFpiw_qApWFRdM-b1KjKkOAVXIdPWF5q0VjlzGU2K8';

/**
 * Obtém as credenciais ativas do Supabase a partir de variáveis de ambiente do navegador
 * ou do localStorage do usuário.
 * @returns {{ url: string, anonKey: string }}
 */
export function obterCredenciaisSupabase() {
  const customConfig = window.SUPABASE_CONFIG || {};

  const url = customConfig.URL
    || localStorage.getItem('https://ddsqqysanjkfdlsbbmmo.supabase.co')
    || DEFAULT_SUPABASE_URL;

  const anonKey = customConfig.ANON_KEY
    || localStorage.getItem('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkc3FxeXNhbmprZmRsc2JibW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5MDM5NTgsImV4cCI6MjEwMjQ3OTk1OH0.LMFpiw_qApWFRdM-b1KjKkOAVXIdPWF5q0VjlzGU2K8')
    || DEFAULT_SUPABASE_ANON_KEY;

  return { url: url.trim(), anonKey: anonKey.trim() };
}

/**
 * Salva credenciais personalizadas no localStorage caso o usuário deseje conectar
 * seu projeto diretamente pelo navegador.
 * @param {string} url 
 * @param {string} anonKey 
 */
export function salvarCredenciaisSupabase(url, anonKey) {
  if (!url || !anonKey) {
    throw new Error('A URL e a Chave Anônima do Supabase são obrigatórias.');
  }
  localStorage.setItem('ESTACA_SUPABASE_URL', url.trim());
  localStorage.setItem('ESTACA_SUPABASE_ANON_KEY', anonKey.trim());
}

/**
 * Instância singleton do cliente Supabase.
 */
const { url, anonKey } = obterCredenciaisSupabase();

export const isConfiguracaoPadrao = (url === DEFAULT_SUPABASE_URL);

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
