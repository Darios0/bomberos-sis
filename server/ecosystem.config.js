module.exports = {
  apps: [
    {
      name: 'bomberos-api',
      script: 'index.js',
      cwd: '/opt/bomberos-sis/server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/var/log/bomberos/api-error.log',
      out_file: '/var/log/bomberos/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
