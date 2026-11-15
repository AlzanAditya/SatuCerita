import type { commonId } from "./common.id";

export const commonEn: Record<keyof typeof commonId, string> = {
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.back": "Back",
  "common.loading": "Loading",
  "common.close": "Close",
  "common.retry": "Try again",
  "auth.denied": "Access denied",
  "auth.signOut": "Sign out",
  "auth.noAdminAccess": "This account does not have access to the admin dashboard.",

  "lang.choose": "Choose language",

  "auth.adminTitle": "Admin Login",
  "auth.signUpTitle": "Sign Up",
  "auth.login": "Log in",
  "auth.haveAccount": "Already have an account? ",
  "auth.noAccount": "Don't have an account? ",
  "auth.register": "Sign up",
  "auth.adminSubtitle": "Sign in to the Satu Cerita Admin Dashboard",
  "auth.google": "Continue with Google",
  "auth.or": "Or",
  "auth.namePh": "Full name",
  "auth.emailPh": "Enter your email address",
  "auth.passwordPh": "Password",
  "auth.confirmPh": "Repeat password",
  "auth.showPw": "Show password",
  "auth.hidePw": "Hide password",
  "auth.forgot": "Forgot password?",
  "auth.forgotInfo":
    "Password reset is coming soon. For now, sign in with Google or contact the admin.",
  "auth.processing": "Processing...",
  "auth.agree": "By signing in, you agree to the",
  "auth.terms": "Terms & Privacy Policy",
  "auth.err.email": "Enter a valid email address.",
  "auth.err.nameMin": "Full name must be at least 2 characters.",
  "auth.err.pwMin": "Password must be at least 8 characters.",
  "auth.err.pwMismatch": "Password confirmation does not match.",
  "auth.err.pwRequired": "Password is required.",

  "api.err.generic": "Something went wrong. Please try again.",
};
