module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current', // Support current Node.js version for Jest
        },
        modules: false, // Preserve ES modules for Jest
      },
    ],
    '@babel/preset-react', // Support React JSX
  ],
  plugins: [
    '@babel/plugin-transform-runtime', // Optional: for async/await support
  ],
};