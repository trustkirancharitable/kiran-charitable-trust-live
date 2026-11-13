/**
 * Kiran Charitable Trust - PM2 Enterprise Cluster Configuration
 * 
 * Provides automated load balancing, cluster management,
 * memory thresholds, and zero-downtime rolling reload.
 */

module.exports = {
  apps: [
    {
      name: 'kiran-trust-backend',
      script: './backend/server.js',
      instances: 6, // 6 balanced concurrent worker instances
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000
      }
    }
  ]
};
