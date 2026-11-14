// Clean string removing quotes, extra spaces, carriage returns, newlines, trailing slashes
const sanitizeOrigin = (url) => {
  if (!url || typeof url !== "string") return "";
  return url
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/[\r\n]+/g, "")
    .replace(/\/+$/, "");
};

const getAllowedOrigins = () => {
  const raw = process.env.CLIENT_URL || "";
  return raw
    .split(",")
    .map(sanitizeOrigin)
    .filter(Boolean);
};

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Server-to-server, curl, Postman, health-checks
  const clean = sanitizeOrigin(origin);
  const allowed = getAllowedOrigins();

  if (allowed.length === 0) return true;
  if (allowed.includes(clean) || allowed.includes("*")) return true;

  // Automatically allow Vercel previews & production deployments
  if (clean.endsWith(".vercel.app")) return true;

  // Local development
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(clean)) return true;

  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With", "Accept"],
  exposedHeaders: ["Set-Cookie"],
};

module.exports = { sanitizeOrigin, isOriginAllowed, corsOptions };
