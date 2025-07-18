import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Task } from './TaskService';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export class PDFService {
  static async generateTaskPDF(task: Task): Promise<string> {
    let photosBase64: string[] = [];
    if (task.photos && task.photos.length > 0) {
      photosBase64 = await Promise.all(task.photos.map(async (url, idx) => {
        try {
          if (Platform.OS === 'web') {
            const response = await fetch(url);
            const blob = await response.blob();
            return await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const result = reader.result as string;
                resolve(result);
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } else {
            const localUri = url.startsWith('file://') ? url : undefined;
            let fileUri = localUri;
            if (!fileUri) {
              const downloadResumable = FileSystem.createDownloadResumable(
                url,
                FileSystem.cacheDirectory + `pdfimg_${Date.now()}_${idx}.jpg`
              );
              const downloadResult = await downloadResumable.downloadAsync();
              fileUri = downloadResult?.uri;
            }
            if (fileUri) {
              const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
              const mime = url.endsWith('.png') ? 'image/png' : 'image/jpeg';
              const dataUrl = `data:${mime};base64,${base64}`;
              return dataUrl;
            }
            return '';
          }
        } catch (e) {
          console.error('Erro ao converter imagem para base64:', url, e);
          return '';
        }
      }));
      photosBase64 = photosBase64.filter(b64 => b64 && b64.length > 100).slice(0, 1);
    }
    if (Platform.OS === 'web') {
      // Geração de PDF no web usando html2pdf.js via CDN
      // @ts-ignore
      const html2pdf = (window as any).html2pdf;
      if (!html2pdf) {
        alert('html2pdf.js não está disponível. Verifique se o script CDN está incluso em public/index.html.');
        return '';
      }
      // Montar HTML simples para exportação
      let html = `<div style='font-family: Arial, sans-serif; padding: 24px; max-width: 600px;'>`;
      html += `<h2>Tarefa: ${task.title}</h2>`;
      html += `<p><b>Descrição:</b> ${task.description || '-'}</p>`;
      html += `<p><b>Status:</b> ${task.status}</p>`;
      html += `<p><b>Prioridade:</b> ${task.priority}</p>`;
      html += `<p><b>Responsável:</b> ${task.assignedTo || '-'}</p>`;
      html += `<p><b>Área:</b> ${task.area || '-'}</p>`;
      html += `<p><b>Data de Criação:</b> ${task.createdAt}</p>`;
      html += `<p><b>Última Atualização:</b> ${task.updatedAt}</p>`;
      if (photosBase64.length > 0) {
        html += `<div style='margin: 16px 0;'><b>Foto:</b><br/><img src='${photosBase64[0]}' style='max-width: 350px; max-height: 250px; border-radius: 8px; border: 1px solid #ccc;'/></div>`;
      }
      if (task.comments && task.comments.length > 0) {
        html += `<div style='margin-top: 24px;'><b>Comentários:</b><ul style='padding-left: 18px;'>`;
        task.comments.forEach(comment => {
          html += `<li><b>${comment.userName || 'Usuário'}:</b> ${comment.text} <span style='color: #888; font-size: 11px;'>${comment.timestamp || ''}</span></li>`;
        });
        html += `</ul></div>`;
      }
      html += `</div>`;
      // Gerar e baixar PDF
      html2pdf().from(html).set({
        margin: 10,
        filename: `Tarefa_${task.title.replace(/\s+/g, '_')}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).save();
      return '';
    }
    // Mobile: manter expo-print
    const htmlContent = this.generateTaskHTML(task, photosBase64);
    try {
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });
      return uri;
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw new Error('Falha ao gerar PDF da tarefa');
    }
  }

  static async shareTaskPDF(task: Task): Promise<void> {
    try {
      const pdfUri = await this.generateTaskPDF(task);
      if (Platform.OS === 'web') {
        // Forçar download no navegador
        const link = document.createElement('a');
        link.href = pdfUri;
        link.download = `Tarefa_${task.title.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Tarefa: ${task.title}`,
          UTI: 'com.adobe.pdf'
        });
      } else {
        console.log('Compartilhamento não disponível nesta plataforma');
      }
    } catch (error) {
      console.error('Erro ao compartilhar PDF:', error);
      throw new Error('Falha ao compartilhar PDF da tarefa');
    }
  }

  private static generateTaskHTML(task: Task, photosBase64?: string[]): string {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getStatusText = (status: string) => {
      const statusMap: { [key: string]: string } = {
        'pending': 'Pendente',
        'in_progress': 'Em Progresso',
        'completed': 'Concluída',
        'delayed': 'Atrasada'
      };
      return statusMap[status] || status;
    };

    const getPriorityText = (priority: string) => {
      const priorityMap: { [key: string]: string } = {
        'high': 'Alta',
        'medium': 'Média',
        'low': 'Baixa'
      };
      return priorityMap[priority] || priority;
    };

    const getStatusColor = (status: string) => {
      const colorMap: { [key: string]: string } = {
        'pending': '#F59E0B',
        'in_progress': '#3B82F6',
        'completed': '#10B981',
        'delayed': '#EF4444'
      };
      return colorMap[status] || '#6B7280';
    };

    const getPriorityColor = (priority: string) => {
      const colorMap: { [key: string]: string } = {
        'high': '#EF4444',
        'medium': '#F59E0B',
        'low': '#10B981'
      };
      return colorMap[priority] || '#6B7280';
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Tarefa: ${task.title}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
            color: #333;
            line-height: 1.6;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
            background-color: white;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
          }
          .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 700;
            position: relative;
            z-index: 1;
          }
          .header-subtitle {
            margin-top: 8px;
            font-size: 16px;
            opacity: 0.9;
            position: relative;
            z-index: 1;
          }
          .content {
            padding: 40px;
          }
          .section {
            margin-bottom: 40px;
          }
          .section-title {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 3px solid #667eea;
            position: relative;
          }
          .section-title::after {
            content: '';
            position: absolute;
            bottom: -3px;
            left: 0;
            width: 60px;
            height: 3px;
            background: linear-gradient(90deg, #667eea, #764ba2);
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 24px;
            margin-bottom: 30px;
          }
          .info-item {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 24px;
            border-radius: 12px;
            border-left: 4px solid #667eea;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            transition: transform 0.2s ease;
          }
          .info-item:hover {
            transform: translateY(-2px);
          }
          .info-label {
            font-size: 14px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          .info-value {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
          }
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .priority-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .description {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 30px;
            border-radius: 16px;
            border-left: 6px solid #667eea;
            line-height: 1.8;
            font-size: 16px;
            color: #374151;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }
          .photos-section {
            margin-top: 30px;
          }
          .photos-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 24px;
            margin-top: 20px;
          }
          .photo-item {
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
          }
          .photo-item:hover {
            transform: translateY(-4px);
          }
          .photo-item img {
            width: 100%;
            height: 250px;
            object-fit: cover;
            border-radius: 16px 16px 0 0;
          }
          .photo-caption {
            padding: 16px;
            text-align: center;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          }
          .photo-caption-text {
            font-size: 14px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .comments-section {
            margin-top: 30px;
          }
          .comment-item {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 24px;
            border-radius: 16px;
            margin-bottom: 16px;
            border-left: 4px solid #667eea;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }
          .comment-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
          }
          .comment-user {
            font-weight: 700;
            color: #1e293b;
            font-size: 16px;
          }
          .comment-date {
            font-size: 14px;
            color: #64748b;
            font-weight: 500;
          }
          .comment-text {
            color: #475569;
            line-height: 1.7;
            font-size: 15px;
          }
          .footer {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            padding: 30px;
            text-align: center;
            color: #cbd5e1;
          }
          .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 600px;
            margin: 0 auto;
          }
          .footer-info {
            text-align: left;
          }
          .footer-brand {
            text-align: right;
          }
          .footer-title {
            font-size: 18px;
            font-weight: 700;
            color: #f1f5f9;
            margin-bottom: 4px;
          }
          .footer-text {
            font-size: 14px;
            color: #94a3b8;
          }
          .no-content {
            text-align: center;
            padding: 40px;
            color: #64748b;
            font-style: italic;
          }
          .no-content-icon {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.5;
          }
          @media print {
            body {
              background-color: white;
            }
            .container {
              box-shadow: none;
              border: 1px solid #e2e8f0;
            }
            .header::before {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${task.title}</h1>
            <div class="header-subtitle">Relatório Completo da Tarefa</div>
          </div>
          
          <div class="content">
            <div class="section">
              <div class="section-title">📋 Informações Gerais</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Status</div>
                  <div class="info-value">
                    <span class="status-badge" style="background-color: ${getStatusColor(task.status)}; color: white;">
                      ${getStatusText(task.status)}
                    </span>
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">Prioridade</div>
                  <div class="info-value">
                    <span class="priority-badge" style="background-color: ${getPriorityColor(task.priority)}; color: white;">
                      ${getPriorityText(task.priority)}
                    </span>
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">Responsável</div>
                  <div class="info-value">${task.assignedTo || 'Não atribuído'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Área</div>
                  <div class="info-value">${task.area || 'Não especificada'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Data de Criação</div>
                  <div class="info-value">${formatDate(task.createdAt)}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Última Atualização</div>
                  <div class="info-value">${formatDate(task.updatedAt)}</div>
                </div>
                ${task.dueDate ? `
                <div class="info-item">
                  <div class="info-label">Data de Vencimento</div>
                  <div class="info-value">${formatDate(task.dueDate)}</div>
                </div>
                ` : ''}
                ${task.completedAt ? `
                <div class="info-item">
                  <div class="info-label">Data de Conclusão</div>
                  <div class="info-value">${formatDate(task.completedAt)}</div>
                </div>
                ` : ''}
              </div>
            </div>

            <div class="section">
              <div class="section-title">📝 Descrição</div>
              <div class="description">
                ${task.description || 'Nenhuma descrição fornecida para esta tarefa.'}
              </div>
            </div>

            ${photosBase64 && photosBase64.length > 0 ? `
            <div class="section photos-section">
              <div class="section-title">📸 Documentação Visual (${photosBase64.length} foto${photosBase64.length !== 1 ? 's' : ''})</div>
              <div class="photos-grid">
                ${photosBase64.map((photo, index) => `
                  <div class="photo-item">
                    <img src="${photo}" alt="Documentação ${index + 1}" />
                    <div class="photo-caption">
                      <div class="photo-caption-text">Documentação ${index + 1}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            ` : `
            <div class="section photos-section">
              <div class="section-title">📸 Documentação Visual</div>
              <div class="no-content">
                <div class="no-content-icon">📷</div>
                <div>Nenhuma foto anexada a esta tarefa</div>
              </div>
            </div>
            `}

            ${task.comments && task.comments.length > 0 ? `
            <div class="section comments-section">
              <div class="section-title">💬 Comentários (${task.comments.length})</div>
              ${task.comments.map(comment => `
                <div class="comment-item">
                  <div class="comment-header">
                    <span class="comment-user">${comment.userName || 'Usuário'}</span>
                    <span class="comment-date">${formatDate(comment.timestamp)}</span>
                  </div>
                  <div class="comment-text">${comment.text}</div>
                </div>
              `).join('')}
            </div>
            ` : `
            <div class="section comments-section">
              <div class="section-title">💬 Comentários</div>
              <div class="no-content">
                <div class="no-content-icon">💬</div>
                <div>Nenhum comentário adicionado a esta tarefa</div>
              </div>
            </div>
            `}
          </div>

          <div class="footer">
            <div class="footer-content">
              <div class="footer-info">
                <div class="footer-title">Documento Gerado</div>
                <div class="footer-text">${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>
              </div>
              <div class="footer-brand">
                <div class="footer-title">🏗️ Obra Limpa</div>
                <div class="footer-text">Sistema de Gestão de Tarefas</div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
} 