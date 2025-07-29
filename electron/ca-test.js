const https = require('https');

https.get('https://radius.authentify.tech', (res) => {
  const certificate = res.socket.getPeerCertificate();
  console.log(certificate);
});