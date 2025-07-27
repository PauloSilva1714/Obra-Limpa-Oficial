// Declarações de tipos globais para o projeto

declare global {
  interface Window {
    __requestNotificationPermission__?: () => Promise<NotificationPermission>;
    __checkNotificationSupport__?: () => boolean;
  }
}

export {};