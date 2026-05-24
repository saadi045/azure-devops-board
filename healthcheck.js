/**
 * Healthcheck script run by Docker's HEALTHCHECK directive.
 *
 * Hits /health and exits 0 if the response is 200, 1 otherwise.
 * Kept as a separate file (not inline in the Dockerfile) to avoid
 * shell-quoting issues across operating systems.
 */
const http = require('http');

const req = http.get('http://localhost:3000/health', (res) => {
  process.exit(res.statusCode === 200 ? 0 : 1);
});

req.on('error', () => process.exit(1));
req.setTimeout(5000, () => {
  req.destroy();
  process.exit(1);
});