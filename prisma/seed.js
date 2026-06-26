const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Seed Roles
  const adminRole = await prisma.role.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Admin",
    },
  });

  const customerRole = await prisma.role.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: "Customer",
    },
  });

  console.log("Roles seeded successfully.");

  // Seed RolePermissions
  const adminPermissions = [
    "admin:approve",
    "admin:reject",
    "admin:view",
    "customer:view"
  ];

  const customerPermissions = [
    "customer:view"
  ];

  for (const perm of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permission: {
          roleId: 1,
          permission: perm
        }
      },
      update: {},
      create: {
        roleId: 1,
        permission: perm
      }
    });
  }

  for (const perm of customerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permission: {
          roleId: 2,
          permission: perm
        }
      },
      update: {},
      create: {
        roleId: 2,
        permission: perm
      }
    });
  }

  console.log("Permissions seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
