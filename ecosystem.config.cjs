module.exports = {
  apps: [
    {
      name: 'vuka-cereals',
      script: 'server/index.js',
      interpreter: 'node',
      instances: 1,
      autorestart: true,
      watch: false,
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
  ],
};
