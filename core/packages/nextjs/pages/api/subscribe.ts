import type { NextApiRequest, NextApiResponse } from "next";
import { createElement } from "react";
import { render } from "@react-email/render";
import { Resend } from "resend";
import { SubscribeWelcomeEmail } from "~~/emails/SubscribeWelcomeEmail";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubscribeResponse = { ok: true } | { error: string };

const getSiteUrl = () => {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (url) {
    return url.replace(/\/$/, "");
  } else {
    throw new Error("NEXT_PUBLIC_SITE_URL is not set");
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<SubscribeResponse>) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    console.error("Subscribe: RESEND_API_KEY or RESEND_FROM_EMAIL is not set");
    return res.status(503).json({ error: "Email service not configured" });
  }

  const siteUrl = getSiteUrl();
  const html = await render(createElement(SubscribeWelcomeEmail, { siteUrl }));

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "You're on the list — DeLi early access",
    html,
  });

  if (error) {
    console.error("Subscribe: Resend error", error);
    return res.status(500).json({ error: "Failed to send email" });
  }

  return res.status(200).json({ ok: true });
}
