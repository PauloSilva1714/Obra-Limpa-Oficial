import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Users, ClipboardCheck, Clock, AlertCircle } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import TaskService from '@/services/TaskService';

// Define Task type with status property
type Task = {
  status: string;
  // add other properties if needed
};

interface Stats {
  totalWorkers: number;
  activeWorkers: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
}

export default function StatsScreen() {
  const [stats, setStats] = useState<Stats>({
    totalWorkers: 0,
    activeWorkers: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [siteId, setSiteId] = useState<string | null>(null);

  useEffect(() => {
    AuthService.getCurrentSite().then(site => {
      setSiteId(site?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    const unsubscribeTasks = TaskService.subscribeToTasksBySite(siteId, (tasks) => {
      const completedTasks = tasks.filter((task: Task) => task.status === 'completed');
      const pendingTasks = tasks.filter((task: Task) => task.status === 'pending');
      const inProgressTasks = tasks.filter((task: Task) => task.status === 'in_progress');
      setStats(prev => ({
        ...prev,
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        pendingTasks: pendingTasks.length,
        inProgressTasks: inProgressTasks.length,
      }));
      setLoading(false);
    });
    // Assinar workers em tempo real (se houver método, senão manter getWorkers)
    // Exemplo:
    // const unsubscribeWorkers = AuthService.subscribeToWorkers(siteId, (workers) => {
    //   setStats(prev => ({
    //     ...prev,
    //     totalWorkers: workers.length,
    //     activeWorkers: workers.filter(w => w.status === 'active').length,
    //   }));
    // });
    return () => {
      unsubscribeTasks && unsubscribeTasks();
      // unsubscribeWorkers && unsubscribeWorkers();
    };
  }, [siteId]);

  const StatCard = ({ icon: Icon, value, title }: { icon: any; value: number; title: string }) => (
    <View style={styles.statCard}>
      <Icon size={24} color="#2196F3" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Estatísticas</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Carregando...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Colaboradores</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon={Users}
              value={stats.totalWorkers}
              title="Total"
            />
            <StatCard
              icon={Users}
              value={stats.activeWorkers}
              title="Ativos"
            />
          </View>

          <Text style={styles.sectionTitle}>Tarefas</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon={ClipboardCheck}
              value={stats.totalTasks}
              title="Total"
            />
            <StatCard
              icon={ClipboardCheck}
              value={stats.completedTasks}
              title="Concluídas"
            />
            <StatCard
              icon={Clock}
              value={stats.inProgressTasks}
              title="Em Andamento"
            />
            <StatCard
              icon={AlertCircle}
              value={stats.pendingTasks}
              title="Pendentes"
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 8,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 