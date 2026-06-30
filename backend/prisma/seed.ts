import { PrismaClient, Role, StaffType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data (in reverse order of dependencies)
  await prisma.setting.deleteMany().catch(() => { });
  await prisma.report.deleteMany().catch(() => { });
  await prisma.notification.deleteMany().catch(() => { });
  await prisma.inventoryItem.deleteMany().catch(() => { });
  await prisma.groceryItem.deleteMany().catch(() => { });
  await prisma.mealPlan.deleteMany().catch(() => { });
  await prisma.pantryItem.deleteMany().catch(() => { });
  await prisma.visitor.deleteMany().catch(() => { });
  await prisma.attendance.deleteMany().catch(() => { });
  await prisma.taskHistory.deleteMany().catch(() => { });
  await prisma.task.deleteMany().catch(() => { });
  await prisma.staff.deleteMany().catch(() => { });
  await prisma.home.deleteMany().catch(() => { });
  await prisma.user.deleteMany().catch(() => { });

  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const honourPassword = await bcrypt.hash('honour123', salt);
  const staffPassword = await bcrypt.hash('staff123', salt);

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@butler.ai',
      password: adminPassword,
      name: 'Super Admin',
      role: Role.ADMIN,
    },
  });
  console.log(`Created Admin: ${admin.email}`);

  // 2. Create Honour
  const honour = await prisma.user.create({
    data: {
      email: 'honour@butler.ai',
      password: honourPassword,
      name: 'The Honour (Owner)',
      role: Role.HONOUR,
    },
  });
  console.log(`Created Honour: ${honour.email}`);

  // 3. Create Home for Honour
  const home = await prisma.home.create({
    data: {
      name: 'Mansion Grandeur',
      address: '77 Ocean Drive, Golden Coast',
      honourId: honour.id,
    },
  });
  console.log(`Created Home: ${home.name} linked to ${honour.name}`);

  // 4. Create Staff Accounts
  const staffData = [
    { name: 'Ramesh Chef', email: 'chef@butler.ai', type: StaffType.CHEF, salary: 50000 },
    { name: 'Suresh Driver', email: 'driver@butler.ai', type: StaffType.DRIVER, salary: 30000 },
    { name: 'Karan Security', email: 'security@butler.ai', type: StaffType.SECURITY, salary: 25000 },
    { name: 'Meena Housekeeper', email: 'housekeeper@butler.ai', type: StaffType.HOUSEKEEPER, salary: 20000 },
    { name: 'Mohan Butler', email: 'butler@butler.ai', type: StaffType.BUTLER, salary: 60000 },
    { name: 'Neha Maid', email: 'maid@butler.ai', type: StaffType.MAID, salary: 20000 },
    { name: 'Vikas Gardener', email: 'gardener@butler.ai', type: StaffType.GARDENER, salary: 20000 },
    { name: 'Priya Nanny', email: 'nanny@butler.ai', type: StaffType.NANNY, salary: 20000 },
  ];
  console.log("Staff count:", staffData.length);
  for (const s of staffData) {
    console.log("Creating:", s.name);
    const user = await prisma.user.create({
      data: {
        email: s.email,
        password: staffPassword,
        name: s.name,
        role: Role.STAFF,
      },
    });

    const staff = await prisma.staff.create({
      data: {
        userId: user.id,
        name: s.name,
        staffType: s.type,
        salary: s.salary,
        status: 'ACTIVE',
      },
    });
    console.log(`Created Staff: ${staff.name} (${staff.staffType})`);
  }

  // 5. Seed some initial pantry items for Mansion Grandeur
  const pantryItems = [
    { name: 'Basmati Rice', quantity: 25, unit: 'kg', minStock: 5, category: 'GRAINS' },
    { name: 'Olive Oil', quantity: 2, unit: 'l', minStock: 3, category: 'OILS' }, // low stock
    { name: 'Whole Wheat Flour', quantity: 15, unit: 'kg', minStock: 5, category: 'GRAINS' },
    { name: 'Whole Milk', quantity: 1, unit: 'l', minStock: 2, category: 'DAIRY' }, // low stock
    { name: 'Tomatoes', quantity: 4.5, unit: 'kg', minStock: 1, category: 'VEGETABLES' },
    { name: 'Onions', quantity: 6, unit: 'kg', minStock: 2, category: 'VEGETABLES' },
  ];

  for (const item of pantryItems) {
    await prisma.pantryItem.create({
      data: {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        minStock: item.minStock,
        category: item.category,
        homeId: home.id,
      },
    });
  }
  console.log(`Created initial pantry items`);

  // 6. Seed a sample recipe
  const recipe = await prisma.recipe.create({
    data: {
      name: 'Paneer Butter Masala',
      instructions: '1. Fry paneer cubes. 2. Saute onions, tomatoes, spices. 3. Blend sauce and cook paneer.',
      prepTime: 30,
      ingredients: [
        { name: 'Paneer', quantity: 200, unit: 'g' },
        { name: 'Butter', quantity: 50, unit: 'g' },
        { name: 'Tomatoes', quantity: 3, unit: 'pcs' },
        { name: 'Onions', quantity: 2, unit: 'pcs' }
      ],
      createdById: honour.id,
    },
  });
  console.log(`Created recipe: ${recipe.name}`);

  // 7. Seed initial setting
  await prisma.setting.create({
    data: {
      key: 'WHATSAPP_ALERTS_ENABLED',
      value: 'true',
      homeId: home.id,
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
