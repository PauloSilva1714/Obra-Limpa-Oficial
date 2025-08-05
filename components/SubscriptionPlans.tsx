import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Check,
  Crown,
  Building2,
  Users,
  MessageCircle,
  BarChart3,
  Shield,
  Zap,
} from 'lucide-react-native';
import { SubscriptionService, SubscriptionPlan } from '@/services/SubscriptionService';
import { useTheme } from '@/contexts/ThemeContext';

interface SubscriptionPlansProps {
  currentPlanId?: string;
  onSelectPlan: (plan: SubscriptionPlan) => void;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  currentPlanId,
  onSelectPlan,
}) => {
  const { colors } = useTheme();
  const plans = SubscriptionService.getAvailablePlans();

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free':
        return <Building2 size={24} color={colors.textMuted} />;
      case 'basic':
        return <Users size={24} color={colors.primary} />;
      case 'professional':
        return <BarChart3 size={24} color={colors.primary} />;
      case 'enterprise':
        return <Crown size={24} color="#FFD700" />;
      default:
        return <Building2 size={24} color={colors.textMuted} />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free':
        return colors.textMuted;
      case 'basic':
        return colors.primary;
      case 'professional':
        return '#10B981';
      case 'enterprise':
        return '#FFD700';
      default:
        return colors.primary;
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan.id === currentPlanId) {
      Alert.alert('Plano Atual', 'Você já está neste plano.');
      return;
    }

    if (plan.id === 'free') {
      Alert.alert(
        'Plano Gratuito',
        'Você será movido para o plano gratuito. Algumas funcionalidades serão limitadas.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Confirmar', onPress: () => onSelectPlan(plan) }
        ]
      );
    } else {
      Alert.alert(
        'Upgrade de Plano',
        `Deseja fazer upgrade para o plano ${plan.name} por R$ ${plan.price}/mês?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Fazer Upgrade', onPress: () => onSelectPlan(plan) }
        ]
      );
    }
  };

  const renderFeatureIcon = (feature: string) => {
    if (feature.includes('Chat')) return <MessageCircle size={16} color={colors.textMuted} />;
    if (feature.includes('Relatórios')) return <BarChart3 size={16} color={colors.textMuted} />;
    if (feature.includes('API')) return <Zap size={16} color={colors.textMuted} />;
    if (feature.includes('Suporte')) return <Shield size={16} color={colors.textMuted} />;
    return <Check size={16} color={colors.textMuted} />;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { color: colors.text }]}>
        Escolha seu Plano
      </Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Selecione o plano ideal para sua empresa
      </Text>

      <View style={styles.plansContainer}>
        {plans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              {
                backgroundColor: colors.surface,
                borderColor: plan.id === currentPlanId ? getPlanColor(plan.id) : colors.border,
                borderWidth: plan.id === currentPlanId ? 2 : 1,
              },
            ]}
            onPress={() => handleSelectPlan(plan)}
          >
            {/* Header do Plano */}
            <View style={styles.planHeader}>
              <View style={styles.planIconContainer}>
                {getPlanIcon(plan.id)}
              </View>
              <View style={styles.planInfo}>
                <Text style={[styles.planName, { color: colors.text }]}>
                  {plan.name}
                </Text>
                <Text style={[styles.planPrice, { color: getPlanColor(plan.id) }]}>
                  {plan.price === 0 ? 'Grátis' : `R$ ${plan.price}/mês`}
                </Text>
              </View>
              {plan.id === currentPlanId && (
                <View style={[styles.currentBadge, { backgroundColor: getPlanColor(plan.id) }]}>
                  <Text style={styles.currentBadgeText}>Atual</Text>
                </View>
              )}
            </View>

            {/* Lista de Funcionalidades */}
            <View style={styles.featuresContainer}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    {renderFeatureIcon(feature)}
                  </View>
                  <Text style={[styles.featureText, { color: colors.textMuted }]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            {/* Botão de Ação */}
            <TouchableOpacity
              style={[
                styles.selectButton,
                {
                  backgroundColor: plan.id === currentPlanId ? colors.border : getPlanColor(plan.id),
                },
              ]}
              onPress={() => handleSelectPlan(plan)}
            >
              <Text
                style={[
                  styles.selectButtonText,
                  {
                    color: plan.id === currentPlanId ? colors.textMuted : '#FFFFFF',
                  },
                ]}
              >
                {plan.id === currentPlanId ? 'Plano Atual' : 'Selecionar'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>

      {/* Informações Adicionais */}
      <View style={styles.infoContainer}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>
          Por que escolher o Obra Limpa?
        </Text>
        <View style={styles.infoItems}>
          <View style={styles.infoItem}>
            <Check size={16} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              Gestão completa de obras
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Check size={16} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              Chat em tempo real
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Check size={16} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              Relatórios detalhados
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Check size={16} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              Suporte especializado
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  selectButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  infoItems: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
  },
});
