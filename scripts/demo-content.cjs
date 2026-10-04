#!/usr/bin/env node
/*
 * Clearly labelled demo content for an otherwise empty deployment: a few
 * demo merchants in Estonia with active campaigns, so the landing page and
 * /campaigns show what the platform looks like.
 *
 *   node scripts/demo-content.cjs add      # create or refresh (idempotent)
 *   node scripts/demo-content.cjs remove   # delete every demo record
 *
 * On the server, inside the running app container (the image has
 * @prisma/client and DATABASE_URL):
 *   curl -fsSL <raw URL of this file> | docker exec -i -w /srv/voucher voucher-app node - add
 *
 * Safety:
 * - Every demo merchant has a slug starting with "demo-" and "(näidis)" in
 *   its name; every campaign name starts with "NÄIDIS" and its description
 *   says it is a demo. `remove` deletes by that slug prefix only.
 * - Demo vouchers are created "paused", so nothing here can be bought or
 *   claimed even once Stripe is configured (purchase requires "published").
 */
const { PrismaClient } = require('@prisma/client');

// Must match DEMO_SLUG_PREFIX in lib/demo-content.ts (sitemap + noindex rely on it).
const SLUG_PREFIX = 'demo-';
const DAY = 24 * 60 * 60 * 1000;

const MERCHANTS = [
  {
    slug: 'demo-kohvik-mokka',
    name: 'Kohvik Mokka (näidis)',
    city: 'Tallinn',
    campaigns: [
      { name: 'NÄIDIS · Hommikukohv + sai', about: 'cafe breakfast: coffee and a pastry', percent: 20, price: null },
      { name: 'NÄIDIS · Nädalavahetuse brunch kahele', about: 'weekend brunch for two at the cafe', percent: 15, price: 2400 },
    ],
  },
  {
    slug: 'demo-ilusalong-helk',
    name: 'Ilusalong Helk (näidis)',
    city: 'Tartu',
    campaigns: [
      { name: 'NÄIDIS · Näohooldus -25%', about: 'beauty salon facial and skincare', percent: 25, price: 3900 },
      { name: 'NÄIDIS · Lõõgastav massaaž 60 min', about: 'relaxing massage at the spa', percent: 20, price: 4500 },
    ],
  },
  {
    slug: 'demo-spordiklubi-tempo',
    name: 'Spordiklubi Tempo (näidis)',
    city: 'Tallinn',
    campaigns: [
      { name: 'NÄIDIS · Kuukaart jõusaali', about: 'gym and fitness monthly pass', percent: 30, price: 3500 },
      { name: 'NÄIDIS · Joogatund sõbraga', about: 'yoga class, bring a friend', percent: 50, price: null },
    ],
  },
  {
    slug: 'demo-seikluspark-metsa',
    name: 'Seikluspark Metsa (näidis)',
    city: 'Pärnu',
    campaigns: [
      { name: 'NÄIDIS · Perepilet seiklusrajale', about: 'outdoor adventure trail for the family', percent: 20, price: 5900 },
      { name: 'NÄIDIS · Sünnipäevapakett lastele', about: 'kids birthday party package', percent: 10, price: 8900 },
    ],
  },
];

async function add(prisma) {
  const now = new Date();
  const start = new Date(now.getTime() - DAY);
  const end = new Date(now.getTime() + 90 * DAY);
  let campaigns = 0;

  for (const m of MERCHANTS) {
    const merchant = await prisma.merchant.upsert({
      where: { slug: m.slug },
      update: { name: m.name, city: m.city, isActive: true, deletedAt: null },
      create: {
        slug: m.slug,
        name: m.name,
        country: 'EE',
        city: m.city,
        defaultCurrency: 'EUR',
        defaultLocale: 'et',
        dataResidency: 'EU',
        isActive: true,
      },
    });

    // Refresh: replace this merchant's demo campaigns (and their vouchers).
    await prisma.voucher.deleteMany({ where: { merchantId: merchant.id } });
    await prisma.campaign.deleteMany({ where: { merchantId: merchant.id } });

    for (const c of m.campaigns) {
      const campaign = await prisma.campaign.create({
        data: {
          merchantId: merchant.id,
          name: c.name,
          description: `NÄIDIS (demo ${c.about}). See ei ole päris pakkumine ja seda ei saa osta ega lunastada.`,
          type: 'limited',
          startDate: start,
          endDate: end,
          price: c.price,
          discountRules: { type: 'percentage', value: c.percent * 100, currency: 'EUR' },
          terms: 'Näidis. Ei kehti.',
          status: 'active',
        },
      });
      await prisma.voucher.create({
        data: {
          merchantId: merchant.id,
          campaignId: campaign.id,
          status: 'paused',
          type: 'percentage',
          value: c.percent * 100,
          currency: 'EUR',
          validFrom: start,
          validTo: end,
          codePrefix: 'DEMO',
        },
      });
      campaigns += 1;
    }
  }
  console.log(`Demo content ready: ${MERCHANTS.length} merchants, ${campaigns} campaigns (vouchers paused, not purchasable).`);
}

async function remove(prisma) {
  const merchants = await prisma.merchant.findMany({
    where: { slug: { startsWith: SLUG_PREFIX } },
    select: { id: true, slug: true },
  });
  const ids = merchants.map((m) => m.id);
  if (ids.length === 0) {
    console.log('No demo content found.');
    return;
  }
  const vouchers = await prisma.voucher.deleteMany({ where: { merchantId: { in: ids } } });
  const campaigns = await prisma.campaign.deleteMany({ where: { merchantId: { in: ids } } });
  const deleted = await prisma.merchant.deleteMany({ where: { id: { in: ids } } });
  console.log(`Removed ${deleted.count} demo merchants, ${campaigns.count} campaigns, ${vouchers.count} vouchers.`);
}

async function main() {
  const command = process.argv[2];
  if (command !== 'add' && command !== 'remove') {
    console.error('usage: node scripts/demo-content.cjs <add|remove>');
    process.exit(2);
  }
  const prisma = new PrismaClient();
  try {
    await (command === 'add' ? add(prisma) : remove(prisma));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
