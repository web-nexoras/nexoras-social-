const SSL_STORE_ID = process.env.SSL_STORE_ID;
const SSL_STORE_PASSWORD = process.env.SSL_STORE_PASSWORD;
const SSL_IS_LIVE = process.env.SSL_IS_LIVE === "true";

const BASE_API = SSL_IS_LIVE
  ? "https://securepay.sslcommerz.com"
  : "https://sandbox.sslcommerz.com";

const createPaymentSession = async (payload) => {
  const params = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, String(value));
  });

  const response = await fetch(`${BASE_API}/gwprocess/v4/api.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`SSL session failed with status ${response.status}`);
  }

  return response.json();
};

const validatePayment = async (valId) => {
  const url = `${BASE_API}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(valId)}&store_id=${encodeURIComponent(SSL_STORE_ID)}&store_passwd=${encodeURIComponent(SSL_STORE_PASSWORD)}&format=json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`SSL validation failed with status ${response.status}`);
  }
  return response.json();
};

module.exports = { createPaymentSession, validatePayment, SSL_STORE_ID, SSL_STORE_PASSWORD, SSL_IS_LIVE, BASE_API };
