/**
 * Validates and exports required environment variables.
 * Throws on startup if any required variable is missing.
 */

const REQUIRED = ['ANTHROPIC_API_KEY', 'ELEVENLABS_API_KEY', 'DATABASE_URL'];

for (const key of REQUIRED) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: parseInt(process.env.PORT ?? '3000', 10),
};
