import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

/**
 * COMPONENTE: WaitingRoom
 * Rota configurada em App.jsx: /sala/:token
 */
export default function WaitingRoom() {
  // Captura o token diretamente da URL (/sala/id-do-token)
  const { token } = useParams();
  const [mensagem, setMensagem] = useState('Verificando credenciais...');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // LOG de depuração para o seu console
    console.log("Acessando sala com o token:", token);

    // Se o token não vier pela URL, interrompe e avisa o usuário
    if (!token) {
      setMensagem("ERRO: Link de acesso inválido ou incompleto.");
      setCarregando(false);
      return;
    }

    async function validarEConectar() {
      try {
        setMensagem("Conectando ao TelePsi Hub...");

        // CHAMADA À EDGE FUNCTION
        // Importante: Passamos o token no BODY para evitar o erro 'Unexpected end of JSON'
        const { data, error } = await supabase.functions.invoke('get-daily-token', {
          body: { token: token } 
        });

        // 1. Trata erro de rede ou falha na autenticação do Supabase (Erro 401/500)
        if (error) {
          console.error("Erro Supabase Function:", error);
          setMensagem(`Erro de conexão: ${error.message}`);
          setCarregando(false);
          return;
        }

        // 2. Trata erros retornados pela SUA lógica dentro da função (ex: Agendamento não encontrado)
        if (data?.error) {
          console.warn("Função recusou o acesso:", data.error);
          setMensagem(`Acesso negado: ${data.error}`);
          setCarregando(false);
          return;
        }

        // 3. SUCESSO: Redireciona para a sala do Daily.co
        if (data?.url) {
          setMensagem("Acesso autorizado! Redirecionando para a chamada...");
          
          // Pequeno delay apenas para o usuário ler a mensagem de sucesso
          setTimeout(() => {
            window.location.href = data.url;
          }, 1500);
        } else {
          setMensagem("Erro inesperado: O servidor não enviou o link da sala.");
          setCarregando(false);
        }

      } catch (e) {
        console.error("Erro crítico no frontend:", e);
        setMensagem("Erro interno: Falha ao processar resposta do servidor.");
        setCarregando(false);
      }