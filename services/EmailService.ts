import { app } from '../config/firebase';
import { getFunctions } from "firebase/functions";
import { User } from './AuthService';
import { functions } from '../config/firebase';
import { AuthService } from './AuthService';

getFunctions(app, 'southamerica-east1');

// URL da sua Cloud Function (v1) - a versão estável e correta
const EMAIL_FUNCTION_URL = 'https://us-central1-bralimpa2.cloudfunctions.net/sendEmailV1';

// Em um ambiente de desenvolvimento (localhost), usamos um proxy para contornar o CORS.
// Em produção, a função pode ser chamada diretamente.
// No entanto, vamos manter a lógica de proxy por enquanto para garantir consistência.
// const IS_DEV = __DEV__;
// const API_URL = IS_DEV
//   ? `http://localhost:5001/bralimpa2/southamerica-east1/sendEmailV2`
//   : EMAIL_FUNCTION_URL;

export interface EmailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const EmailService = {
  /**
   * Envia um e-mail genérico usando a Cloud Function.
   */
  async sendEmail(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      // Cria um payload final estritamente com os campos permitidos
      const finalPayload = {
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html || '', // Garante que html seja sempre uma string
      };

      // Log do payload exato que será enviado

      const response = await fetch(EMAIL_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalPayload),
      });

      // Se a resposta não for OK, tenta extrair o JSON do corpo para o log
      if (!response.ok) {
        let errorData = { error: { message: `Erro HTTP ${response.status}` } };
        try {
          errorData = await response.json();
        } catch (e) {
          // O corpo da resposta pode não ser um JSON válido, ignore o erro de parse
        }
        // Log aprimorado para mostrar o erro completo do servidor
        :`, JSON.stringify(errorData, null, 2));
        throw new Error(errorData.error?.message || 'Erro desconhecido ao enviar e-mail.');
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Confirmação de criação de tarefa
   */
  async sendTaskCreationConfirmation(
    user: User,
    taskData: {
      title: string;
      description: string;
      assignedTo: string | string[];
      dueDate?: string;
      area: string;
      priority: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    if (user.notifications?.taskCreation === false) {
      return { success: true, error: 'User opted out of this notification.' };
    }
    const dueDateText = taskData.dueDate 
      ? new Date(taskData.dueDate).toLocaleDateString('pt-BR')
      : 'Não definida';

    const assignedToText = Array.isArray(taskData.assignedTo) 
      ? taskData.assignedTo.join(', ') 
      : taskData.assignedTo;

    return this.sendEmail({
      to: user.email,
      subject: `Tarefa Criada: ${taskData.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563EB;">✅ Tarefa Criada com Sucesso</h2>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">${taskData.title}</h3>
            <p style="color: #6b7280; line-height: 1.6;">${taskData.description}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Designado para:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${assignedToText}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Data de vencimento:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${dueDateText}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Área:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${taskData.area}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Prioridade:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
                <span style="
                  padding: 4px 8px; 
                  border-radius: 4px; 
                  font-size: 12px; 
                  font-weight: bold;
                  background-color: ${taskData.priority === 'high' ? '#fee2e2' : taskData.priority === 'medium' ? '#fef3c7' : '#dcfce7'};
                  color: ${taskData.priority === 'high' ? '#dc2626' : taskData.priority === 'medium' ? '#d97706' : '#16a34a'};
                ">
                  ${taskData.priority === 'high' ? 'Alta' : taskData.priority === 'medium' ? 'Média' : 'Baixa'}
                </span>
              </td>
            </tr>
          </table>
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            Acesse o app Obra Limpa para acompanhar o progresso desta tarefa.
          </p>
        </div>
      `
    });
  },

  /**
   * Confirmação de atualização de tarefa
   */
  async sendTaskUpdateConfirmation(
    user: User,
    taskData: {
      title: string;
      status: string;
      updatedBy: string;
      changes: string[];
    }
  ): Promise<{ success: boolean; error?: string }> {
    if (user.notifications?.taskUpdate === false) {
      return { success: true, error: 'User opted out of this notification.' };
    }
    const statusText = {
      'pending': 'Pendente',
      'in_progress': 'Em Andamento',
      'completed': 'Concluída'
    }[taskData.status] || taskData.status;

    return this.sendEmail({
      to: user.email,
      subject: `Tarefa Atualizada: ${taskData.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563EB;">📝 Tarefa Atualizada</h2>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">${taskData.title}</h3>
            <p><strong>Status:</strong> ${statusText}</p>
            <p><strong>Atualizado por:</strong> ${taskData.updatedBy}</p>
          </div>
          <h4 style="color: #374151;">Alterações realizadas:</h4>
          <ul style="color: #6b7280; line-height: 1.6;">
            ${taskData.changes.map(change => `<li>${change}</li>`).join('')}
          </ul>
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            Acesse o app Obra Limpa para ver os detalhes completos.
          </p>
        </div>
      `
    });
  },

  /**
   * Confirmação de login
   */
  async sendLoginConfirmation(
    user: User,
    loginData: {
      loginTime: string;
      deviceInfo?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    
    if (user.notifications?.loginConfirmation === false) {
      return { success: true, error: 'User opted out of this notification.' };
    }
    
    // Tratar campos vazios ou undefined
    const userName = user.name || 'Nome não fornecido';
    const userCompany = user.company || 'Não informada';

    return this.sendEmail({
      to: user.email,
      subject: "Login Confirmado - Obra Limpa",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">🔐 Login Confirmado</h2>
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="color: #1f2937; margin-top: 0;">Bem-vindo de volta!</h3>
            <p><strong>Usuário:</strong> ${userName}</p>
            <p><strong>Empresa:</strong> ${userCompany}</p>
            <p><strong>Horário do login:</strong> ${loginData.loginTime}</p>
            ${loginData.deviceInfo ? `<p><strong>Dispositivo:</strong> ${loginData.deviceInfo}</p>` : ''}
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Se você não realizou este login, entre em contato com o administrador imediatamente.
          </p>
        </div>
      `
    });
  },

  /**
   * Envia notificação de nova tarefa
   */
  async sendTaskNotification(
    userEmail: string, 
    taskTitle: string, 
    taskDescription: string,
    assignedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to: userEmail,
      subject: `Nova Tarefa: ${taskTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563EB;">📋 Nova Tarefa Designada</h2>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">${taskTitle}</h3>
            <p style="color: #6b7280; line-height: 1.6;">${taskDescription}</p>
            <p><strong>Designado por:</strong> ${assignedBy}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Acesse o app Obra Limpa para ver os detalhes e começar a trabalhar.
          </p>
        </div>
      `
    });
  },

  /**
   * Envia notificação de conclusão de tarefa
   */
  async sendTaskCompletionNotification(
    adminEmail: string,
    taskTitle: string,
    completedBy: string,
    completionDate: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to: adminEmail,
      subject: `Tarefa Concluída: ${taskTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">✅ Tarefa Concluída</h2>
          <p><strong>Tarefa:</strong> ${taskTitle}</p>
          <p><strong>Concluída por:</strong> ${completedBy}</p>
          <p><strong>Data de conclusão:</strong> ${completionDate}</p>
          <p>Acesse o app Obra Limpa para verificar os detalhes.</p>
        </div>
      `
    });
  },

  /**
   * Envia relatório diário de tarefas
   */
  async sendDailyReport(
    adminEmail: string,
    reportData: {
      totalTasks: number;
      completedTasks: number;
      pendingTasks: number;
      inProgressTasks: number;
    }
  ): Promise<{ success: boolean; error?: string }> {
    const completionRate = reportData.totalTasks > 0 
      ? Math.round((reportData.completedTasks / reportData.totalTasks) * 100) 
      : 0;

    return this.sendEmail({
      to: adminEmail,
      subject: "Relatório Diário - Obra Limpa",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563EB;">📊 Relatório Diário</h2>
          <table style="border-collapse: collapse; width: 100%;">
            <tr style="background-color: #f3f4f6;">
              <td style="padding: 8px; border: 1px solid #d1d5db;"><strong>Total de Tarefas</strong></td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${reportData.totalTasks}</td>
            </tr>
            <tr style="background-color: #dcfce7;">
              <td style="padding: 8px; border: 1px solid #d1d5db;"><strong>Concluídas</strong></td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${reportData.completedTasks}</td>
            </tr>
            <tr style="background-color: #fef3c7;">
              <td style="padding: 8px; border: 1px solid #d1d5db;"><strong>Em Andamento</strong></td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${reportData.inProgressTasks}</td>
            </tr>
            <tr style="background-color: #fee2e2;">
              <td style="padding: 8px; border: 1px solid #d1d5db;"><strong>Pendentes</strong></td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${reportData.pendingTasks}</td>
            </tr>
          </table>
          <p style="margin-top: 16px;"><strong>Taxa de Conclusão:</strong> ${completionRate}%</p>
        </div>
      `
    });
  },

  /**
   * Envia convite de administrador
   */
  async sendAdminInvite(
    inviteData: {
      email: string;
      siteName: string;
      invitedBy: string;
      inviteId: string;
    }
  ): Promise<{ success: boolean; error?: string }> {

    // Determinar a URL base baseada no ambiente
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://obra-limpa.vercel.app'; // URL de produção como fallback
    
    const inviteUrl = `${baseUrl}/(auth)/register?role=admin&inviteId=${inviteData.inviteId}`;
    
    const emailPayload = {
      to: inviteData.email,
      subject: `🎯 Convite para Administrador - Obra Limpa`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎯 Convite Especial</h1>
            <p style="color: #E0E7FF; margin: 10px 0 0 0; font-size: 16px;">Você foi convidado para ser Administrador</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 30px; background-color: #ffffff;">
            <div style="background-color: #F8FAFC; padding: 25px; border-radius: 12px; border-left: 5px solid #2563EB; margin-bottom: 25px;">
              <h2 style="color: #1F2937; margin: 0 0 15px 0; font-size: 22px;">🚀 Parabéns!</h2>
              <p style="color: #6B7280; line-height: 1.6; margin: 0; font-size: 16px;">
                Você foi selecionado para assumir uma posição de <strong>Administrador</strong> no sistema Obra Limpa. 
                Esta é uma oportunidade única para liderar e gerenciar projetos de construção com excelência.
              </p>
            </div>

            <!-- Details Card -->
            <div style="background-color: #FEFEFE; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">📋 Detalhes do Convite</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F3F4F6; color: #6B7280;"><strong>🏗️ Obra:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F3F4F6; color: #1F2937;">${inviteData.siteName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F3F4F6; color: #6B7280;"><strong>👤 Convidado por:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F3F4F6; color: #1F2937;">${inviteData.invitedBy}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F3F4F6; color: #6B7280;"><strong>🎯 Função:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F3F4F6; color: #1F2937;">
                    <span style="background-color: #DBEAFE; color: #1E40AF; padding: 4px 8px; border-radius: 4px; font-weight: bold;">Administrador</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6B7280;"><strong>🔑 Código do Convite:</strong></td>
                  <td style="padding: 8px 0; color: #1F2937; font-family: monospace; background-color: #F3F4F6; padding: 4px 8px; border-radius: 4px;">${inviteData.inviteId}</td>
                </tr>
              </table>
            </div>

            <!-- Benefits Section -->
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

            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" style="
                display: inline-block;
                background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
                color: white;
                padding: 16px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                font-size: 16px;
                box-shadow: 0 4px 6px rgba(37, 99, 235, 0.25);
                transition: all 0.3s ease;
              ">
                🚀 Aceitar Convite de Administrador
              </a>
            </div>

            <!-- Instructions -->
            <div style="background-color: #F8FAFC; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h4 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">📝 Como aceitar o convite:</h4>
              <ol style="color: #6B7280; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Clique no botão "Aceitar Convite de Administrador" acima</li>
                <li>Complete seu cadastro com seus dados pessoais</li>
                <li>Use o código de convite fornecido: <strong>${inviteData.inviteId}</strong></li>
                <li>Configure sua senha de acesso</li>
                <li>Comece a gerenciar sua obra com excelência!</li>
              </ol>
            </div>

            <!-- Alternative Link -->
            <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 20px 0;">
              🔗 Ou acesse diretamente: <a href="${inviteUrl}" style="color: #2563EB; text-decoration: underline;">${inviteUrl}</a>
            </p>

            <!-- Footer -->
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
      `
    };

    return this.sendEmail(emailPayload);
  },

  /**
   * Envia convite de colaborador
   */
  async sendWorkerInvite(
    inviteData: {
      email: string;
      siteName: string;
      invitedBy: string;
      inviteId: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    // Determinar a URL base baseada no ambiente
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://obra-limpa.vercel.app'; // URL de produção como fallback
    
    const inviteUrl = `${baseUrl}/(auth)/register?role=worker&inviteId=${inviteData.inviteId}`;
    
    return this.sendEmail({
      to: inviteData.email,
      subject: `👷 Convite para Colaborador - Obra Limpa`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #059669 0%, #10B981 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">👷 Convite Especial</h1>
            <p style="color: #D1FAE5; margin: 10px 0 0 0; font-size: 16px;">Você foi convidado para ser Colaborador(a)</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 30px; background-color: #ffffff;">
            <div style="background-color: #F0FDF4; padding: 25px; border-radius: 12px; border-left: 5px solid #059669; margin-bottom: 25px;">
              <h2 style="color: #065F46; margin: 0 0 15px 0; font-size: 22px;">🚀 Bem-vindo!</h2>
              <p style="color: #6B7280; line-height: 1.6; margin: 0; font-size: 16px;">
                Você foi selecionado para colaborar na obra <strong>${inviteData.siteName}</strong> no sistema Obra Limpa.
                Participe da equipe, registre seu progresso e contribua para o sucesso do projeto!
              </p>
            </div>

            <!-- Details Card -->
            <div style="background-color: #FEFEFE; border: 1px solid #D1FAE5; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #047857; margin: 0 0 15px 0; font-size: 18px;">📋 Detalhes do Convite</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F3F4F6; color: #6B7280;"><strong>🏗️ Obra:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F3F4F6; color: #1F2937;">${inviteData.siteName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F3F4F6; color: #6B7280;"><strong>👤 Convidado por:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F3F4F6; color: #1F2937;">${inviteData.invitedBy}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F3F4F6; color: #6B7280;"><strong>🎯 Função:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F3F4F6; color: #1F2937;">
                    <span style="background-color: #D1FAE5; color: #047857; padding: 4px 8px; border-radius: 4px; font-weight: bold;">Colaborador(a)</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6B7280;"><strong>🔑 Código do Convite:</strong></td>
                  <td style="padding: 8px 0; color: #1F2937; font-family: monospace; background-color: #F3F4F6; padding: 4px 8px; border-radius: 4px;">${inviteData.inviteId}</td>
                </tr>
              </table>
            </div>

            <!-- Benefits Section -->
            <div style="background-color: #ECFDF5; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="color: #047857; margin: 0 0 15px 0; font-size: 18px;">✨ Benefícios de ser Colaborador</h3>
              <ul style="color: #047857; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Participar ativamente do progresso da obra</li>
                <li>Registrar tarefas e atividades realizadas</li>
                <li>Comunicação direta com a equipe</li>
                <li>Acesso ao histórico de tarefas</li>
                <li>Reconhecimento pelo seu trabalho</li>
              </ul>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" style="
                display: inline-block;
                background: linear-gradient(135deg, #059669 0%, #10B981 100%);
                color: white;
                padding: 16px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                font-size: 16px;
                box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);
                transition: all 0.3s ease;
              ">
                👷 Aceitar Convite de Colaborador
              </a>
            </div>

            <!-- Instructions -->
            <div style="background-color: #F8FAFC; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h4 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">📝 Como aceitar o convite:</h4>
              <ol style="color: #6b7280; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Clique no botão "Aceitar Convite de Colaborador" acima</li>
                <li>Complete seu cadastro com seus dados pessoais</li>
                <li>Use o código de convite fornecido: <strong>${inviteData.inviteId}</strong></li>
                <li>Comece a colaborar na obra!</li>
              </ol>
            </div>

            <!-- Alternative Link -->
            <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 20px 0;">
              🔗 Ou acesse diretamente: <a href="${inviteUrl}" style="color: #059669; text-decoration: underline;">${inviteUrl}</a>
            </p>

            <!-- Footer -->
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
      `
    });
  },
};