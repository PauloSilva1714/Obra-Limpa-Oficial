import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { AuthService } from './AuthService';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  priceId: string; // ID do produto na Play Store
  features: string[];
  maxSites: number;
  maxUsers: number;
  isActive: boolean;
}

export interface UserSubscription {
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  purchaseToken?: string;
}

export class SubscriptionService {
  private static PLANS_COLLECTION = 'subscription_plans';
  private static SUBSCRIPTIONS_COLLECTION = 'user_subscriptions';

  // Planos disponíveis
  static readonly PLANS: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Gratuito',
      price: 0,
      priceId: 'free_plan',
      features: [
        '1 obra/site',
        'Máximo 5 usuários',
        'Funcionalidades básicas',
        'Chat limitado'
      ],
      maxSites: 1,
      maxUsers: 5,
      isActive: true
    },
    {
      id: 'basic',
      name: 'Básico',
      price: 19.90,
      priceId: 'basic_monthly',
      features: [
        '1 obra/site',
        'Máximo 10 usuários',
        'Chat completo',
        'Relatórios básicos'
      ],
      maxSites: 1,
      maxUsers: 10,
      isActive: true
    },
    {
      id: 'professional',
      name: 'Profissional',
      price: 49.90,
      priceId: 'professional_monthly',
      features: [
        '5 obras/sites',
        'Máximo 50 usuários',
        'Chat completo',
        'Relatórios avançados',
        'Backup automático'
      ],
      maxSites: 5,
      maxUsers: 50,
      isActive: true
    },
    {
      id: 'enterprise',
      name: 'Empresarial',
      price: 99.90,
      priceId: 'enterprise_monthly',
      features: [
        'Obras ilimitadas',
        'Usuários ilimitados',
        'Chat completo',
        'Relatórios avançados',
        'API personalizada',
        'Suporte prioritário'
      ],
      maxSites: -1, // Ilimitado
      maxUsers: -1, // Ilimitado
      isActive: true
    }
  ];

  // Obter plano atual do usuário
  static async getUserPlan(userId: string): Promise<SubscriptionPlan> {
    try {
      const subscriptionDoc = await getDoc(
        doc(db, this.SUBSCRIPTIONS_COLLECTION, userId)
      );

      if (subscriptionDoc.exists()) {
        const subscription = subscriptionDoc.data() as UserSubscription;

        // Verificar se a assinatura está ativa
        if (subscription.status === 'active' && new Date(subscription.endDate) > new Date()) {
          const plan = this.PLANS.find(p => p.id === subscription.planId);
          return plan || this.PLANS[0]; // Retorna plano gratuito se não encontrar
        }
      }

      // Retorna plano gratuito por padrão
      return this.PLANS[0];
    } catch (error) {
      return this.PLANS[0];
    }
  }

  // Verificar se usuário pode criar mais sites
  static async canCreateSite(userId: string): Promise<boolean> {
    try {
      const plan = await this.getUserPlan(userId);

      if (plan.maxSites === -1) return true; // Ilimitado

      const currentSites = await this.getUserSitesCount(userId);
      return currentSites < plan.maxSites;
    } catch (error) {
      return false;
    }
  }

  // Verificar se usuário pode adicionar mais usuários
  static async canAddUser(userId: string, siteId: string): Promise<boolean> {
    try {
      const plan = await this.getUserPlan(userId);

      if (plan.maxUsers === -1) return true; // Ilimitado

      const currentUsers = await this.getSiteUsersCount(siteId);
      return currentUsers < plan.maxUsers;
    } catch (error) {
      return false;
    }
  }

  // Contar sites do usuário
  private static async getUserSitesCount(userId: string): Promise<number> {
    try {
      const sitesQuery = query(
        collection(db, 'sites'),
        where('ownerId', '==', userId)
      );
      const snapshot = await getDocs(sitesQuery);
      return snapshot.size;
    } catch (error) {
      return 0;
    }
  }

  // Contar usuários de um site
  private static async getSiteUsersCount(siteId: string): Promise<number> {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('siteId', '==', siteId)
      );
      const snapshot = await getDocs(usersQuery);
      return snapshot.size;
    } catch (error) {
      return 0;
    }
  }

  // Atualizar assinatura do usuário (chamado após compra na Play Store)
  static async updateUserSubscription(
    userId: string,
    planId: string,
    purchaseToken: string,
    startDate: string,
    endDate: string
  ): Promise<void> {
    try {
      const subscription: UserSubscription = {
        userId,
        planId,
        status: 'active',
        startDate,
        endDate,
        autoRenew: true,
        purchaseToken
      };

      await setDoc(
        doc(db, this.SUBSCRIPTIONS_COLLECTION, userId),
        subscription
      );

      } catch (error) {
      throw error;
    }
  }

  // Cancelar assinatura
  static async cancelSubscription(userId: string): Promise<void> {
    try {
      await updateDoc(
        doc(db, this.SUBSCRIPTIONS_COLLECTION, userId),
        {
          status: 'cancelled',
          autoRenew: false
        }
      );

      } catch (error) {
      throw error;
    }
  }

  // Obter todos os planos disponíveis
  static getAvailablePlans(): SubscriptionPlan[] {
    return this.PLANS.filter(plan => plan.isActive);
  }

  // Verificar se funcionalidade está disponível no plano
  static async isFeatureAvailable(userId: string, feature: string): Promise<boolean> {
    try {
      const plan = await this.getUserPlan(userId);

      switch (feature) {
        case 'chat':
          return plan.id !== 'free';
        case 'reports':
          return plan.id === 'professional' || plan.id === 'enterprise';
        case 'api':
          return plan.id === 'enterprise';
        case 'priority_support':
          return plan.id === 'enterprise';
        default:
          return true;
      }
    } catch (error) {
      return false;
    }
  }
}
