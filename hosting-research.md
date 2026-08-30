# Hosting research references

- Render free services: https://render.com/docs/free
  - Free web services can run Node.js applications and static sites.
  - Free web services spin down after 15 minutes without inbound traffic and may take about one minute to wake.
  - Free web services have ephemeral filesystems and do not support one-off jobs.
  - Free Render Postgres expires after 30 days, so it is not a durable free database choice for this app.

- Render Node/Express deployment: https://render.com/docs/deploy-node-express-app
  - Render deploys an Express application from Git with a build command and start command.

- Koyeb Express deployment: https://www.koyeb.com/docs/deploy/express
  - Koyeb supports Git-driven Express deployments and a normal Node start script.
  - Applications must listen on the configurable PORT environment variable.

- Netlify Express integration: https://docs.netlify.com/build/frameworks/framework-setup-guides/express/
  - Express runs on Netlify through Netlify Functions and requires a function wrapper/rewrite.
  - Netlify documents function execution limitations and does not recommend Express deployments for background or scheduled functions.
