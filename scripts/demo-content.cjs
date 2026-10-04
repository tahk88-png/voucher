#!/usr/bin/env node
/*
 * Clearly labelled demo content for an otherwise empty deployment: nine
 * demo merchants in Estonia, one or more per category, with 20 active
 * campaigns, so the landing page, /campaigns and /hub show what the platform
 * looks like. The UI shows a "Demo" badge and a sample-offer notice for them
 * (lib/demo-content.ts, lib/campaign-presentation.ts).
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

// Each campaign: name (shown with a "Demo" badge in the UI), Estonian copy,
// optional terms, price in cents (null = free voucher) and a discount:
// { percent } or { amount } in cents. Copy uses ordinary words for what is on
// offer, which is also what files the campaign under a category on /campaigns.
const MERCHANTS = [
  {
    slug: 'demo-kohvik-mokka',
    name: 'Kohvik Mokka (näidis)',
    city: 'Tallinn',
    campaigns: [
      {
        name: 'Hommikukohv ja värske croissant',
        copy: 'Alusta päeva kohvikus Mokka: iga hommikune kohv koos värske võise croissant’iga soodsamalt. Kehtib kõigi kohvijookide kohta.',
        terms: 'Kehtib E–R kell 8–11. Üks vautšer külastuse kohta.',
        price: null,
        discount: { percent: 20 },
      },
      {
        name: 'Nädalavahetuse brunch kahele',
        copy: 'Laud kahele, kohv või tee, värske mahl ja brunch-taldrik hooaja parimast toorainest. Broneeri laud ette.',
        terms: 'Kehtib L–P kell 10–14. Broneering vajalik.',
        price: 2400,
        discount: { percent: 15 },
      },
    ],
  },
  {
    slug: 'demo-ilusalong-helk',
    name: 'Ilusalong Helk (näidis)',
    city: 'Tartu',
    campaigns: [
      {
        name: 'Näohooldus -25%',
        copy: 'Sügavpuhastav näohooldus koos naha analüüsi ja niisutava maskiga. Kestus 75 minutit.',
        terms: 'Aeg broneerida vähemalt 24 h ette.',
        price: 3900,
        discount: { percent: 25 },
      },
      {
        name: 'Lõõgastav massaaž 60 min',
        copy: 'Klassikaline kogu keha massaaž, mis leevendab pingeid ja aitab argipäevast puhata.',
        terms: 'Aeg broneerida vähemalt 24 h ette.',
        price: 4500,
        discount: { percent: 20 },
      },
      {
        name: 'Maniküür geellakiga',
        copy: 'Hoolitsev maniküür ja vastupidav geellakk sinu valitud toonis.',
        terms: null,
        price: 2900,
        discount: { amount: 500 },
      },
    ],
  },
  {
    slug: 'demo-spordiklubi-tempo',
    name: 'Spordiklubi Tempo (näidis)',
    city: 'Tallinn',
    campaigns: [
      {
        name: 'Kuukaart jõusaali',
        copy: 'Piiramatu ligipääs jõusaali ja rühmatreeningutele terveks kuuks, sh sissejuhatav treening treeneriga.',
        terms: 'Kaart aktiveeritakse esimesel külastusel.',
        price: 3500,
        discount: { percent: 30 },
      },
      {
        name: 'Joogatund sõbraga',
        copy: 'Tule joogatundi koos sõbraga ja teine osaleja saab poole hinnaga. Sobib ka algajatele.',
        terms: 'Kehtib hommikustes ja lõunastes tundides.',
        price: null,
        discount: { percent: 50 },
      },
      {
        name: 'Padeli väljak kahele',
        copy: 'Tund aega padelit kahele koos reketite rendiga. Ideaalne esimene kokkupuude alaga.',
        terms: null,
        price: 3000,
        discount: { percent: 20 },
      },
    ],
  },
  {
    slug: 'demo-seikluspark-metsa',
    name: 'Seikluspark Metsa (näidis)',
    city: 'Pärnu',
    campaigns: [
      {
        name: 'Perepilet seiklusrajale',
        copy: 'Perepilet kahele täiskasvanule ja kuni kolmele lapsele kõigile seiklusradadele. Varustus ja instruktaaž hinna sees.',
        terms: 'Lapsed alates 4. eluaastast. Kehtib hooajal mai–september.',
        price: 5900,
        discount: { percent: 20 },
      },
      {
        name: 'Laste sünnipäevapakett',
        copy: 'Kahetunnine sünnipäevapidu kuni 10 lapsele: juhendaja, rajad ja pidulaud tordi jaoks.',
        terms: 'Broneering vähemalt 7 päeva ette.',
        price: 8900,
        discount: { percent: 10 },
      },
    ],
  },
  {
    slug: 'demo-restoran-sadam',
    name: 'Restoran Sadam (näidis)',
    city: 'Tallinn',
    campaigns: [
      {
        name: 'Kolmekäiguline õhtusöök kahele',
        copy: 'Kokkade valitud eelroog, pearoog ja magustoit kahele merevaate saalis.',
        terms: 'Kehtib P–N. Joogid ei sisaldu hinnas.',
        price: 6900,
        discount: { percent: 20 },
      },
      {
        name: 'Päevapraad tööpäeviti',
        copy: 'Tööpäeva lõuna kiirelt ja maitsvalt: päevasupp ja päevapraad.',
        terms: 'Kehtib E–R kell 11–15.',
        price: 900,
        discount: { amount: 200 },
      },
    ],
  },
  {
    slug: 'demo-teater-kuu',
    name: 'Teater Kuu (näidis)',
    city: 'Tartu',
    campaigns: [
      {
        name: 'Pilet etendusele „Suveöö“',
        copy: 'Lavastus armastusest ja segadustest ühel suveööl. Kestus 2 tundi vaheajaga.',
        terms: 'Kohad saalis vastavalt saadavusele.',
        price: 2200,
        discount: { percent: 25 },
      },
      {
        name: 'Kontserdiõhtu kahele',
        copy: 'Akustiline kontserdiõhtu kammersaalis, kaks piletit ja klaas vahuveini vaheajal.',
        terms: null,
        price: 3500,
        discount: { percent: 15 },
      },
    ],
  },
  {
    slug: 'demo-loovstuudio-savi',
    name: 'Loovstuudio Savi (näidis)',
    city: 'Viljandi',
    campaigns: [
      {
        name: 'Keraamika töötuba algajatele',
        copy: 'Kolmetunnine töötuba, kus valmistad käsitsi kaks tassi. Materjalid ja põletus hinna sees.',
        terms: 'Valmis tööd saab kätte kahe nädala pärast.',
        price: 4500,
        discount: { percent: 20 },
      },
      {
        name: 'Meistriklass: kedral vormimine',
        copy: 'Väikeses grupis meistriklass kogenud keraamikuga. Sobib neile, kes on savi juba katsunud.',
        terms: 'Grupis kuni 6 osalejat.',
        price: 6000,
        discount: { percent: 10 },
      },
    ],
  },
  {
    slug: 'demo-hotell-rannaliiv',
    name: 'Hotell Rannaliiv (näidis)',
    city: 'Haapsalu',
    campaigns: [
      {
        name: 'Nädalavahetuse majutus kahele',
        copy: 'Öö mereäärses hotellis kahele koos hommikusöögi ja hilise väljaregistreerimisega.',
        terms: 'Kehtib R–P öödel vastavalt vabadele tubadele.',
        price: 14900,
        discount: { percent: 20 },
      },
      {
        name: 'Romantiline puhkus mere ääres',
        copy: 'Kaks ööd merevaatega toas, kolmekäiguline õhtueine ja saunaõhtu.',
        terms: null,
        price: 32900,
        discount: { amount: 5000 },
      },
    ],
  },
  {
    slug: 'demo-matkaklubi-raba',
    name: 'Matkaklubi Raba (näidis)',
    city: 'Pärnu',
    campaigns: [
      {
        name: 'Kanuumatk Soomaal',
        copy: 'Pooleõhtune kanuumatk giidiga Soomaa jõgedel. Kanuu, aerud ja päästevestid hinna sees.',
        terms: 'Toimub mai–september. Ilmastikuolude tõttu võib aeg muutuda.',
        price: 3900,
        discount: { percent: 15 },
      },
      {
        name: 'Rabamatk räätsadega',
        copy: 'Kolmetunnine matk rabas räätsadega ja kogenud giidiga. Sobib igale tasemele.',
        terms: null,
        price: 2500,
        discount: { percent: 20 },
      },
    ],
  },
];

const DEMO_NOTE = 'NÄIDIS: see on näidispakkumine, mis näitab, kuidas pakkumised GiftHubis välja näevad. Seda ei saa osta ega lunastada.';

function discountRules(discount) {
  return discount.percent
    ? { type: 'percentage', value: discount.percent * 100, currency: 'EUR' }
    : { type: 'fixed_amount', value: discount.amount, currency: 'EUR' };
}

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
          name: `NÄIDIS · ${c.name}`,
          description: `${c.copy}\n\n${DEMO_NOTE}`,
          type: 'limited',
          startDate: start,
          endDate: end,
          price: c.price,
          discountRules: discountRules(c.discount),
          terms: `Näidistingimused, ei kehti päriselt.${c.terms ? ` ${c.terms}` : ''}`,
          status: 'active',
        },
      });
      await prisma.voucher.create({
        data: {
          merchantId: merchant.id,
          campaignId: campaign.id,
          status: 'paused',
          type: c.discount.percent ? 'percentage' : 'fixed_amount',
          value: c.discount.percent ? c.discount.percent * 100 : c.discount.amount,
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
