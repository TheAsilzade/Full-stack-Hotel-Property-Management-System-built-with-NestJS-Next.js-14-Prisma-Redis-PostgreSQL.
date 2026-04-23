import { PrismaClient, BedType, RoomStatus } from '@prisma/client';
// Use require to avoid bcryptjs type declaration issues in seed context
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Tenant ──────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-hotel' },
    update: {},
    create: {
      name: 'Demo Hotel Group',
      slug: 'demo-hotel',
      currency: 'USD',
      timezone: 'Europe/Istanbul',
      isActive: true,
    },
  });
  console.log(`✅ Tenant: ${tenant.name} (id: ${tenant.id})`);

  // ── Property ─────────────────────────────────────────────────
  const property = await prisma.property.upsert({
    where: { id: 'seed-property-001' },
    update: {},
    create: {
      id: 'seed-property-001',
      tenantId: tenant.id,
      name: 'Grand Demo Hotel',
      code: 'GDH',
      address: '123 Main Street',
      city: 'Istanbul',
      country: 'Turkey',
      phone: '+90 212 000 0000',
      email: 'info@granddemhotel.com',
      timezone: 'Europe/Istanbul',
      currencyCode: 'USD',
      isActive: true,
    },
  });
  console.log(`✅ Property: ${property.name} (id: ${property.id})`);

  // ── Super-admin Role ─────────────────────────────────────────
  const adminRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Super Admin' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Super Admin',
      description: 'Full access to all features',
      isSystem: true,
    },
  });
  console.log(`✅ Role: ${adminRole.name}`);

  // ── Standard Roles ───────────────────────────────────────────
  const standardRoles = [
    { name: 'Tenant Admin', description: 'Full tenant administration' },
    { name: 'Property Manager', description: 'Manage property settings and staff' },
    { name: 'Front Desk Manager', description: 'Manage front desk operations' },
    { name: 'Receptionist', description: 'Handle check-in, check-out and reservations' },
    { name: 'Housekeeping Manager', description: 'Manage housekeeping tasks' },
    { name: 'Housekeeper', description: 'Execute housekeeping tasks' },
    { name: 'Maintenance Staff', description: 'Handle maintenance tickets' },
    { name: 'Accountant', description: 'Access financial reports and folios' },
    { name: 'Revenue Manager', description: 'Manage rates and revenue reports' },
    { name: 'Read Only', description: 'View-only access' },
  ];
  for (const r of standardRoles) {
    await prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: r.name } },
      update: {},
      create: { tenantId: tenant.id, name: r.name, description: r.description, isSystem: true },
    });
  }
  console.log(`✅ Standard roles seeded`);

  // ── Wildcard Permission ───────────────────────────────────────
  // Gives Super Admin the '*' permission that bypasses all permission checks
  const wildcardPermission = await prisma.permission.upsert({
    where: { resource_action: { resource: '*', action: '*' } },
    update: {},
    create: {
      resource: '*',
      action: '*',
      description: 'Full access wildcard',
    },
  });

  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: adminRole.id, permissionId: wildcardPermission.id } },
    update: {},
    create: { roleId: adminRole.id, permissionId: wildcardPermission.id },
  });
  console.log(`✅ Permission: Super Admin → * (wildcard)`);

  // ── User ─────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin1234!', 10);
  const user = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@demo.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.com',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true,
      userRoles: {
        create: { roleId: adminRole.id },
      },
      userProperties: {
        create: { propertyId: property.id },
      },
    },
  });
  console.log(`✅ User: ${user.email} / password: Admin1234!`);

  // Ensure userRole exists (idempotent — handles re-runs where user already existed)
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
    update: {},
    create: { userId: user.id, roleId: adminRole.id },
  });

  // Ensure userProperty exists (idempotent — handles re-runs where user already existed)
  await prisma.userProperty.upsert({
    where: { userId_propertyId: { userId: user.id, propertyId: property.id } },
    update: {},
    create: { userId: user.id, propertyId: property.id },
  });
  console.log(`✅ UserProperty: ${user.email} → ${property.name}`);

  // ── Floor ────────────────────────────────────────────────────
  const floor = await prisma.floor.upsert({
    where: { propertyId_number: { propertyId: property.id, number: 1 } },
    update: {},
    create: {
      propertyId: property.id,
      number: 1,
      name: 'Floor 1',
    },
  });
  console.log(`✅ Floor: ${floor.name}`);

  // ── Room Type ────────────────────────────────────────────────
  const roomType = await prisma.roomType.upsert({
    where: { propertyId_code: { propertyId: property.id, code: 'STD-DBL' } },
    update: {},
    create: {
      propertyId: property.id,
      name: 'Standard Double',
      code: 'STD-DBL',
      description: 'Comfortable standard room with double bed',
      baseRate: 150.00,
      maxOccupancy: 2,
      amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar'],
      isActive: true,
    },
  });
  console.log(`✅ Room Type: ${roomType.name}`);

  // ── Rooms ────────────────────────────────────────────────────
  const roomNumbers = ['101', '102', '103', '104', '105'];
  for (const number of roomNumbers) {
    const existing = await prisma.room.findUnique({
      where: { propertyId_number: { propertyId: property.id, number } },
    });
    if (!existing) {
      await prisma.room.create({
        data: {
          propertyId: property.id,
          roomTypeId: roomType.id,
          floorId: floor.id,
          number,
          floor: 1,
          status: RoomStatus.CLEAN,
          isActive: true,
          beds: {
            create: [{ type: BedType.DOUBLE, count: 1 }],
          },
        },
      });
    }
  }
  console.log(`✅ Rooms: ${roomNumbers.join(', ')}`);

  console.log('');
  console.log('🎉 Seed complete!');
  console.log('');
  console.log('  Login at: http://localhost:3000');
  console.log('  Email:    admin@demo.com');
  console.log('  Password: Admin1234!');
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });