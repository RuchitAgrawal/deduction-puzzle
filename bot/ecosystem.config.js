module.exports = {
  apps: [
    {
      name: 'dp-telegram',
      script: 'telegram/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '150M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/telegram-error.log',
      out_file: './logs/telegram-out.log'
    },
    {
      name: 'dp-discord',
      script: 'discord/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/discord-error.log',
      out_file: './logs/discord-out.log'
    }
  ]
};
