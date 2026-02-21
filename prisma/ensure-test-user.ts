import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/passwords';

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

  const testUserEmail = process.env.TEST_USER_EMAIL ?? 'test@example.com';
  const testUserPassword = process.env.TEST_USER_PASSWORD ?? 'test123';
  const adminEmail = process.env.TEST_ADMIN_EMAIL ?? 'admin@coffee-house.com';
  const adminPassword = process.env.TEST_ADMIN_PASSWORD ?? 'admin123';
  const staffEmail = process.env.TEST_STAFF_EMAIL ?? 'staff@coffee-house.com';
  const staffPassword = process.env.TEST_STAFF_PASSWORD ?? 'staff123';

  const testUserHash = await hashPassword(testUserPassword);
  const adminHash = await hashPassword(adminPassword);
  const staffHash = await hashPassword(staffPassword);

  const testUser = await prisma.user.upsert({
    where: { email: testUserEmail },
    create: {
      email: testUserEmail,
      name: 'Test User',
      passwordHash: testUserHash,
      emailVerified: new Date(),
    },
    update: {
      name: 'Test User',
      passwordHash: testUserHash,
      emailVerified: new Date(),
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: 'Admin User',
      passwordHash: adminHash,
      emailVerified: new Date(),
    },
    update: {
      name: 'Admin User',
      passwordHash: adminHash,
      emailVerified: new Date(),
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: staffEmail },
    create: {
      email: staffEmail,
      name: 'Staff User',
      passwordHash: staffHash,
      emailVerified: new Date(),
    },
    update: {
      name: 'Staff User',
      passwordHash: staffHash,
      emailVerified: new Date(),
    },
  });

  await prisma.merchantMember.upsert({
    where: { merchantId_userId: { merchantId: merchant.id, userId: testUser.id } },
    create: { merchantId: merchant.id, userId: testUser.id, role: 'merchant_admin' },
    update: { role: 'merchant_admin' },
  });

  await prisma.merchantMember.upsert({
    where: { merchantId_userId: { merchantId: merchant.id, userId: adminUser.id } },
    create: { merchantId: merchant.id, userId: adminUser.id, role: 'merchant_admin' },
    update: { role: 'merchant_admin' },
  });

  await prisma.merchantMember.upsert({
    where: { merchantId_userId: { merchantId: merchant.id, userId: staffUser.id } },
    create: { merchantId: merchant.id, userId: staffUser.id, role: 'merchant_staff' },
    update: { role: 'merchant_staff' },
  });

  console.log(
    'Users ok:',
    `${testUserEmail} / ${testUserPassword}, ${adminEmail} / ${adminPassword}, ${staffEmail} / ${staffPassword}`,
    '-> merchant',
    merchant.slug
  );
}

main()
  .catch((error) => {
    console.error('ensure-test-user failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

