
module.exports = {
  name: 'Obra Limpa',
  slug: 'obra-limpa',
  version: '1.0.3',
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
    googleServicesFile: './GoogleService-Info.plist' // A configuração do iOS não muda
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.obralimpa.app',
    versionCode: 3,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON, // <-- AQUI ESTÁ A ÚNICA MUDANÇA!
    permissions: [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.INTERNET'
    ]
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
    'expo-av',
    'expo-video',
    '@react-native-firebase/app',
    [
      'expo-camera',
      {
        cameraPermission: 'A aplicação acessa sua câmera para permitir que você tire fotos e grave vídeos.',
        microphonePermission: 'A aplicação acessa seu microfone para permitir que você grave vídeos com áudio.',
        recordAudioAndroid: true
      }
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'A aplicação acessa suas fotos para permitir que você selecione imagens.',
        cameraPermission: 'A aplicação acessa sua câmera para permitir que você tire fotos.',
        microphonePermission: 'A aplicação acessa seu microfone para permitir que você grave vídeos com áudio.'
      }
    ],
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
  updates: {
    url: "https://u.expo.dev/daa03d49-e8d2-40c2-a009-ebd5176ff283"
  },
  runtimeVersion: {
    policy: "appVersion"
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
    EXPO_GOOGLE_PLACES_API_KEY_ANDROID: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY_ANDROID,
    eas: {
      projectId: "daa03d49-e8d2-40c2-a009-ebd5176ff283"
    }
  }
};
