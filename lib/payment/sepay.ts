import crypto from "node:crypto";

// Faithful port of api/payment-connector/services/providers/sepay-provider.js.
// SEPAY is the payment gateway: it posts webhooks when a bank transfer arrives
// and provides bank account info for VietQR deposit intents.
//
// Required env:
//   SEPAY_WEBHOOK_API_KEY  — shared secret SEPAY sends as "Apikey <key>"
//   SEPAY_BANK_ACCOUNT     — bank account number to receive transfers
//   SEPAY_BANK_CODE        — bank code for VietQR (e.g. "VCB", "TCB")
//   SEPAY_ACCOUNT_HOLDER   — (optional) account holder name for QR display

export interface SepayWebhookEvent {
  eventId: string;
  walletId: number;
  amount: number;
  paymentCode: string;
  bankReference: string | null;
}

function timingSafeEqual(a: string, b: string): boolean {
  const left  = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

// DNT{walletId} — the payment code embedded in transfer descriptions so
// the webhook can route the deposit to the correct wallet.
export function paymentCodeForWallet(walletId: number): string {
  return `DNT${walletId}`;
}

// Verify the webhook request and extract the event. Returns null on any failure
// (bad key, wrong direction, unparseable code) — caller should respond 401.
export function verifyWebhook(req: Request, body: Record<string, unknown>): SepayWebhookEvent | null {
  const configured = process.env.SEPAY_WEBHOOK_API_KEY;
  if (!configured) return null;

  const authorization = req.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Apikey ")) return null;
  if (!timingSafeEqual(authorization.slice(7), configured)) return null;

  const amount = Number(body.transferAmount);
  if (body.transferType !== "in" || !Number.isSafeInteger(amount) || amount <= 0) return null;

  // Extract DNT{id} from the payment code field, or scan the transfer content.
  const rawCode = String(body.code ?? "").toUpperCase();
  const rawContent = String(body.content ?? "").toUpperCase();
  const paymentCode = rawCode || (rawContent.match(/\bDNT(\d+)\b/)?.[0] ?? "");
  const match = paymentCode.match(/^DNT(\d+)$/);
  if (!match) return null;

  const walletId = Number(match[1]);
  if (!Number.isSafeInteger(walletId) || walletId <= 0) return null;

  const eventId = body.referenceCode ?? body.id;
  if (!eventId) return null;

  return {
    eventId: String(eventId),
    walletId,
    amount,
    paymentCode,
    bankReference: body.referenceCode ? String(body.referenceCode) : null,
  };
}

// Build deposit intent: return bank account info + VietQR URL for the FE to
// display. The user then makes the bank transfer manually.
export function createDepositIntent(params: { walletId: number; amount: number }) {
  const { walletId, amount } = params;
  const parsedAmount = Math.floor(Number(amount));
  if (!Number.isSafeInteger(parsedAmount) || parsedAmount < 1000) {
    throw new Error("Deposit amount must be an integer of at least 1,000 VND");
  }

  const accountNumber = process.env.SEPAY_BANK_ACCOUNT;
  const bank = process.env.SEPAY_BANK_CODE;
  if (!accountNumber || !bank) throw new Error("SEPAY_BANK_ACCOUNT and SEPAY_BANK_CODE must be configured");

  const accountHolder = process.env.SEPAY_ACCOUNT_HOLDER ?? "";
  const paymentCode   = paymentCodeForWallet(walletId);
  const description   = `${paymentCode} NAP TIEN`;

  const query = new URLSearchParams({
    acc: accountNumber, bank,
    amount: String(parsedAmount),
    des: description,
    template: "compact",
    showinfo: "true",
  });
  if (accountHolder) query.set("holder", accountHolder);

  return {
    provider: "sepay",
    amount: parsedAmount,
    paymentCode,
    description,
    bank,
    accountNumber,
    accountHolder,
    qrUrl: `https://vietqr.app/img?${query.toString()}`,
  };
}
