const { emailTemp } = require("./emailTemplete");

const parseFrom = (value) => {
  const match = (value || "").match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (match)
    return { name: match[1].trim() || "Nexora Social", email: match[2].trim() };
  return { name: "Nexora Social", email: (value || "").trim() };
};

const mailSender = async ({ email, subject, otp, resetLink }) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[DEV] ${subject} → ${email} | OTP: ${otp || "-"} | Link: ${resetLink || "-"}`,
    );
  }

  const sender = parseFrom(process.env.MAIL_FROM);

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": (process.env.BREVO_API_KEY || "").trim(),
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender,
      to: [{ email }],
      subject,
      htmlContent: emailTemp({ otp, resetLink }),
      textContent: otp
        ? `Your Nexora Social OTP: ${otp}\nThis code is valid for 10 minutes. Do not share it with anyone.`
        : `Password reset link: ${resetLink}`,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[MAIL] Failed to send to ${email}: ${res.status} ${body}`);
    throw new Error(`Brevo API error ${res.status}`);
  }

  const data = await res.json();
  console.log(`Email sent to ${email} | id: ${data.messageId}`);
  return data;
};

module.exports = { mailSender };
