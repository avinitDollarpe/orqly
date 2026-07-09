import { dash } from "@better-auth/infra";
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
        // ponytail: no mailer yet — log OTP in dev so the progressive flow is testable
        console.log(`[email-otp] ${type} for ${email}: ${otp}`);
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
