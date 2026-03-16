import { prisma } from './prisma';
import { isAiConfigured } from './ai';
import OpenAI from 'openai';

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

/**
 * Returns a comprehensive system prompt about the Vouchr platform.
 */
export function getSystemPrompt(): string {
  return `You are Vouchr Assistant, a helpful AI support agent for the Vouchr platform.

ABOUT VOUCHR:
Vouchr is a modern voucher, gift card, and event ticketing platform that connects merchants with customers. Merchants can create campaigns, issue vouchers, sell gift cards, and manage events with ticket sales.

KEY FEATURES:
- Vouchers: Percentage or fixed-amount discounts issued by merchants. Can be redeemed at checkout using a code or QR scan.
- Gift Cards: Prepaid store credit cards that can be purchased and sent as gifts. Available in various denominations.
- Event Tickets: Digital tickets for merchant-hosted events (concerts, workshops, etc.) with QR-code entry.
- Wallet Passes: Add vouchers, gift cards, or tickets to Apple Wallet or Google Wallet for easy access.
- Referral Program: Earn rewards by referring friends. Both referrer and referee get benefits.
- Cashback: Earn cashback on qualifying purchases through Vouchr.

COMMON QUESTIONS:
- Redemption: Go to the merchant's location or website, present your voucher code or QR code at checkout.
- Gift Card Balance: Check your balance in the app under "My Gift Cards" or contact the merchant.
- Expired Vouchers: Unfortunately, expired vouchers cannot be redeemed. Check validity dates in your account.
- Refunds: Refund policies vary by merchant. Contact the merchant directly for refund requests.
- Account Issues: For login problems, try the "Forgot Password" link or use magic link login via email.
- Billing: All payments are processed securely through Stripe. Receipts are emailed after purchase.

SUPPORT POLICIES:
- Be friendly, concise, and helpful.
- If you don't know the answer, suggest contacting support@vouchr.app.
- Never share personal data or make promises about refunds/compensation.
- For technical issues, suggest clearing browser cache, trying a different browser, or checking internet connection.
- Escalate complex billing disputes or account security issues to human support.

Respond in the same language the user writes in. Keep responses concise (2-4 sentences unless more detail is needed).`;
}

/**
 * Fetches recent chat history for a session.
 */
export async function getChatHistory(sessionId: string, limit = 50) {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  });
  return messages;
}

/**
 * Creates a new chat session ID.
 */
export function createSession(): string {
  // Generate a cuid-like ID for the session
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const prefix = 'chat_';
  let id = prefix;
  for (let i = 0; i < 20; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Processes a user message: saves it, calls AI, saves AI response, returns it.
 */
export async function processMessage(
  sessionId: string,
  userId: string | null,
  message: string
): Promise<{ role: string; content: string; id: string; createdAt: Date }> {
  // Save user message
  await prisma.chatMessage.create({
    data: {
      sessionId,
      userId,
      role: 'user',
      content: message,
    },
  });

  // Build conversation context from recent history
  const recentMessages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    take: 20, // Keep context window manageable
    select: { role: true, content: true },
  });

  let aiContent: string;

  if (isAiConfigured()) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system' as const, content: getSystemPrompt() },
          ...recentMessages.map((m) => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content,
          })),
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      aiContent = response.choices[0]?.message?.content || 'I apologize, I was unable to generate a response. Please try again.';
    } catch {
      aiContent = 'I apologize, I\'m having trouble connecting right now. Please try again in a moment, or contact support@vouchr.app for immediate help.';
    }
  } else {
    // Fallback when AI is not configured
    aiContent = getFallbackResponse(message);
  }

  // Save AI response
  const aiMessage = await prisma.chatMessage.create({
    data: {
      sessionId,
      userId: null,
      role: 'assistant',
      content: aiContent,
    },
  });

  return {
    role: 'assistant',
    content: aiContent,
    id: aiMessage.id,
    createdAt: aiMessage.createdAt,
  };
}

/**
 * Basic keyword-matching fallback when OpenAI is not configured.
 */
function getFallbackResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('refund') || lower.includes('money back')) {
    return 'Refund policies are set by each merchant. Please contact the merchant directly for refund requests. If you need further help, reach out to support@vouchr.app.';
  }
  if (lower.includes('gift card') || lower.includes('balance')) {
    return 'You can check your gift card balance in the app under "My Gift Cards". Each card shows its remaining balance and expiry date.';
  }
  if (lower.includes('voucher') || lower.includes('coupon') || lower.includes('redeem')) {
    return 'To redeem a voucher, present the QR code or enter the voucher code at checkout. Make sure the voucher hasn\'t expired by checking the validity dates in your account.';
  }
  if (lower.includes('ticket') || lower.includes('event')) {
    return 'Your event tickets are available in your account under "My Tickets". Show the QR code at the venue entrance for check-in.';
  }
  if (lower.includes('password') || lower.includes('login') || lower.includes('sign in')) {
    return 'If you\'re having trouble logging in, try the "Forgot Password" link on the login page, or use the magic link option to receive a login link via email.';
  }
  if (lower.includes('wallet') || lower.includes('apple') || lower.includes('google')) {
    return 'You can add your vouchers, gift cards, and tickets to Apple Wallet or Google Wallet. Look for the "Add to Wallet" button on any item detail page.';
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return 'Hello! Welcome to Vouchr support. How can I help you today?';
  }

  return 'Thank you for your message. For the best assistance, please describe your issue in detail. You can also reach our support team at support@vouchr.app.';
}
