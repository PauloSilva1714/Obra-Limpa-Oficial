import * as functions from 'firebase-functions/v1';
// import { region } from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import cors from 'cors';
import fetch from 'node-fetch';
// Removido: import { GoogleGenerativeAI } from '@google/generative-ai';

// Usar uma instância de CORS que permite todas as origens para simplificar a depuração
const corsHandler = cors({ origin: true });

admin.initializeApp();

// Criar uma verificação para garantir que as configurações existem antes de criar o transporter
const gmailConfig = functions.config().gmail;
let transporter: nodemailer.Transporter;

// Usar apenas Gmail como serviço de email
if (gmailConfig && gmailConfig.user && gmailConfig.pass) {
  console.log('Configurando Gmail como serviço de email...');
  console.log('Usuário Gmail:', gmailConfig.user);
  console.log('Senha configurada:', gmailConfig.pass ? 'SIM' : 'NÃO');
  
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailConfig.user,
      pass: gmailConfig.pass,
    },
    // Adicionar configurações extras para melhor compatibilidade
    secure: true,
    port: 465,
  });
  
  // Testar a conexão
  transporter.verify(function(error, success) {
    if (error) {
      console.error('Erro na verificação do transporter Gmail:', error);
    } else {
      console.log('Transporter Gmail configurado com sucesso!');
    }
  });
} else {
  console.warn(
    'Configuração do Gmail não encontrada em functions.config(). ' +
    'O serviço de e-mail ficará desativado até que as configurações sejam definidas. ' +
    'Execute: firebase functions:config:set gmail.user="..." gmail.pass="..."'
  );
  // Criar um transporter "falso" que não faz nada, para evitar que a app quebre
  transporter = nodemailer.createTransport({
      jsonTransport: true
  });
}

/**
 * Função HTTP v1 para enviar e-mail.
 * É mais estável para lidar com CORS e parsing de body.
 */
export const sendEmailV1 = functions.https.onRequest((req, res) => {
  // Envolvemos toda a lógica da função no corsHandler.
  // Ele gerenciará as requisições OPTIONS (preflight) automaticamente.
  corsHandler(req, res, async () => {
    // Adicionando logs para depuração
    console.log("Headers da Requisição:", req.headers);
    console.log("Corpo da Requisição (parseado):", req.body);

    if (req.method !== "POST") {
      // O corsHandler já lidou com o OPTIONS, então retornamos um erro para outros métodos.
      res.status(405).send("Method Not Allowed");
      return;
    }

    const { to, subject, html } = req.body;

    // Validação de entrada
    if (!to || !subject || !html) {
      console.error("Erro de validação: Faltando campos obrigatórios.", { to, subject, html: !!html });
      res.status(400).json({
        error: {
          message: "Campos 'to', 'subject', e 'html' são obrigatórios.",
          status: "INVALID_ARGUMENT",
        },
      });
      return;
    }

    // Adiciona uma verificação para garantir que o transporter real está configurado
    if (!gmailConfig) {
      console.error("Erro: O serviço de e-mail não está configurado. Verifique as variáveis de ambiente.");
      res.status(500).json({
        error: {
          message: "O serviço de e-mail não está configurado no servidor.",
          status: "INTERNAL_ERROR",
        },
      });
      return;
    }

    // Determinar o email remetente baseado na configuração ativa
    const fromEmail = gmailConfig.user;
    const fromName = "Obra Limpa";

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: to,
      subject: subject,
      html: html,
    };

    try {
      console.log("Enviando e-mail com as opções:", mailOptions);
      await transporter.sendMail(mailOptions);
      console.log("E-mail enviado com sucesso para:", to);
      // Retorna uma resposta de sucesso clara
      res.status(200).json({ success: true, message: "E-mail enviado com sucesso!" });
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      // Retorna um erro 500 com detalhes
      const err = error as Error;
      res.status(500).json({
        error: {
          message: `Erro interno do servidor: ${err.message}`,
          status: "INTERNAL_ERROR",
        },
      });
    }
  });
});

export const googlePlacesProxy = functions.https.onRequest(async (request, response) => {
    corsHandler(request, response, async () => {
      const { endpoint, ...queryParams } = request.query;

      if (!endpoint || typeof endpoint !== 'string') {
        response.status(400).send('Endpoint is required');
        return;
      }
  
      const apiKey = queryParams.key;
      if (!apiKey) {
        response.status(400).send('API key is required');
        return;
      }
  
      let apiBaseUrl = 'https://maps.googleapis.com/maps/api/place';
      let endpointPath = `/${endpoint}/json`;
  
      if (endpoint === 'geocode') {
        apiBaseUrl = 'https://maps.googleapis.com/maps/api/geocode';
        endpointPath = '/json';
        delete queryParams.endpoint;
      }
  
      const apiUrl = `${apiBaseUrl}${endpointPath}`;
      const url = new URL(apiUrl);
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          url.searchParams.append(key, value);
        }
      });
  
      url.searchParams.append('key', apiKey as string);
  
      try {
        // @ts-ignore
        const apiResponse = await fetch(url.toString());
        const data = await apiResponse.json();
        response.status(apiResponse.status).json(data);
      } catch (error) {
        console.error('Error calling Google Places API:', error);
        response.status(500).send('Internal Server Error');
      }
    });
  });

