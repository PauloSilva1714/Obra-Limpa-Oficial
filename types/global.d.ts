// Declarações de tipos globais para o projeto

declare global {
  interface Window {
    __requestNotificationPermission__?: () => Promise<NotificationPermission>;
    __checkNotificationSupport__?: () => boolean;
    google?: {
      maps?: {
        places?: {
          AutocompleteService: new () => {
            getPlacePredictions: (
              request: {
                input: string;
                componentRestrictions?: { country: string };
                language?: string;
                types?: string[];
              },
              callback: (
                predictions: Array<{
                  place_id: string;
                  description: string;
                  structured_formatting: {
                    main_text: string;
                    secondary_text: string;
                  };
                }> | null,
                status: string
              ) => void
            ) => void;
          };
          PlacesServiceStatus: {
            OK: string;
            ZERO_RESULTS: string;
            OVER_QUERY_LIMIT: string;
            REQUEST_DENIED: string;
            INVALID_REQUEST: string;
          };
        };
      };
    };
  }
}

export {};
