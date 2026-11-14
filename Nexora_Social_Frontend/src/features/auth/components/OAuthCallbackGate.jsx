import { useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@features/auth/context/AuthContext";
import { useToast } from "@shared";
import { auth0CallbackOnLoad, readAuth0UrlError } from "@features/auth";
import { isAuth0Configured } from "@features/auth";
import { describeAuth0UrlError, describeOAuthFailure } from "@features/auth";

const PENDING_MESSAGE =
  "Your account is awaiting admin approval. You can sign in once an administrator approves it.";

/**
 * Handles the OAuth exchange when Auth0 redirects back to the app.
 * Called unconditionally at the top of App, strictly obeying React Hook Rules.
 */
export default function OAuthCallbackGate() {
  const { isAuthenticated, isLoading, error, getIdTokenClaims } = useAuth0();
  const { oauthLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const handled = useRef(false);

  useEffect(() => {
    if (!isAuth0Configured || !auth0CallbackOnLoad) return;
    if (typeof getIdTokenClaims !== "function") return;
    if (pathname.startsWith("/auth/callback")) return;
    if (handled.current) return;

    const urlError = readAuth0UrlError();
    if (urlError) {
      handled.current = true;
      const message = describeAuth0UrlError(urlError.error, urlError.description);
      showToast(message, "error", 8000);
      navigate("/signin", { replace: true, state: { oauthError: message } });
      return;
    }

    if (isLoading) return;

    if (error) {
      handled.current = true;
      const message = describeAuth0UrlError(
        error.error || error.name,
        error.error_description || error.message,
      );
      showToast(message, "error", 8000);
      navigate("/signin", { replace: true, state: { oauthError: message } });
      return;
    }

    if (!isAuthenticated) {
      handled.current = true;
      const message = "Sign-in did not complete. Please try again.";
      showToast(message, "error", 6000);
      navigate("/signin", { replace: true, state: { oauthError: message } });
      return;
    }

    handled.current = true;

    (async () => {
      try {
        const claims = await getIdTokenClaims();
        const idToken = claims?.__raw;
        if (!idToken) throw new Error("missing_id_token");

        const data = await oauthLogin(idToken);

        if (data?.pending) {
          showToast(PENDING_MESSAGE, "info", 8000);
          navigate("/signin", {
            replace: true,
            state: { oauthError: PENDING_MESSAGE, oauthPending: true },
          });
          return;
        }

        showToast("Signed in successfully! Welcome back.", "success");
        navigate("/feed", { replace: true });
      } catch (err) {
        const { message, tone } = describeOAuthFailure(err);
        showToast(message, tone, 8000);
        navigate("/signin", { replace: true, state: { oauthError: message } });
      }
    })();
  }, [
    isAuthenticated,
    isLoading,
    error,
    pathname,
    getIdTokenClaims,
    navigate,
    oauthLogin,
    showToast,
  ]);

  return null;
}
