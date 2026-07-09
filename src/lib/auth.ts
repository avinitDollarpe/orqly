import { dash, sendEmail } from "@better-auth/infra";
import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";

const googleConfigured =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
const githubConfigured =
  !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  // Dev is often browsed on localhost while BETTER_AUTH_URL points at an
  // ngrok tunnel (for OAuth callbacks); trust both so neither trips the
  // origin check
  trustedOrigins: ["http://localhost:3000"],
  // One user per email regardless of sign-in method: first visit creates the
  // user, later visits with any method log into the same account. Google and
  // GitHub verify emails, so linking on their say-so is safe;
  // requireLocalEmailVerified is off so a password-first user (unverified)
  // can still come back through OAuth instead of hitting account_not_linked.
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
      requireLocalEmailVerified: false,
    },
  },
  emailAndPassword: { enabled: true },
  socialProviders: {
    ...(googleConfigured
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          },
        }
      : {}),
    ...(githubConfigured
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
          },
        }
      : {}),
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // No Dash key (bare local dev): log the code instead of sending
        if (!process.env.BETTER_AUTH_API_KEY) {
          console.log(`[email-otp] ${type} for ${email}: ${otp}`);
          return;
        }
        const template =
          type === "sign-in"
            ? "sign-in-otp"
            : type === "forget-password"
              ? "reset-password-otp"
              : "verify-email-otp";
        const result = await sendEmail(
          {
            template,
            to: email,
            variables: {
              otpCode: otp,
              userEmail: email,
              appName: "Orqly",
              expirationMinutes: "5",
            },
          },
          // same cold-start allowance as the dash plugin below
          { apiTimeout: 15_000 },
        );
        if (!result.success) {
          throw new Error(`OTP email failed: ${result.error}`);
        }
      },
    }),
    passkey(),
    dash({
      apiKey: process.env.BETTER_AUTH_API_KEY,
      // ponytail: 3s default aborts JWKS fetch on cold dev start; 15s rides it out
      apiTimeout: 15_000,
    }),
  ],
});
