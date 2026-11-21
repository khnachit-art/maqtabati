module.exports = {
  apps: [{
    name: "maqtabati",
    cwd: "C:\\Users\\PC-PJD\\Documents\\Default Project\\book-orders",
    script: "pm2-start.js",
    watch: false,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 3000,
  }]
};
