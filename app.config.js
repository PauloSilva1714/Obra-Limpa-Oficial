module.exports = {
  name: 'Obra Limpa',
  slug: 'obra-limpa',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  scheme: 'com.obralimpa.app',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.obralimpa.app',
    googleServicesFile: './GoogleService-Info.plist'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.obralimpa.app',
    versionCode: 1,
    googleServicesFile: './android/app/google-services.json'
  },
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
    output: 'static',
    entryPoint: './web/index.html'
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-web-browser',
    'expo-audio',
    'expo-video',
    '@react-native-firebase/app',
    [
      'expo-dev-client',
      {
        launchMode: 'most-recent'
      }
    ]
  ],
  experiments: {
    typedRoutes: true,
    tsconfigPaths: true
  },
  extra: {
    firebase: {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
    },
    EXPO_GOOGLE_PLACES_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
    eas: {
      projectId: "daa03d49-e8d2-40c2-a009-ebd5176ff283"
    }
  }
};