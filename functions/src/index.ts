import * as functions from 'firebase-functions/v1';
// import { region } from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import cors from 'cors';
import fetch from 'node-fetch';

// Usar uma instância de CORS que permite todas as origens para simplificar a depuração
const corsHandler = cors({ origin: true });

admin.initializeApp();

// Criar uma verificação para garantir que as configurações existem antes de criar o transporter
const gmailConfig = functions.config().gmail;
let transporter: nodemailer.Transporter;

// Usar apenas Gmail como serviço de email
if (gmailConfig && gmailConfig.user && gmailConfig.pass) {
  console.log('Configurando Gmail como serviço de email...');
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailConfig.user,
      pass: gmailConfig.pass,
    },
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
    // Alteração simples: comentário para forçar redeploy em 2024-06-07
    const invite = snap.data();
    if (!invite || !invite.email) return;

    const subject = 'Convite para colaborar no Obra Limpa';
    const html = `
      <div style="background:#f4f6fb;padding:32px 0;font-family:sans-serif;">
        <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 2px 8px #0001;padding:32px 24px;">
          <div style="background:#fee2e2;border:2px solid #dc2626;border-radius:8px;padding:16px 0;margin-bottom:24px;text-align:center;">
            <h2 style="color:#dc2626;font-size:1.5rem;margin:0;">ERRO DE TESTE FUNÇÃO FIREBASE</h2>
            <p style="color:#b91c1c;font-size:1rem;margin:0;">Se você está vendo esta mensagem, o e-mail veio da função onInviteCreate!</p>
          </div>
          <div style="text-align:center;margin-bottom:24px;">
            <img src='https://i.imgur.com/2yaf2wb.png' alt='Obra Limpa' style='width:64px;height:64px;border-radius:12px;margin-bottom:8px;' />
            <h2 style="margin:0;color:#1a202c;font-size:1.5rem;">Convite para Colaborador</h2>
          </div>
          <p style="font-size:1.1rem;color:#222;margin-bottom:16px;">Olá,</p>
          <p style="font-size:1.1rem;color:#222;margin-bottom:16px;">
            Você foi convidado para colaborar no canteiro <b>${invite.siteName || ''}</b>.<br/>
            <span style="color:#4a5568;font-size:0.98rem;">(Convite exclusivo para colaboradores)</span>
          </p>
          <div style="background:#f1f5f9;border-radius:8px;padding:16px 12px;margin-bottom:20px;">
            <ul style="padding-left:18px;margin:0;color:#222;font-size:1rem;">
              <li>Tenha acesso ao canteiro e suas tarefas</li>
              <li>Receba notificações e comunicados</li>
              <li>Participe da equipe Obra Limpa</li>
            </ul>
          </div>
          
          <!-- Código do Convite -->
          <div style="background:#f0f9ff;border:2px solid #2563eb;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
            <h3 style="margin:0 0 12px 0;color:#1e40af;font-size:1.1rem;">🔑 Código do Convite</h3>
            <div style="background:#ffffff;border:1px solid #dbeafe;border-radius:6px;padding:12px;margin:0 auto;display:inline-block;">
              <span style="font-family:monospace;font-size:1.2rem;font-weight:bold;color:#1e40af;letter-spacing:1px;">${context.params.inviteId}</span>
            </div>
            <p style="margin:12px 0 0 0;color:#6b7280;font-size:0.9rem;">Use este código ao se cadastrar no aplicativo</p>
          </div>
          
          <div style="text-align:center;margin-bottom:24px;">
            <a href="#" style="display:inline-block;padding:12px 32px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:1.1rem;">Aceitar Convite</a>
          </div>
          
          <!-- Instruções -->
          <div style="background:#f8fafc;border-radius:8px;padding:20px;margin-bottom:20px;">
            <h4 style="margin:0 0 12px 0;color:#374151;font-size:1rem;">📝 Como aceitar o convite:</h4>
            <ol style="color:#6b7280;line-height:1.6;margin:0;padding-left:20px;font-size:0.95rem;">
              <li>Acesse o aplicativo Obra Limpa</li>
              <li>Clique em "Cadastrar" ou "Registrar"</li>
              <li>Preencha seus dados pessoais</li>
              <li>Use o código de convite: <strong>${context.params.inviteId}</strong></li>
              <li>Complete o cadastro e comece a colaborar!</li>
            </ol>
          </div>
          
          <p style="color:#4a5568;font-size:0.98rem;margin-bottom:8px;">Para aceitar o convite, acesse o aplicativo Obra Limpa e registre-se com este e-mail.</p>
          <p style="color:#4a5568;font-size:0.98rem;margin-bottom:0;">Se você não reconhece este convite, pode ignorar este e-mail.</p>
          <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0;"/>
          <div style="text-align:center;color:#a0aec0;font-size:0.95rem;">Equipe Obra Limpa</div>
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

// Forçar redeploy: código do convite adicionado ao e-mail em 2024-12-19
