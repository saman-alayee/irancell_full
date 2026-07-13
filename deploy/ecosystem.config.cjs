module.exports = {
  apps: [
    {
      name: 'irancell-api',
      cwd: '/var/www/irancell/backend',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
      },
    },
    {
      name: 'irancell-web',
      cwd: '/var/www/irancell/frontend/.output/server',
      script: 'index.mjs',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        NITRO_PORT: 3000,
        NITRO_HOST: '127.0.0.1',
        NUXT_PUBLIC_API_BASE: 'https://irancell-31038.ir/api',
        API_BASE_INTERNAL: 'http://127.0.0.1:3001/api',
      },
    },
  ],
};
