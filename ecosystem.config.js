module.exports = {
  apps: [
    {
      name: 'rotarod-server',
      script: './start-server.sh',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      shutdown_with_message: true
    }
  ],
};