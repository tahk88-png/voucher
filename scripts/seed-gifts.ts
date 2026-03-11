/**
 * Gift catalog seed script.
 * Run: npx tsx scripts/seed-gifts.ts
 *
 * Creates:
 *  - 6 gift categories
 *  - 8 gift occasions
 *  - 6 gift personas
 *  - 30 sample gift products (linked to the first merchant)
 *  - 4 curated feed modules
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: 'experiences', name: 'Experiences', description: 'Unforgettable adventures and activities', icon: '🎭' },
  { slug: 'dining', name: 'Dining & Food', description: 'Restaurant vouchers and food experiences', icon: '🍽️' },
  { slug: 'wellness', name: 'Wellness & Spa', description: 'Relaxation and self-care gifts', icon: '🧘' },
  { slug: 'digital', name: 'Digital & Tech', description: 'Online services and subscriptions', icon: '💻' },
  { slug: 'fashion', name: 'Fashion & Style', description: 'Clothing and accessories', icon: '👗' },
  { slug: 'home', name: 'Home & Living', description: 'Home décor and household items', icon: '🏠' },
];

const OCCASIONS = [
  { slug: 'birthday', name: 'Birthday', description: 'Make their day special', icon: '🎂', isSeasonal: false },
  { slug: 'christmas', name: 'Christmas', description: 'Festive season gifts', icon: '🎄', isSeasonal: true },
  { slug: 'valentines', name: "Valentine's Day", description: 'Share the love', icon: '❤️', isSeasonal: true },
  { slug: 'mothers-day', name: "Mother's Day", description: "Show mum you care", icon: '💐', isSeasonal: true },
  { slug: 'fathers-day', name: "Father's Day", description: 'Celebrate dad', icon: '👔', isSeasonal: true },
  { slug: 'graduation', name: 'Graduation', description: 'Celebrate achievements', icon: '🎓', isSeasonal: false },
  { slug: 'wedding', name: 'Wedding', description: 'A perfect wedding gift', icon: '💍', isSeasonal: false },
  { slug: 'just-because', name: 'Just Because', description: 'No reason needed', icon: '🎁', isSeasonal: false },
];

const PERSONAS = [
  { slug: 'adventurer', name: 'Adventurer', description: 'Loves outdoor activities and thrills', tags: ['outdoor', 'sports', 'travel'] },
  { slug: 'foodie', name: 'Foodie', description: 'Passionate about food and dining', tags: ['food', 'dining', 'cooking'] },
  { slug: 'homebody', name: 'Homebody', description: 'Prefers cozy home comforts', tags: ['home', 'cozy', 'relaxation'] },
  { slug: 'tech-lover', name: 'Tech Lover', description: 'Always excited about the latest tech', tags: ['tech', 'digital', 'gadgets'] },
  { slug: 'wellness-seeker', name: 'Wellness Seeker', description: 'Focused on health and self-care', tags: ['wellness', 'spa', 'yoga'] },
  { slug: 'fashion-forward', name: 'Fashion Forward', description: 'Style-conscious trendsetter', tags: ['fashion', 'style', 'beauty'] },
];

const SAMPLE_PRODUCTS = [
  { title: 'Hot Air Balloon Ride', description: 'Soar above the city at sunrise', price: 18900, category: 'experiences', tags: ['outdoor', 'adventure'], personas: ['adventurer'], occasions: ['birthday', 'graduation'] },
  { title: 'Fine Dining for Two', description: 'A romantic 4-course dinner at a top restaurant', price: 12000, category: 'dining', tags: ['food', 'romantic'], personas: ['foodie'], occasions: ['valentines', 'birthday'] },
  { title: 'Spa Day Retreat', description: 'Full-day spa with treatments and sauna', price: 9500, category: 'wellness', tags: ['spa', 'relaxation'], personas: ['wellness-seeker'], occasions: ['mothers-day', 'birthday'] },
  { title: 'Online Course Bundle', description: '12 months access to premium learning platform', price: 4900, category: 'digital', tags: ['education', 'digital'], personas: ['tech-lover'], occasions: ['graduation', 'just-because'] },
  { title: 'Fashion Gift Card', description: 'Shop at 500+ fashion brands', price: 5000, category: 'fashion', tags: ['fashion', 'shopping'], personas: ['fashion-forward'], occasions: ['birthday', 'christmas'] },
  { title: 'Home Decor Voucher', description: 'Create your dream living space', price: 7500, category: 'home', tags: ['home', 'interior'], personas: ['homebody'], occasions: ['wedding', 'christmas'] },
  { title: 'Cooking Class Experience', description: 'Learn from a Michelin-star chef', price: 8500, category: 'experiences', tags: ['cooking', 'food'], personas: ['foodie'], occasions: ['birthday', 'just-because'] },
  { title: 'Yoga & Mindfulness Retreat', description: 'Weekend retreat with yoga, meditation, and meals', price: 29900, category: 'wellness', tags: ['yoga', 'wellness', 'relaxation'], personas: ['wellness-seeker'], occasions: ['mothers-day', 'birthday'] },
  { title: 'Streaming Service Annual', description: '1-year premium streaming subscription', price: 9900, category: 'digital', tags: ['digital', 'entertainment'], personas: ['homebody', 'tech-lover'], occasions: ['christmas', 'birthday'] },
  { title: 'Kayaking Adventure', description: 'Half-day guided coastal kayak tour', price: 6500, category: 'experiences', tags: ['outdoor', 'adventure', 'sports'], personas: ['adventurer'], occasions: ['birthday', 'graduation'] },
  { title: 'Artisan Coffee Subscription', description: '3 months of specialty coffee delivered', price: 4500, category: 'dining', tags: ['coffee', 'food', 'subscription'], personas: ['foodie', 'homebody'], occasions: ['just-because', 'christmas'] },
  { title: 'Smart Watch Gift Card', description: 'Pick your perfect wearable', price: 24900, category: 'digital', tags: ['tech', 'gadgets', 'fitness'], personas: ['tech-lover', 'adventurer'], occasions: ['birthday', 'graduation'] },
  { title: 'Personal Styling Session', description: '2-hour session with a professional stylist', price: 11000, category: 'fashion', tags: ['fashion', 'style', 'personal'], personas: ['fashion-forward'], occasions: ['birthday', 'just-because'] },
  { title: 'Botanical Garden Tour', description: 'Guided sunset tour with wine tasting', price: 5500, category: 'experiences', tags: ['nature', 'relaxation'], personas: ['homebody', 'wellness-seeker'], occasions: ['mothers-day', 'valentines'] },
  { title: 'Wine Tasting Experience', description: 'Tour a local vineyard with 5-wine tasting', price: 7200, category: 'dining', tags: ['wine', 'food', 'romantic'], personas: ['foodie'], occasions: ['valentines', 'birthday'] },
  { title: 'Home Cooking Box', description: '4-week gourmet ingredient subscription', price: 12900, category: 'dining', tags: ['cooking', 'food', 'subscription'], personas: ['foodie', 'homebody'], occasions: ['christmas', 'just-because'] },
  { title: 'Rock Climbing Class', description: 'Beginner indoor climbing with instructor', price: 4200, category: 'experiences', tags: ['sports', 'adventure', 'outdoor'], personas: ['adventurer'], occasions: ['birthday', 'graduation'] },
  { title: 'Luxury Candle Set', description: 'Hand-poured soy candles with essential oils', price: 3500, category: 'home', tags: ['home', 'cozy', 'luxury'], personas: ['homebody', 'wellness-seeker'], occasions: ['christmas', 'birthday', 'mothers-day'] },
  { title: 'Photography Masterclass', description: '3-hour outdoor portrait photography class', price: 7800, category: 'experiences', tags: ['art', 'creative', 'outdoor'], personas: ['adventurer'], occasions: ['just-because', 'birthday'] },
  { title: 'Fitness App Subscription', description: '6 months premium fitness & nutrition tracking', price: 3900, category: 'digital', tags: ['fitness', 'wellness', 'digital'], personas: ['wellness-seeker', 'adventurer'], occasions: ['graduation', 'just-because'] },
  { title: 'Jewellery Gift Voucher', description: 'Handcrafted fine jewellery boutique', price: 15000, category: 'fashion', tags: ['jewellery', 'luxury', 'fashion'], personas: ['fashion-forward'], occasions: ['valentines', 'birthday', 'wedding'] },
  { title: 'City Break Experience', description: '2-night hotel stay in a European capital', price: 39900, category: 'experiences', tags: ['travel', 'adventure', 'romantic'], personas: ['adventurer'], occasions: ['birthday', 'valentines', 'graduation'] },
  { title: 'Afternoon Tea for Two', description: 'Traditional English afternoon tea at a 5-star hotel', price: 6800, category: 'dining', tags: ['food', 'romantic', 'luxury'], personas: ['foodie'], occasions: ['mothers-day', 'valentines'] },
  { title: 'Art Supplies Gift Card', description: 'Everything a creative artist needs', price: 5000, category: 'home', tags: ['art', 'creative'], personas: ['homebody'], occasions: ['birthday', 'just-because'] },
  { title: 'Pilates Studio Membership', description: '1-month unlimited pilates classes', price: 8900, category: 'wellness', tags: ['fitness', 'wellness', 'pilates'], personas: ['wellness-seeker'], occasions: ['birthday', 'just-because'] },
  { title: 'Gaming Gift Card', description: 'Top up on any gaming platform', price: 5000, category: 'digital', tags: ['gaming', 'digital', 'tech'], personas: ['tech-lover'], occasions: ['birthday', 'christmas'] },
  { title: 'Sunset Sailing Trip', description: '3-hour sunset yacht sailing experience', price: 14500, category: 'experiences', tags: ['outdoor', 'romantic', 'adventure'], personas: ['adventurer'], occasions: ['birthday', 'valentines'] },
  { title: 'Gourmet Chocolate Box', description: 'Artisan chocolates from award-winning chocolatier', price: 2500, category: 'dining', tags: ['food', 'luxury', 'sweet'], personas: ['foodie', 'homebody'], occasions: ['valentines', 'christmas', 'mothers-day'] },
  { title: 'Language Learning App', description: '12-month premium language learning subscription', price: 7900, category: 'digital', tags: ['education', 'digital', 'languages'], personas: ['tech-lover'], occasions: ['graduation', 'just-because'] },
  { title: 'Skincare Gift Set', description: 'Curated luxury skincare routine set', price: 8500, category: 'wellness', tags: ['beauty', 'skincare', 'wellness'], personas: ['fashion-forward', 'wellness-seeker'], occasions: ['birthday', 'mothers-day', 'christmas'] },
];

async function main() {
  console.log('🎁 Seeding gift catalog...\n');

  // Get first available merchant
  const merchant = await prisma.merchant.findFirst({ where: { isActive: true } });
  if (!merchant) {
    console.error('❌ No active merchant found. Create a merchant first.');
    process.exit(1);
  }
  console.log(`✅ Using merchant: ${merchant.name} (${merchant.id})\n`);

  // Upsert categories
  console.log('📂 Creating categories...');
  const categoryMap = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const result = await (prisma as any).giftCategory.upsert({
      where: { slug: cat.slug },
      create: { ...cat, isActive: true },
      update: { name: cat.name, description: cat.description },
    });
    categoryMap.set(cat.slug, result.id);
    console.log(`  ✓ ${cat.name}`);
  }

  // Upsert occasions
  console.log('\n🎉 Creating occasions...');
  const occasionMap = new Map<string, string>();
  for (const occ of OCCASIONS) {
    const result = await (prisma as any).giftOccasion.upsert({
      where: { slug: occ.slug },
      create: { ...occ, isActive: true, sortOrder: 0 },
      update: { name: occ.name },
    });
    occasionMap.set(occ.slug, result.id);
    console.log(`  ✓ ${occ.name}`);
  }

  // Upsert personas
  console.log('\n👤 Creating personas...');
  const personaMap = new Map<string, string>();
  for (const p of PERSONAS) {
    const result = await (prisma as any).giftPersona.upsert({
      where: { slug: p.slug },
      create: { ...p, isActive: true },
      update: { name: p.name },
    });
    personaMap.set(p.slug, result.id);
    console.log(`  ✓ ${p.name}`);
  }

  // Create products
  console.log('\n🛍️ Creating gift products...');
  let created = 0;
  for (const product of SAMPLE_PRODUCTS) {
    const categoryId = categoryMap.get(product.category);
    if (!categoryId) continue;

    const occasionIds = product.occasions
      .map(slug => occasionMap.get(slug))
      .filter(Boolean) as string[];

    const personaIds = product.personas
      .map(slug => personaMap.get(slug))
      .filter(Boolean) as string[];

    const existing = await (prisma as any).giftProduct.findFirst({
      where: { title: product.title, merchantId: merchant.id },
    });

    if (!existing) {
      await (prisma as any).giftProduct.create({
        data: {
          title: product.title,
          description: product.description,
          price: product.price,
          currency: 'EUR',
          merchantId: merchant.id,
          categoryId,
          isActive: true,
          isFeatured: Math.random() > 0.7,
          tags: product.tags,
          occasionIds,
          personaIds,
          engagementScore: Math.random() * 0.8 + 0.1,
          viewCount: Math.floor(Math.random() * 500),
          purchaseCount: Math.floor(Math.random() * 50),
        },
      });
      created++;
    }
    process.stdout.write(`  ✓ ${product.title}\n`);
  }

  // Create feed modules
  console.log('\n📱 Creating feed modules...');
  const moduleTypes = [
    { type: 'featured', title: 'Featured Gifts', description: 'Editor\'s picks of the week', sortOrder: 1 },
    { type: 'trending', title: 'Trending Now', description: 'Most popular gifts this week', sortOrder: 2 },
    { type: 'seasonal', title: 'Seasonal Picks', description: 'Perfect for the season', sortOrder: 3 },
    { type: 'budget', title: 'Gifts Under €50', description: 'Great gifts that won\'t break the bank', sortOrder: 4 },
  ];

  for (const module of moduleTypes) {
    const existing = await (prisma as any).giftFeedModule.findFirst({ where: { type: module.type } });
    if (!existing) {
      await (prisma as any).giftFeedModule.create({
        data: { ...module, isActive: true, config: {} },
      });
    }
    console.log(`  ✓ ${module.title}`);
  }

  console.log(`\n✅ Gift catalog seeded successfully!`);
  console.log(`   Categories: ${CATEGORIES.length}`);
  console.log(`   Occasions: ${OCCASIONS.length}`);
  console.log(`   Personas: ${PERSONAS.length}`);
  console.log(`   Products created: ${created}/${SAMPLE_PRODUCTS.length}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
