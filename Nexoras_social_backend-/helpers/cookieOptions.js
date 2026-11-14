const getCookieOptions = () => {
  // If running on Render, production, or over HTTPS, cookies must be SameSite=None and Secure for cross-origin frontend (Vercel)
  const isLocalDev =
    process.env.NODE_ENV === "development" &&
    !process.env.RENDER &&
    !process.env.RENDER_SERVICE_ID;
  return {
    httpOnly: true,
    secure: !isLocalDev,
    sameSite: !isLocalDev ? "none" : "lax",
    path: "/",
  };
};

module.exports = { getCookieOptions };
