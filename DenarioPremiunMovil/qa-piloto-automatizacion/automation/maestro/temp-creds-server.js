const http = require('http');
const fs = require('fs');
const path = require('path');
const credsPath = path.join(__dirname, '../../secrets/qa-credentials.env');
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/plain');
  try { res.end(fs.readFileSync(credsPath, 'utf8')); }
  catch(e) { res.statusCode=500; res.end('ERROR: '+e.message); }
});
server.listen(19001, '127.0.0.1', () => console.log('creds server on 19001'));
