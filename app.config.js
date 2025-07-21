module.exports = {
  name: 'Obra Limpa',
  slug: 'obra-limpa',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png'
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-web-browser',
    'expo-audio',
    'expo-video'
  ],
  extra: {
    firebase: {
      apiKey: "AIzaSyDHJm219NVmB5KdQcLYRgOrp_coC_KbycQ",
      authDomain: "bralimpa2.firebaseapp.com",
      projectId: "bralimpa2",
      storageBucket: "bralimpa2.firebasestorage.app",
      messagingSenderId: "127747660506",
      appId: "1:127747660506:web:b1d89516a0bc22698de3e3"
    },
    EXPO_GOOGLE_PLACES_API_KEY: "AIzaSyBer6x1O4RAlrkHw8HYhh-lRgrbKlnocEA"
  }
}; 