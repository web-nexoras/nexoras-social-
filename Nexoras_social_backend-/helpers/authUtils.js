const crypto = require("crypto");
const jwt = require("jsonwebtoken");
// --------email regex
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// --------- Generate a random 4-digit OTP
const generateOTP = () => crypto.randomInt(100000, 1000000).toString();
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const getJwtSecret = () => {
  return String(process.env.JWT_SEC || "fallback_default_access_secret").trim().replace(/^["']|["']$/g, "");
};

const getJwtRefreshSecret = () => {
  return String(process.env.JWT_REFRESH_SEC || process.env.JWT_SEC || "fallback_default_refresh_secret").trim().replace(/^["']|["']$/g, "");
};

//-------Access Token Generate
const generateAccessToken = (user) => {
  let ttl = String(process.env.ACCESS_TOKEN_TTL || "30m").trim().replace(/^["']|["']$/g, "");
  if (/^\d+$/.test(ttl)) ttl = `${ttl}m`;
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: ttl || "30m" },
  );
};

// ---------refresh token generate
const generateRefreshToken = (user) => {
  let ttl = String(process.env.REFRESH_TOKEN_TTL || "15d").trim().replace(/^["']|["']$/g, "");
  if (/^\d+$/.test(ttl)) ttl = `${ttl}d`;
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    getJwtRefreshSecret(),
    { expiresIn: ttl || "15d" },
  );
};

// -----------upload cloudinary
const uploadCloudinary = async ({mimetype, imgBuffer}) => {
  const dataUrl = `data:${mimetype};base64,${imgBuffer.toString("base64")}`;

  const res = await cloudinary.uploader.upload(dataUrl);

  return res.secure_url;
};

// -----------destroy from cloudinary
const destroyFromCloudinary = (url) => {
  const publicId = url.split("/").pop().split(".").shift();

  cloudinary.uploader.destroy(publicId, (error, result) => {
    if (error) {
      console.log("Destroy From Cloudinary:", error);
    }
  });
};


module.exports = {
  isValidEmail,
  generateOTP,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  uploadCloudinary,
  destroyFromCloudinary,
  getJwtSecret,
  getJwtRefreshSecret,
};
