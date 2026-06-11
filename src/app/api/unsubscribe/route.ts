import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUnsubToken } from "@/lib/email";

function htmlPage(title: string, body: string): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Garrincha</title>
  <style>
    body { margin: 0; padding: 80px 24px; font-family: Arial, sans-serif; background: #f4f4f4; }
    .card { max-width: 440px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 40px; text-align: center; }
    h2 { margin: 0 0 16px; font-size: 22px; color: #111; }
    p { margin: 0 0 16px; color: #555; font-size: 15px; line-height: 1.6; }
    a { color: #111; font-size: 14px; }
    .footer { margin-top: 32px; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="card">
    ${body}
    <div class="footer">© 2026 Garrincha. All rights reserved.</div>
  </div>
</body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid");
  const tok = req.nextUrl.searchParams.get("tok");

  if (!uid || !tok) {
    return htmlPage(
      "Invalid link",
      `<h2>Invalid unsubscribe link.</h2>
       <p>This link is not valid. If you want to unsubscribe, use the link in your email.</p>
       <a href="https://worldcup.garrincha.be">← Back to Garrincha</a>`,
    );
  }

  if (!verifyUnsubToken(uid, tok)) {
    return htmlPage(
      "Invalid link",
      `<h2>This unsubscribe link is not valid.</h2>
       <p>Please use the unsubscribe link from your original email.</p>
       <a href="https://worldcup.garrincha.be">← Back to Garrincha</a>`,
    );
  }

  try {
    await prisma.user.update({
      where: { id: uid },
      data: { emailUnsubscribedAt: new Date() },
    });
  } catch {
    // User not found — still show success to prevent email enumeration
  }

  return htmlPage(
    "Unsubscribed",
    `<h2>You have been unsubscribed.</h2>
     <p>You will no longer receive emails from Garrincha WorldCup Prediction Game.</p>
     <a href="https://worldcup.garrincha.be">← Back to Garrincha</a>`,
  );
}
