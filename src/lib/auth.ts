import { dash } from "@better-auth/infra";
import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { otpEmailHtml } from "@/lib/otp-email";

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
  // DB-backed so limits hold across serverless instances; memory storage is
  // per-lambda on Vercel. The OTP verify endpoint keeps the emailOTP
  // plugin's own 3-per-minute rule.
  rateLimit: {
    enabled: true,
    storage: "database",
    customRules: {
      "/email-otp/send-verification-otp": { window: 300, max: 3 },
    },
  },
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
      // template copy says "expires in 10 minutes"
      expiresIn: 600,
      // Resend, not Better Auth infra email — that's Pro-plan only ($20/mo);
      // Resend free tier covers 3k emails/month with a verified domain
      async sendVerificationOTP({ email, otp, type }) {
        // No RESEND_API_KEY (local dev): log the code instead of sending
        if (!process.env.RESEND_API_KEY) {
          console.log(`[email-otp] ${type} for ${email}: ${otp}`);
          return;
        }
        const base = {
          from: process.env.RESEND_FROM ?? "Orqly <onboarding@resend.dev>",
          to: [email],
        };
        // Published Resend template (supplies its own subject + {{{OTP}}});
        // falls back to the same design inlined from email-template.html
        const payload = process.env.RESEND_TEMPLATE_ID
          ? {
              ...base,
              template: {
                id: process.env.RESEND_TEMPLATE_ID,
                variables: { OTP: otp },
              },
            }
          : {
              ...base,
              subject: `${otp} is your verification code for Orqly`,
              html: otpEmailHtml(otp),
              text: `Your code is ${otp}. It expires in 10 minutes. If you didn't request this, ignore this email.`,
            };
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error(`Resend failed (${res.status}): ${await res.text()}`);
        }
      },
    }),
    passkey(),
    dash({
      apiKey: process.env.BETTER_AUTH_API_KEY,
      // ponytail: 3s default aborts JWKS fetch on cold dev start; 15s rides it out. revisit if 15s masks a real network fault, or drop toward default once JWKS is warm in prod
      apiTimeout: 15_000,
    }),
  ],
});
