module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json', '.html'],
          alias: {
            '@': './',
            '@components': './components',
            '@services': './services',
            '@config': './config',
            '@contexts': './contexts',
            '@assets': './assets',
            '@types': './types',
            '@utils': './utils',
            '@hooks': './hooks',
          },
        },
      ],
      'react-native-reanimated/plugin',
      [
        'transform-remove-console',
        {
          exclude: ['error', 'warn', 'info', 'log']
        }
      ]
    ],
    env: {
      production: {
        plugins: [
          [
            'transform-remove-console',
            {
              exclude: ['error'] // Manter apenas console.error em produção
            }
          ]
        ]
      }
    }
  };
};