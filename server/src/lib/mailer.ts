// Pluggable mailer. For now a console/log transport ships; a real SMTP
// transport (nodemailer) can be dropped in behind the same `sendMail` interface
// later without touching callers. Raw secrets are never logged.

export type MailTemplate = "superadminNewPending" | "applicantApproved" | "applicantRejected";

export interface MailMessage {
  to: string;
  subject: string;
  template: MailTemplate;
  data: Record<string, unknown>;
}

function renderBody(template: MailTemplate, data: Record<string, unknown>): string {
  switch (template) {
    case "superadminNewPending":
      return [
        `A new ${data.role} registration is awaiting approval.`,
        `Name:  ${data.name}`,
        `Phone: ${data.phone}`,
        `Email: ${data.email}`,
        ``,
        `Review it in the superadmin panel: ${data.reviewUrl ?? "/superadmin"}`,
      ].join("\n");
    case "applicantApproved":
      return [
        `Hi ${data.name},`,
        ``,
        `Your SpaksTrip ${data.role} account has been approved. You can now log in with your phone number.`,
        data.creditLimit != null ? `Approved credit limit: ₹${data.creditLimit}` : ``,
      ]
        .filter(Boolean)
        .join("\n");
    case "applicantRejected":
      return [
        `Hi ${data.name},`,
        ``,
        `Your SpaksTrip ${data.role} application was not approved.`,
        data.reason ? `Reason: ${data.reason}` : ``,
      ]
        .filter(Boolean)
        .join("\n");
  }
}

// Transport: swap this implementation for SMTP later; signature stays the same.
async function deliver(message: MailMessage, body: string): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(
    [
      "",
      "──────── MAIL (console transport) ────────",
      `To:      ${message.to}`,
      `Subject: ${message.subject}`,
      `Template:${message.template}`,
      "",
      body,
      "──────────────────────────────────────────",
      "",
    ].join("\n"),
  );
}

export async function sendMail(message: MailMessage): Promise<void> {
  const body = renderBody(message.template, message.data);
  await deliver(message, body);
}
