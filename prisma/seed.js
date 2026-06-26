const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");

async function main() {
  console.log("Seeding database...");

  // 1. Seed Customer Roles (UserRole)
  const customerRole = await prisma.userRole.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: "Customer",
    },
  });

  // Seed Customer Permissions (UserRolePermission)
  const customerPermissions = ["customer:view"];
  for (const perm of customerPermissions) {
    await prisma.userRolePermission.upsert({
      where: {
        roleId_permission: {
          roleId: 2,
          permission: perm,
        },
      },
      update: {},
      create: {
        roleId: 2,
        permission: perm,
      },
    });
  }
  console.log("Customer roles & permissions seeded.");

  // 2. Seed Admin Roles (AdminRole)
  const adminRole = await prisma.adminRole.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Admin",
    },
  });

  // Seed Admin Permissions (AdminRolePermission)
  const adminPermissions = ["admin:approve", "admin:reject", "admin:view", "customer:view"];
  for (const perm of adminPermissions) {
    await prisma.adminRolePermission.upsert({
      where: {
        roleId_permission: {
          roleId: 1,
          permission: perm,
        },
      },
      update: {},
      create: {
        roleId: 1,
        permission: perm,
      },
    });
  }
  console.log("Admin roles & permissions seeded.");

  // 3. Seed Default Admin User
  const adminEmail = "admin@pathlab.com";
  const hashedPassword = await bcrypt.hash("Password123", 10);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "System Admin",
      email: adminEmail,
      password: hashedPassword,
      provider: "credentials",
      roleId: 1, // Admin Role
      isEmailVerified: true,
      isApproved: true,
    },
  });
  console.log("Default Admin user seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
