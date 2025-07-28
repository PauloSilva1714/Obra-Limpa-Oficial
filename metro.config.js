const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configuração para processar arquivos SVG
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

// Configuração de aliases para importações
config.resolver.alias = {
  '@': path.resolve(__dirname, './'),
  '@components': path.resolve(__dirname, './components'),
  '@services': path.resolve(__dirname, './services'),
  '@config': path.resolve(__dirname, './config'),
  '@contexts': path.resolve(__dirname, './contexts'),
  '@assets': path.resolve(__dirname, './assets'),
  '@types': path.resolve(__dirname, './types'),
  '@utils': path.resolve(__dirname, './utils'),
  '@hooks': path.resolve(__dirname, './hooks'),
};

// Configuração para resolver problemas de compatibilidade
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;