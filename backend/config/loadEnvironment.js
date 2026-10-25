const path = require('node:path');
const dotenv = require('dotenv');

/** Load local configuration without overriding Vault/CI-injected values. */
function loadEnvironment(envFile = path.resolve(__dirname, '..', '.env')) {
  const result = dotenv.config({ path: envFile, override: false, quiet: true });
  // An env file is optional when the process environment supplies configuration.
  // Other file errors must remain visible rather than silently skipping config.
  if (result.error && result.error.code !== 'ENOENT') {
    throw result.error;
  }
}

module.exports = loadEnvironment;