// Gatilho do Firestore para quando um novo usuário é criado
// COMENTADO: Este gatilho está conflitando com o processo de registro
// O processo de registro já cria o documento do usuário com os dados corretos
/*
export const onUserCreate = functions.auth.user().onCreate(async (user: admin.auth.UserRecord) => {
  try {
    const { uid, email, displayName } = user;
    await admin.firestore().collection('users').doc(uid).set({
      email,
      name: displayName || 'Nome não fornecido',
      role: 'pending', // 'pending', 'worker', 'admin'
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending_invite',
      sites: [],
    });
    console.log(`User document created for ${email} (UID: ${uid})`);
  } catch (error) {
    console.error('Error creating user document:', error);
  }
});
*/

// Gatilho do Firestore para quando um usuário é deletado
export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  try {
    const { uid } = user;
    await admin.firestore().collection('users').doc(uid).delete();
    console.log(`User document deleted for UID: ${uid}`);
  } catch (error) {
    console.error('Error deleting user document:', error);
  }
});

/**
 * Função que envia e-mail automaticamente quando um novo convite é criado no Firestore
 */
export const onInviteCreate = functions.firestore
  .document('invites/{inviteId}')
  .onCreate(async (snap, context) => {
    const invite = snap.data();
    if (!invite || !invite.email) return;

    // Só envia e-mail de admin se o convite for realmente de admin
    if (invite.role !== 'admin') {
      // Se quiser, pode implementar o envio de colaborador aqui
      // Exemplo:
      // if (invite.role === 'worker') { ...enviar e-mail de colaborador... }
      return;
    }

    // Buscar nome do convidador se invitedBy for um ID
    let invitedByName = invite.invitedBy;
    if (invitedByName && invitedByName.length === 28) { // UID do Firebase tem 28 caracteres
      try {
        const userDoc = await admin.firestore().collection('users').doc(invite.invitedBy).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (userData && userData.name) {
            invitedByName = userData.name;
          }
        }
      } catch (e) {
        console.error('Erro ao buscar nome do convidador:', e);
      }
    }

    const subject = '🎯 Convite para Administrador - Obra Limpa';
    const baseUrl = 'http://localhost:8081';
    const inviteUrl = `${baseUrl}/(auth)/register?role=admin&inviteId=${invite.id}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎯 Convite Especial</h1>
          <p style="color: #E0E7FF; margin: 10px 0 0 0; font-size: 16px;">Você foi convidado para ser Administrador</p>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <div style="background-color: #F8FAFC; padding: 25px; border-radius: 12px; border-left: 5px solid #2563EB; margin-bottom: 25px;">
            <h2 style="color: #1F2937; margin: 0 0 15px 0; font-size: 22px;">🚀 Parabéns!</h2>
            <p style="color: #6B7280; line-height: 1.6; margin: 0; font-size: 16px;">
              Você foi selecionado para assumir uma posição de <strong>Administrador</strong> no sistema Obra Limpa. 
              Esta é uma oportunidade única para liderar e gerenciar projetos de construção com excelência.
            </p>
          </div>
          <div style="background-color: #FEFEFE; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">📋 Detalhes do Convite</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #F3F4F6; color: #6B7280;"><strong>🏗️ Obra:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #F3F4F6; color: #1F2937;">${invite.siteName || ''}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #F3F4F6; color: #6B7280;"><strong>👤 Convidado por:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #F3F4F6; color: #1F2937;">${invitedByName || ''}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #F3F4F6; color: #6B7280;"><strong>🎯 Função:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #F3F4F6; color: #1F2937;">
                  <span style="background-color: #DBEAFE; color: #1E40AF; padding: 4px 8px; border-radius: 4px; font-weight: bold;">Administrador</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280;"><strong>🔑 Código do Convite:</strong></td>
                <td style="padding: 8px 0; color: #1F2937; font-family: monospace; background-color: #F3F4F6; padding: 4px 8px; border-radius: 4px;">${invite.id}</td>
              </tr>
            </table>
          </div>
          <div style="background-color: #F0F9FF; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #1E40AF; margin: 0 0 15px 0; font-size: 18px;">✨ Benefícios de ser Administrador</h3>
            <ul style="color: #1E40AF; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>Gerenciar equipes e projetos</li>
              <li>Acesso completo ao sistema</li>
              <li>Relatórios detalhados de progresso</li>
              <li>Controle total sobre tarefas e prazos</li>
              <li>Dashboard administrativo avançado</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}"
              style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.25); transition: all 0.3s ease;">
              🚀 Aceitar Convite de Administrador
            </a>
          </div>
          <div style="background-color: #F8FAFC; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">📝 Como aceitar o convite:</h4>
            <ol style="color: #6B7280; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>Clique no botão "Aceitar Convite de Administrador" acima</li>
              <li>Complete seu cadastro com seus dados pessoais</li>
              <li>Use o código de convite fornecido: <strong>${invite.id}</strong></li>
              <li>Configure sua senha de acesso</li>
              <li>Comece a gerenciar sua obra com excelência!</li>
            </ol>
          </div>
          <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 20px 0;">
            🔗 Ou acesse diretamente: <a href="${inviteUrl}" style="color: #2563EB; text-decoration: underline;">${inviteUrl}</a>
          </p>
          <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; text-align: center;">
            <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
              ⏰ Este convite expira em 7 dias. Se você não esperava este convite, pode ignorá-lo com segurança.
            </p>
            <p style="color: #9CA3AF; font-size: 12px; margin: 10px 0 0 0;">
              🏗️ <strong>Obra Limpa</strong> - Gerenciamento inteligente de obras de construção
            </p>
          </div>
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"Obra Limpa" <${gmailConfig.user}>`,
        to: invite.email,
        subject,
        html,
      });
      console.log('Convite enviado para:', invite.email);
    } catch (error) {
      console.error('Erro ao enviar convite por e-mail:', error);
    }
  });
