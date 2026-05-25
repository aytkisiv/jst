/**
 * Centralized Express error handler.
 * Must be mounted last with app.use(errorHandler).
 * Response format: { data: null, error: "message" }
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function errorHandler(err, req, res, next) {
  const status = err.status ?? err.statusCode ?? 500;
  const message = err.message ?? 'Internal server error';

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} — ${status}: ${message}`);

  res.status(status).json({ data: null, error: message });
}

module.exports = { errorHandler };
