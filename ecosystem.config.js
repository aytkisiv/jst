module.exports = {
  apps: [{
    name: 'jst-backend',
    script: './backend/index.js',
    cwd: '/root/JST',
    env_file: './backend/.env',
    restart_delay: 3000,
    max_restarts: 10,
  }]
}
