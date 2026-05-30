module.exports = {
  apps: [{
    name: 'leetcode-3-visualizer',
    script: './node_modules/.bin/vite',
    args: '--port 32337 --host 127.0.0.1',
    cwd: '/Users/cc11001100/github/fuck-algorithm/leetcode-3-longest-substring-without-repeating-characters',
    env: {
      NODE_ENV: 'development'
    },
    watch: false,
    max_memory_restart: '500M',
    max_size: '50M',
    restart_delay: 3000,
    max_restarts: 10,
    min_uptime: '10s',
    autorestart: true,
    error_file: '/tmp/pm2-leetcode3-error.log',
    out_file: '/tmp/pm2-leetcode3-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
