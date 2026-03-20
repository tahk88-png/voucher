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
import { withErrorHandler } from '@/lib/error-handler';

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
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
          const { purchaseId, ticketId, voucherId, campaignId, merchantId, userId, referrerId, type: purchaseType, recipientEmail: metaRecipientEmail } = session.metadata;
          
          // Handle ticket purchase
          if (ticketId && purchaseId && merchantId && userId) {
            try {
              // Idempotency guard: skip if already processed
              const existingTicketPurchase = await prisma.ticketPurchase.findUnique({
                where: { id: purchaseId },
                select: { status: true },
              });
              if (existingTicketPurchase?.status === 'paid') {
                logger.info('Webhook: Ticket purchase already processed, skipping', { purchaseId });
                break;
              }

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
              // Idempotency guard: skip if already processed
              const existingVoucherPurchase = await prisma.voucherPurchase.findUnique({
                where: { id: purchaseId },
                select: { status: true },
              });
              if (existingVoucherPurchase?.status === 'paid') {
                logger.info('Webhook: Voucher purchase already processed, skipping', { purchaseId });
                break;
              }

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

          // Handle gift card purchase
          if (purchaseType === 'gift_card' && purchaseId && merchantId && userId) {
            try {
              // Idempotency guard: skip if already processed
              const existingGcPurchase = await prisma.giftCardPurchase.findUnique({
                where: { id: purchaseId },
                select: { status: true },
              });
              if (existingGcPurchase?.status === 'paid') {
                logger.info('Webhook: Gift card purchase already processed, skipping', { purchaseId });
                break;
              }

              const gcPurchase = await prisma.giftCardPurchase.update({
                where: { id: purchaseId },
                data: {
                  status: 'paid',
                  stripeSessionId: session.id,
                },
                include: {
                  giftCard: true,
                  merchant: true,
                  user: true,
                },
              });

              // Send gift card to recipient if email provided
              const recipientAddr = gcPurchase.recipientEmail || metaRecipientEmail;
              if (recipientAddr) {
                const giftCardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/g/${gcPurchase.giftCard.code}`;
                await sendEmailSafely(
                  'gift_card_delivery',
                  () => sendVoucherDelivery({
                    to: recipientAddr,
                    merchantName: gcPurchase.merchant.name,
                    voucherCode: gcPurchase.giftCard.code,
                    value: `${gcPurchase.giftCard.currency} ${(gcPurchase.giftCard.amount / 100).toFixed(2)}`,
                    validUntil: gcPurchase.giftCard.validTo?.toISOString().split('T')[0] || 'No expiry',
                    voucherUrl: giftCardUrl,
                  }),
                  { recipient: recipientAddr, giftCardId: gcPurchase.giftCardId }
                );
              }

              // Log audit
              await prisma.auditLog.create({
                data: {
                  merchantId: gcPurchase.merchantId,
                  actorUserId: userId,
                  action: 'gift_card_purchased',
                  payloadJson: {
                    purchaseId: gcPurchase.id,
                    giftCardId: gcPurchase.giftCardId,
                    amount: gcPurchase.amount,
                    currency: gcPurchase.currency,
                    recipientEmail: recipientAddr || null,
                  },
                },
              });
            } catch (error) {
              logger.error('Stripe webhook: Error processing gift card purchase', {
                error: error instanceof Error ? error.message : 'Unknown error',
                purchaseId,
              });
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
          
          const piType = paymentIntent.metadata.type;
          try {
            if (piType === 'gift_card' && purchaseId) {
              await prisma.giftCardPurchase.updateMany({
                where: { id: purchaseId, status: 'pending' },
                data: { status: 'paid' },
              });
            } else if (ticketId && purchaseId) {
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
            const failedType = paymentIntent.metadata.type;
            if (failedType === 'gift_card') {
              await prisma.giftCardPurchase.updateMany({
                where: { id: paymentIntent.metadata.purchaseId },
                data: { status: 'failed' },
              });
            } else {
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

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string | null;

        logger.error('Stripe webhook: Invoice payment failed', {
          invoiceId: invoice.id,
          subscriptionId,
          customerId: invoice.customer,
          amountDue: invoice.amount_due,
          attemptCount: invoice.attempt_count,
        });

        if (subscriptionId) {
          try {
            // Update subscription status to past_due
            await prisma.merchantSubscription.updateMany({
              where: { stripeSubscriptionId: subscriptionId },
              data: { status: 'past_due' },
            });

            // Find merchant for audit log
            const sub = await prisma.merchantSubscription.findFirst({
              where: { stripeSubscriptionId: subscriptionId },
              select: { merchantId: true },
            });

            if (sub) {
              await prisma.auditLog.create({
                data: {
                  merchantId: sub.merchantId,
                  actorUserId: 'system',
                  action: 'subscription_payment_failed',
                  payloadJson: {
                    invoiceId: invoice.id,
                    subscriptionId,
                    amountDue: invoice.amount_due,
                    attemptCount: invoice.attempt_count,
                  },
                },
              });
            }
          } catch (error) {
            if (error instanceof Error) {
              captureException(error, {
                context: 'stripe_webhook_invoice_payment_failed',
                invoiceId: invoice.id,
                subscriptionId,
              });
            }
          }
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const refundAmount = charge.amount_refunded;

        logger.info('Stripe webhook: Charge refunded', {
          chargeId: charge.id,
          amountRefunded: refundAmount,
          currency: charge.currency,
          paymentIntentId: charge.payment_intent,
        });

        try {
          // Find the purchase by stripe session or payment intent
          const paymentIntentId = charge.payment_intent as string | null;
          if (paymentIntentId) {
            // Check if a RefundRecord already exists for this charge (idempotency)
            const existing = await prisma.refundRecord.findFirst({
              where: { stripeRefundId: charge.id },
            });
            if (!existing) {
              // Mark purchase as refunded if we can find it via metadata
              const metadata = charge.metadata;
              if (metadata?.purchaseId) {
                const isTicket = !!metadata.ticketId;
                const isGiftCard = metadata.type === 'gift_card';

                if (isGiftCard) {
                  await prisma.giftCardPurchase.updateMany({
                    where: { id: metadata.purchaseId, status: 'paid' },
                    data: { status: 'refunded' },
                  });
                  // Cancel the gift card on refund
                  if (metadata.giftCardId) {
                    await prisma.giftCard.updateMany({
                      where: { id: metadata.giftCardId, status: 'active' },
                      data: { status: 'cancelled' },
                    });
                  }
                } else if (isTicket) {
                  await prisma.ticketPurchase.updateMany({
                    where: { id: metadata.purchaseId, status: 'paid' },
                    data: { status: 'refunded' },
                  });
                  // Release ticket
                  if (metadata.ticketId) {
                    await prisma.ticket.updateMany({
                      where: { id: metadata.ticketId, status: 'sold' },
                      data: { status: 'available', purchasedAt: null },
                    });
                  }
                } else {
                  await prisma.voucherPurchase.updateMany({
                    where: { id: metadata.purchaseId, status: 'paid' },
                    data: { status: 'refunded' },
                  });
                }

                await prisma.refundRecord.create({
                  data: {
                    purchaseId: metadata.purchaseId,
                    purchaseType: isGiftCard ? 'gift_card' : isTicket ? 'ticket' : 'voucher',
                    stripeRefundId: charge.id,
                    actorUserId: 'stripe',
                    amountRefunded: refundAmount,
                    currency: charge.currency,
                    isPartial: refundAmount < charge.amount,
                    reason: 'stripe_refund',
                    status: 'refund_succeeded',
                  },
                });
              }
            }
          }
        } catch (error) {
          if (error instanceof Error) {
            captureException(error, {
              context: 'stripe_webhook_charge_refunded',
              chargeId: charge.id,
            });
          }
        }
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;

        logger.error('Stripe webhook: Dispute/chargeback created', {
          disputeId: dispute.id,
          chargeId: dispute.charge,
          amount: dispute.amount,
          currency: dispute.currency,
          reason: dispute.reason,
          status: dispute.status,
        });

        try {
          const charge = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
          const metadata = dispute.metadata || {};

          // Log dispute in audit for visibility
          if (metadata.merchantId) {
            await prisma.auditLog.create({
              data: {
                merchantId: metadata.merchantId,
                actorUserId: 'system',
                action: 'payment_dispute_created',
                payloadJson: {
                  disputeId: dispute.id,
                  chargeId: charge,
                  amount: dispute.amount,
                  currency: dispute.currency,
                  reason: dispute.reason,
                },
              },
            });
          }

          // Mark related purchase if identifiable
          if (metadata.purchaseId) {
            const isTicket = !!metadata.ticketId;
            if (isTicket) {
              await prisma.ticketPurchase.updateMany({
                where: { id: metadata.purchaseId },
                data: { status: 'disputed' },
              });
            } else {
              await prisma.voucherPurchase.updateMany({
                where: { id: metadata.purchaseId },
                data: { status: 'disputed' },
              });
            }
          }
        } catch (error) {
          if (error instanceof Error) {
            captureException(error, {
              context: 'stripe_webhook_dispute_created',
              disputeId: dispute.id,
            });
          }
        }
        break;
      }

      default:
        logger.debug('Stripe webhook: Unhandled event type', { eventType: event.type });
        break;
    }

    return NextResponse.json({ received: true });
  });
}
