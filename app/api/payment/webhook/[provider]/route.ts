import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyWebhook } from "@/lib/payment/sepay";
import { assertWithinLimits } from "@/lib/services/risk";
import { deposit } from "@/lib/services/wallet-ledger";

// POST /payment/webhook/:provider
// Called by SEPAY (or other gateways) when a bank transfer arrives.
// Auth is the gateway's own API key (not a user JWT).
// Faithful port of payment-connector.js:handleWebhook.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  if (provider !== "sepay") {
    return NextResponse.json({ error: `Unknown payment provider: ${provider}` }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid webhook" }, { status: 401 });
  }

  const event = verifyWebhook(req, body);
  if (!event) {
    return NextResponse.json({ error: "Invalid webhook" }, { status: 401 });
  }

  // Resolve wallet by the payment code (DNT{walletId}).
  const wallet = await prisma.wallets.findFirst({ where: { id: event.walletId } });
  if (!wallet) {
    console.warn(`[webhook:${provider}] no wallet matched walletId ${event.walletId}`);
    return NextResponse.json({ error: "No wallet matched payment code" }, { status: 404 });
  }

  try {
    await assertWithinLimits({ walletId: wallet.id, type: "DEPOSIT", amount: event.amount });

    const result = await deposit({
      walletId: wallet.id,
      amount: event.amount,
      referenceType: `payment-connector:${provider}`,
      referenceId: event.eventId,
      description: `${provider} payment confirmed (event ${event.eventId})`,
      metadata: {
        provider,
        eventId: event.eventId,
        cccd: wallet.cccd,
        paymentCode: event.paymentCode,
        bankReference: event.bankReference,
      },
    });

    return NextResponse.json({ success: true, result });
  } catch (err) {
    const msg = (err as Error).message;
    console.error(`[webhook:${provider}] deposit failed (event ${event.eventId}):`, err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
