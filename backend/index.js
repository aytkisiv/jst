require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// Validate env before anything else — throws if required vars are missing
const env = require('./config/env');

const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/error');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ data: { ok: true }, error: null });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/user',     require('./routes/user'));
app.use('/api/test',     require('./routes/test'));
app.use('/api/session',  require('./routes/session'));
app.use('/api/chat',     require('./routes/chat'));
app.use('/api/voice',    require('./routes/voice'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/badges',   require('./routes/badges'));

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`[just-to-study] server running on port ${env.PORT}`);
});
