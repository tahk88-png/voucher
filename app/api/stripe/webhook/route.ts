import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, isStripeConfigured, stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import type Stripe from 'stripe';
import { sendVoucherPurchaseReceipt, sendVoucherDelivery, sendCreditEarned, sendTicketConfirmation } from '@/lib/emails';
import { getCreditBalance } from '@/lib/credits';
import { captureException } from '@/lib/error-tracking';
import { logger, loggers } from '@/lib/logger';
import { sendEmailSafely } from '@/lib/email-safe';

export async function POST(req: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });
    }

    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET not configured' }, { status: 500 });
    }

    let event;
    try {
      event = verifyWebhookSignature(body, signature, webhookSecret);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        loggers.payment('checkout_session_completed', session.amount_total || 0, session.currency || 'usd', {
          sessionId: session.id,
          customerEmail: session.customer_email,
          metadata: session.metadata,
        });

        // Handle subscription checkout
        if (session.mode === 'subscription' && session.subscription) {
          const merchantId = session.metadata?.merchantId;
          if (merchantId) {
            try {
              const subscription = await stripe.subscriptions.retrieve(
                session.subscription as string
              );
              await prisma.merchantSubscription.upsert({
                where: { merchantId },
                update: {
                  stripeCustomerId: subscription.customer as string,
                  stripeSubscriptionId: subscription.id,
                  priceId: subscription.items.data[0]?.price.id || null,
                  status: subscription.status,
                  trialEndsAt: subscription.trial_end
                    ? new Date(subscription.trial_end * 1000)
                    : null,
                  currentPeriodEnd: subscription.current_period_end
                    ? new Date(subscription.current_period_end * 1000)
                    : null,
                },
                create: {
                  merchantId,
                  stripeCustomerId: subscription.customer as string,
                  stripeSubscriptionId: subscription.id,
                  priceId: subscription.items.data[0]?.price.id || null,
                  status: subscription.status,
                  trialEndsAt: subscription.trial_end
                    ? new Date(subscription.trial_end * 1000)
                    : null,
                  currentPeriodEnd: subscription.current_period_end
                    ? new Date(subscription.current_period_end * 1000)
                    : null,
                },
              });
            } catch (error) {
              logger.error('Stripe webhook: Error syncing subscription', {
                error: error instanceof Error ? error.message : 'Unknown error',
                merchantId,
                subscriptionId: session.subscription,
              });
            }
          }
          break;
        }

        // Handle successful payment
        if (session.metadata) {
          const { purchaseId, ticketId, voucherId, campaignId, merchantId, userId, referrerId } = session.metadata;
          
          // Handle ticket purchase
          if (ticketId && purchaseId && merchantId && userId) {
            try {
              const ticketPurchase = await prisma.ticketPurchase.update({
                where: { id: purchaseId },
                data: {
                  status: 'paid',
                  stripeSessionId: session.id,
                },
                include: {
                  ticket: {
                    include: {
                      event: {
                        include: { merchant: true },
                      },
                    },
                  },
                  user: true,
                  merchant: true,
                  event: true,
                },
              });

              // Send ticket confirmation email (non-blocking)
              const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tickets/${ticketPurchase.ticketId}`;
              const recipientEmail = ticketPurchase.attendeeEmail || ticketPurchase.user.email;

              if (recipientEmail) {
                await sendEmailSafely(
                  'ticket_confirmation',
                  () => sendTicketConfirmation({
                    to: recipientEmail,
                    eventName: ticketPurchase.event.name,
                    ticketNumber: ticketPurchase.ticket.ticketNumber,
                    eventDate: ticketPurchase.event.eventDate.toISOString(),
                    location: ticketPurchase.event.location || undefined,
                    attendeeName: ticketPurchase.attendeeName || ticketPurchase.user.name || undefined,
                    ticketUrl,
                    merchantName: ticketPurchase.merchant.name,
                  }),
                  { recipient: recipientEmail, ticketId: ticketPurchase.ticketId }
                );
              }

              // Log audit
              await prisma.auditLog.create({
                data: {
                  merchantId: ticketPurchase.merchantId,
                  actorUserId: userId,
                  action: 'ticket_purchased',
                  payloadJson: {
                    purchaseId: ticketPurchase.id,
                    ticketId: ticketPurchase.ticketId,
                    eventId: ticketPurchase.eventId,
                    amount: ticketPurchase.amount,
                    currency: ticketPurchase.currency,
                  },
                },
              });
            } catch (error) {
              if (error instanceof Error) {
                captureException(error, {
                  context: 'stripe_webhook_ticket_purchase',
                  sessionId: session.id,
                  ticketId,
                });
              }
            }
          }
          
          // Handle voucher purchase
          if (voucherId && purchaseId && merchantId && userId && !ticketId) {
            try {
              // Update purchase status - include all needed relations to avoid N+1 queries
              const purchase = await prisma.voucherPurchase.update({
                where: { id: purchaseId },
                data: {
                  status: 'paid',
                  stripeSessionId: session.id,
                },
                include: {
                  voucher: {
                    include: {
                      merchant: true,
                      campaign: true,
                    },
                  },
                  campaign: true,
                  user: true,
                  merchant: true,
                },
              });

              // Generate voucher code
              const voucherCode = `${purchase.voucher?.codePrefix || 'V'}-${purchase.voucherId?.slice(0, 8).toUpperCase() || 'UNKNOWN'}`;
              const voucherUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/v/${purchase.voucherId}`;

              // Send purchase receipt and delivery emails (non-blocking)
              if (purchase.user.email && purchase.voucher) {
                await sendEmailSafely(
                  'voucher_purchase_receipt',
                  () => sendVoucherPurchaseReceipt({
                    to: purchase.user.email,
                    merchantName: purchase.merchant.name,
                    voucherCode,
                    amount: purchase.amount,
                    currency: purchase.currency.toUpperCase(),
                    voucherUrl,
                  }),
                  { recipient: purchase.user.email, voucherId: purchase.voucherId }
                );

                // Send voucher delivery email
                const validUntil = purchase.voucher.validTo.toISOString().split('T')[0];
                const value = purchase.voucher.type === 'percentage'
                  ? `${purchase.voucher.value / 100}%`
                  : `${purchase.currency.toUpperCase()} ${(purchase.voucher.value / 100).toFixed(2)}`;

                await sendEmailSafely(
                  'voucher_delivery',
                  () => sendVoucherDelivery({
                    to: purchase.user.email,
                    merchantName: purchase.merchant.name,
                    voucherCode,
                    value,
                    validUntil,
                    voucherUrl,
                  }),
                  { recipient: purchase.user.email, voucherId: purchase.voucherId }
                );
              }

              // Award credits to referrer if applicable (campaign already loaded in include above)
              const campaign = purchase.campaign || purchase.voucher?.campaign;
              if (referrerId && campaign?.creditPercentage) {
                const referrer = await prisma.user.findUnique({
                  where: { id: referrerId },
                });

                if (referrer) {
                  const creditAmount = Math.floor(
                    (purchase.amount * (campaign.creditPercentage || 0)) / 10000
                  ); // creditPercentage is in basis points

                  if (creditAmount > 0) {
                    const expiresAt = new Date();
                    expiresAt.setDate(expiresAt.getDate() + 60); // Default 60 days

                    await prisma.creditLedger.create({
                      data: {
                        merchantId: purchase.merchantId,
                        userId: referrerId,
                        amount: creditAmount,
                        currency: purchase.currency,
                        status: 'available', // Available immediately on purchase
                        source: 'referral_purchase',
                        sourceId: purchase.id,
                        expiresAt,
                      },
                    });

                    // Send credit earned email (non-blocking)
                    if (referrer.email) {
                      const balance = await getCreditBalance(referrerId, purchase.merchantId);
                      const walletUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/app/${purchase.merchant.slug}/wallet`;

                      await sendEmailSafely(
                        'credit_earned',
                        () => sendCreditEarned({
                          to: referrer.email!,
                          merchantName: purchase.merchant.name,
                          creditAmount: (creditAmount / 100).toFixed(2),
                          currency: purchase.currency.toUpperCase(),
                          totalBalance: (balance.total / 100).toFixed(2),
                          walletUrl,
                        }),
                        { recipient: referrer.email, referrerId, creditAmount }
                      );
                    }
                  }
                }
              }

              // Log audit
              await prisma.auditLog.create({
                data: {
                  merchantId: purchase.merchantId,
                  actorUserId: userId,
                  action: 'voucher_purchased',
                  payloadJson: {
                    purchaseId: purchase.id,
                    voucherId: purchase.voucherId,
                    amount: purchase.amount,
                    currency: purchase.currency,
                  },
                },
              });
            } catch (error) {
              logger.error('Stripe webhook: Error processing voucher purchase', {
                error: error instanceof Error ? error.message : 'Unknown error',
                purchaseId,
                voucherId,
              });
              // Don't fail webhook - log and continue
            }
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        loggers.payment('payment_intent_succeeded', paymentIntent.amount, paymentIntent.currency, {
          paymentIntentId: paymentIntent.id,
          metadata: paymentIntent.metadata,
        });

        // Payment intent succeeded - update purchase status if not already updated by checkout.session.completed
        // This handles cases where payment_intent.succeeded arrives before checkout.session.completed
        if (paymentIntent.metadata) {
          const { purchaseId, ticketId } = paymentIntent.metadata;
          
          try {
            if (ticketId && purchaseId) {
              // Update ticket purchase status if still pending
              await prisma.ticketPurchase.updateMany({
                where: {
                  id: purchaseId,
                  status: 'pending',
                },
                data: {
                  status: 'paid',
                },
              });
            } else if (purchaseId) {
              // Update voucher purchase status if still pending
              await prisma.voucherPurchase.updateMany({
                where: {
                  id: purchaseId,
                  status: 'pending',
                },
                data: {
                  status: 'paid',
                },
              });
            }
          } catch (error) {
            if (error instanceof Error) {
              captureException(error, {
                context: 'stripe_webhook_payment_intent_succeeded',
                paymentIntentId: paymentIntent.id,
              });
            }
            // Don't fail webhook - checkout.session.completed will handle it
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logger.error('Stripe webhook: Payment intent failed', {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          lastPaymentError: paymentIntent.last_payment_error?.message,
          metadata: paymentIntent.metadata,
        });

        // Handle failed payment - update purchase status
        if (paymentIntent.metadata?.purchaseId) {
          try {
            // Try ticket purchase first
            const ticketPurchase = await prisma.ticketPurchase.findUnique({
              where: { id: paymentIntent.metadata.purchaseId },
            });

            if (ticketPurchase) {
              await prisma.ticketPurchase.update({
                where: { id: paymentIntent.metadata.purchaseId },
                data: { status: 'failed' },
              });
              // Release ticket back to available
              await prisma.ticket.update({
                where: { id: ticketPurchase.ticketId },
                data: { status: 'available', purchasedAt: null },
              });
            } else {
              // Try voucher purchase
              await prisma.voucherPurchase.update({
                where: { id: paymentIntent.metadata.purchaseId },
                data: { status: 'failed' },
              });
            }
          } catch (error) {
            if (error instanceof Error) {
              captureException(error, {
                context: 'stripe_webhook_payment_failed_update',
                paymentIntentId: paymentIntent.id,
              });
            }
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const merchantId = subscription.metadata?.merchantId;

        let merchantSubscription = null;
        if (merchantId) {
          merchantSubscription = await prisma.merchantSubscription.upsert({
            where: { merchantId },
            update: {
              stripeCustomerId: subscription.customer as string,
              stripeSubscriptionId: subscription.id,
              priceId: subscription.items.data[0]?.price.id || null,
              status: subscription.status,
              trialEndsAt: subscription.trial_end
                ? new Date(subscription.trial_end * 1000)
                : null,
              currentPeriodEnd: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : null,
            },
            create: {
              merchantId,
              stripeCustomerId: subscription.customer as string,
              stripeSubscriptionId: subscription.id,
              priceId: subscription.items.data[0]?.price.id || null,
              status: subscription.status,
              trialEndsAt: subscription.trial_end
                ? new Date(subscription.trial_end * 1000)
                : null,
              currentPeriodEnd: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : null,
            },
          });
        } else {
          await prisma.merchantSubscription.updateMany({
            where: { stripeSubscriptionId: subscription.id },
            data: {
              stripeCustomerId: subscription.customer as string,
              priceId: subscription.items.data[0]?.price.id || null,
              status: subscription.status,
              trialEndsAt: subscription.trial_end
                ? new Date(subscription.trial_end * 1000)
                : null,
              currentPeriodEnd: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : null,
            },
          });
        }

        logger.info('Stripe webhook: Subscription updated', {
          subscriptionId: subscription.id,
          status: subscription.status,
          merchantId: merchantSubscription?.merchantId || merchantId,
        });

        break;
      }

      default:
        logger.debug('Stripe webhook: Unhandled event type', { eventType: event.type });
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook: Handler failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
