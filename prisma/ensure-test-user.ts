import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const merchant = await prisma.merchant.upsert({
    where: { slug: 'coffee-house' },
    create: {
      name: 'Coffee House',
      slug: 'coffee-house',
      country: 'US',
      defaultCurrency: 'USD',
    },
    update: {},
  });

  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    create: { email: 'test@example.com', name: 'Test User', emailVerified: new Date() },
    update: {},
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@coffee-house.com' },
    create: { email: 'admin@coffee-house.com', name: 'Admin User', emailVerified: new Date() },
    update: {},
  });

  await prisma.merchantMember.upsert({
    where: { merchantId_userId: { merchantId: merchant.id, userId: testUser.id } },
    create: { merchantId: merchant.id, userId: testUser.id, role: 'merchant_admin' },
    update: {},
  });

  await prisma.merchantMember.upsert({
    where: { merchantId_userId: { merchantId: merchant.id, userId: adminUser.id } },
    create: { merchantId: merchant.id, userId: adminUser.id, role: 'merchant_admin' },
    update: {},
  });

  console.log('Users ok: test@example.com / test123, admin@coffee-house.com -> merchant', merchant.slug);
}

main()
  .catch((e) => {
    console.error('❌ ensure-test-user failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());