const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const User = require("../../models/User");
const { generateAccessToken, generateRefreshToken, hashToken } = require("../../helpers/authUtils");
const { safeSet } = require("../../helpers/redis");
const { getCookieOptions } = require("../../helpers/cookieOptions");

let jwks = null;

const getAuth0Domain = () =>
  String(process.env.AUTH0_DOMAIN || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");

const getAuth0ClientId = () => String(process.env.AUTH0_CLIENT_ID || "").trim();

const getJwks = () => {
  if (!jwks) {
    jwks = jwksClient({
      jwksUri: `https://${getAuth0Domain()}/.well-known/jwks.json`,
      cache: true,
      rateLimit: true,
    });
  }
  return jwks;
};

const isOAuthConfigured = () => Boolean(getAuth0Domain() && getAuth0ClientId());

const getKey = (header, callback) => {
  getJwks().getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
};

const verifyAuth0Token = (token) =>
  new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        // The Auth0 SPA sends an ID token, whose audience is the SPA client ID.
        audience: getAuth0ClientId(),
        // Issuer must be the bare https host with exactly ONE trailing slash,
        // e.g. "https://web-nexoras.us.auth0.com/". Both parts are trimmed so a
        // stray whitespace/newline in the env var can never break this again.
        issuer: `https://${getAuth0Domain()}/`,
        algorithms: ["RS256"],
      },
      (err, decoded) => (err ? reject(err) : resolve(decoded)),
    );
  });

// Auth0 social subjects look like "google-oauth2|123456" or "github|123456".
const splitSubject = (sub) => {
  const value = String(sub || "");
  const separator = value.indexOf("|");
  if (separator === -1) return { provider: value || "auth0", providerId: value || "" };
  return {
    provider: value.slice(0, separator),
    providerId: value.slice(separator + 1),
  };
};

const oauthAuth0 = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ success: false, message: "Auth0 token required" });

  if (!isOAuthConfigured()) {
    console.error("Auth0 OAuth error: AUTH0_DOMAIN and/or AUTH0_CLIENT_ID are missing on the server");
    return res.status(503).json({
      success: false,
      code: "OAUTH_NOT_CONFIGURED",
      message:
        "Social sign-in is not configured on the server. Add AUTH0_DOMAIN and AUTH0_CLIENT_ID to the backend environment, then redeploy.",
    });
  }

  try {
    const decoded = await verifyAuth0Token(idToken);
    const email = String(decoded.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ success: false, message: "Email not provided by Auth0" });

    // Never link an OAuth identity to an existing account by an email the
    // provider itself has not verified.
    if (decoded.email_verified === false) {
      return res.status(403).json({
        success: false,
        message: "Your sign-in provider has not verified this email address. Verify it with the provider and try again.",
      });
    }

    const fullname = decoded.name || decoded.nickname || email.split("@")[0];
    const avatar = decoded.picture || null;
    const { provider, providerId } = splitSubject(decoded.sub);

    let user = await User.findOne({ email });

    if (!user) {
      try {
        // New social account: created verified (the provider proved the email,
        // so no OTP step) but NOT approved — an administrator still has to
        // approve it before the user can sign in, exactly like email sign-up.
        user = await User.create({
          fullname,
          email,
          // Random, never shared; OAuth accounts do not use password sign-in.
          password: crypto.randomBytes(32).toString("hex"),
          avatar,
          role: "user",
          isVerified: true,
          isApproved: false,
          status: "pending",
          oauthProviders: [{ provider, providerId }],
        });
      } catch (createError) {
        // Two parallel OAuth callbacks can race for the same new email. The
        // unique index keeps one account; retry the lookup instead of failing.
        if (createError?.code !== 11000) throw createError;
        user = await User.findOne({ email });
        if (!user) throw createError;
      }

      // Brand-new accounts wait in the admin approval queue. Return the pending
      // signal the frontend already understands instead of issuing a session.
      if (user.role !== "admin" && !user.isApproved) {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_PENDING",
          pending: true,
          status: "pending",
          message:
            "Your account is awaiting admin approval. You can sign in once an administrator approves it.",
        });
      }
    }

    // Existing account (password or social): link this provider identity
    // instead of creating a duplicate user, then apply account-state checks.
    // This block is harmless for a just-created user.
    user.oauthProviders = user.oauthProviders || [];
    const linked = user.oauthProviders.some(
      (entry) => entry.provider === provider && entry.providerId === providerId,
    );
    if (!linked) user.oauthProviders.push({ provider, providerId });

    if (decoded.email_verified === true) user.isVerified = true;

    const isAdmin = user.role === "admin";
    if (!isAdmin) {
      if (user.isActive === false) {
        return res.status(403).json({ success: false, message: "Your account is inactive. Contact an administrator." });
      }

      const approvalStatus = user.status || (user.isApproved ? "approved" : "pending");
      if (approvalStatus === "rejected") {
        return res.status(403).json({ success: false, message: "Your account was rejected by the admin." });
      }

      // Social sign-in NEVER self-approves an account. A pending user stays
      // pending until an administrator approves it (same rule as email
      // sign-up), and only approved users get a session.
      if (approvalStatus !== "approved" || !user.isApproved) {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_PENDING",
          pending: true,
          status: "pending",
          message:
            "Your account is awaiting admin approval. You can sign in once an administrator approves it.",
        });
      }
    }

    // Keep the provider's latest display name/photo without overwriting a
    // custom avatar the user uploaded in the app.
    if (!user.avatar && avatar) user.avatar = avatar;
    if (!user.fullname && fullname) user.fullname = fullname;

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshTokenHash = hashToken(refreshToken);
    await user.save({ validateBeforeSave: false });

    const cachedUser = {
      _id: user._id, fullname: user.fullname, email: user.email, role: user.role,
      avatar: user.avatar, address: user.address, isVerified: user.isVerified,
      isApproved: user.isApproved, isActive: user.isActive,
    };
    await safeSet(`authuser:${user._id}`, JSON.stringify(cachedUser), { EX: 60 });

    const cookieOptions = getCookieOptions();
    return res
      .status(200)
      .cookie("accTkn", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 })
      .cookie("refTkn", refreshToken, { ...cookieOptions, maxAge: 15 * 24 * 60 * 60 * 1000 })
      .json({
        success: true,
        message: "Login successful",
        accessToken,
        refreshToken,
        user: { _id: user._id, fullname: user.fullname, email: user.email, role: user.role, avatar: user.avatar, address: user.address, isVerified: user.isVerified, isApproved: user.isApproved, isActive: user.isActive },
      });
  } catch (error) {
    console.error("Auth0 OAuth error:", error.name, error.message);

    // Decode (WITHOUT verifying) so the log shows exactly why verification
    // failed — the real issuer/audience versus what the server expects. This
    // turns an opaque "issuer invalid" into an obvious mismatch.
    try {
      const claims = jwt.decode(idToken, { complete: true })?.payload || {};
      console.error("Auth0 token claims:", {
        iss: claims.iss,
        aud: claims.aud,
        azp: claims.azp,
        expectedIssuer: `https://${getAuth0Domain()}/`,
        expectedAudience: getAuth0ClientId(),
      });
    } catch {
      /* payload not decodable — nothing to log */
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        code: "AUTH0_TOKEN_EXPIRED",
        message: "Your sign-in session expired. Please try again.",
      });
    }

    return res.status(401).json({
      success: false,
      code: "AUTH0_TOKEN_INVALID",
      message:
        "Could not verify the sign-in token. Check that the backend AUTH0_DOMAIN and AUTH0_CLIENT_ID match the Auth0 application.",
    });
  }
};

module.exports = { oauthAuth0 };
