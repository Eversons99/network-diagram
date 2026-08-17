module.exports = {
  apps: [
    {
      name: 'network-diagram',
      cwd: __dirname,
      script: 'node_modules/vite/bin/vite.js',
      args: '--host',
      interpreter: '/home/nmultifibra/.nvm/versions/node/v20.20.2/bin/node',
      watch: false,
      autorestart: true,
    },
  ],
};
