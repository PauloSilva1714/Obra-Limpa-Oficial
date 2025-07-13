/**
 * Tela de Progresso - Layout Estilo Rede Social
 * 
 * Esta tela foi transformada em um layout estilo rede social onde:
 * - As tarefas são exibidas como cards com fotos em destaque
 * - Cada card mostra: status, prioridade, foto principal, título, descrição
 * - Informações como área, responsável e data de vencimento
 * - Botão "Ver Detalhes" para acessar a tarefa completa
 * - Layout responsivo e moderno similar ao Instagram/Facebook
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChartBar as BarChart3, TrendingUp, Clock, CircleCheck as CheckCircle, RefreshCw, Eye, Calendar, User, MapPin } from 'lucide-react-native';
import { ProgressService, ProgressData } from '@/services/ProgressService';
import taskService, { Task } from '@/services/TaskService';
import { router } from 'expo-router';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  const [progressData, setProgressData] = useState<ProgressData>({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
    completionRate: 0,
    weeklyProgress: [],
    areaProgress: [],
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      const [progress, tasksData] = await Promise.all([
        ProgressService.getInstance().getProgressData(),
        taskService.getTasks()
      ]);
      
      setProgressData(progress);
      setTasks(tasksData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#F59E0B';
      case 'delayed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'in_progress': return 'Em Andamento';
      case 'delayed': return 'Atrasada';
      default: return 'Pendente';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      default: return '#10B981';
    }
  };

  const getPriorityText = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      default: return 'Baixa';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Cálculo dos status diretamente das tarefas carregadas
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending' || !t.status).length;
  const totalTasks = tasks.length;

  // Função para criar o gráfico de pizza
  const createPieChart = () => {
    const size = 200;
    const radius = size / 2;
    const center = size / 2;
    
    const data = [
      { value: completedTasks, color: '#10B981', label: 'Concluídas' },
      { value: inProgressTasks, color: '#F59E0B', label: 'Em Andamento' },
      { value: pendingTasks, color: '#6B7280', label: 'Pendentes' },
    ].filter(item => item.value > 0);

    if (totalTasks === 0) {
      return (
        <View style={styles.emptyChartContainer}>
          <Text style={styles.emptyChartText}>Nenhuma tarefa encontrada</Text>
        </View>
      );
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;

    const segments = data.map((item, index) => {
      const percentage = item.value / total;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      return (
        <Circle
          key={index}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={item.color}
          strokeWidth={40}
          strokeDasharray={`${percentage * 2 * Math.PI * radius} ${2 * Math.PI * radius}`}
          strokeDashoffset={-startAngle * Math.PI / 180 * radius}
          transform={`rotate(-90 ${center} ${center})`}
        />
      );
    });

    return (
      <View style={styles.chartContainer}>
        <Svg width={size} height={size}>
          {segments}
          {/* Círculo central branco */}
          <Circle
            cx={center}
            cy={center}
            r={radius - 20}
            fill="#FFFFFF"
          />
          {/* Texto central */}
          <SvgText
            x={center}
            y={center - 10}
            fontSize="24"
            fontWeight="bold"
            textAnchor="middle"
            fill="#111827"
          >
            {totalTasks}
          </SvgText>
          <SvgText
            x={center}
            y={center + 15}
            fontSize="14"
            textAnchor="middle"
            fill="#6B7280"
          >
            Total
          </SvgText>
        </Svg>
        {/* Legenda */}
        <View style={styles.legendContainer}>
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>
                {item.label}: {item.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTaskCard = (task: Task) => {
    const mainPhoto = task.photos && task.photos.length > 0 ? task.photos[0] : 'https://placehold.co/600x400?text=Sem+Foto';
    
    return (
      <View key={task.id} style={styles.taskCard}>
        {/* Cabeçalho do card */}
        <View style={styles.taskHeader}>
          <View style={styles.taskHeaderLeft}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}> 
              <Text style={styles.statusText}>{getStatusText(task.status)}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}> 
              <Text style={styles.priorityText}>{getPriorityText(task.priority)}</Text>
            </View>
          </View>
          <Text style={styles.taskDate}>{formatDate(task.createdAt)}</Text>
        </View>

        {/* Foto principal */}
        <View style={styles.photoContainer}>
          <Image 
            source={{ uri: mainPhoto }} 
            style={styles.mainPhoto}
            resizeMode="cover"
          />
          {task.photos && task.photos.length > 1 && (
            <View style={styles.photoCountBadge}>
              <Text style={styles.photoCountText}>+{task.photos.length - 1}</Text>
            </View>
          )}
        </View>

        {/* Conteúdo do card */}
        <View style={styles.taskContent}>
          <Text style={styles.taskTitle} numberOfLines={2}>{task.title}</Text>
          <Text style={styles.taskDescription} numberOfLines={3}>{task.description}</Text>
          
          {/* Informações da tarefa */}
          <View style={styles.taskInfo}>
            <View style={styles.taskInfoItem}>
              <MapPin size={16} color="#6B7280" />
              <Text style={styles.taskInfoText}>{task.area}</Text>
            </View>
            
            {task.assignedTo && (
              <View style={styles.taskInfoItem}>
                <User size={16} color="#6B7280" />
                <Text style={styles.taskInfoText}>{task.assignedTo}</Text>
              </View>
            )}
            
            {task.dueDate && (
              <View style={styles.taskInfoItem}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.taskInfoText}>Vence: {formatDate(task.dueDate)}</Text>
              </View>
            )}
          </View>

          {/* Botão de ver detalhes */}
          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={() => router.push(`/admin/tasks/${task.id}`)}
          >
            <Eye size={16} color="#FFFFFF" />
            <Text style={styles.detailsButtonText}>Ver Detalhes</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando tarefas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Progresso da Obra</Text>
          <View style={styles.completionContainer}>
            <Text style={styles.completionRate}>{progressData.completionRate}%</Text>
            <Text style={styles.completionLabel}>Concluído</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={20} color="#6B7280" style={refreshing ? { opacity: 0.5 } : undefined} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {/* Gráfico de Pizza */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Distribuição por Status</Text>
          {createPieChart()}
        </View>

        <View style={styles.tasksContainer}>
          <Text style={styles.sectionTitle}>Tarefas Recentes</Text>
          {tasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhuma tarefa encontrada</Text>
              <Text style={styles.emptySubtext}>As tarefas aparecerão aqui quando forem criadas</Text>
            </View>
          ) : (
            tasks.map(renderTaskCard)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  completionContainer: {
    alignItems: 'flex-end',
  },
  completionRate: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F97316',
  },
  completionLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  chartSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  tasksContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    padding: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  priorityBadge: {
    padding: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  taskDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  mainPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  photoCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  photoCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  taskInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  taskInfoText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F97316',
    marginTop: 8,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginLeft: 16,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyChartContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyChartText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});