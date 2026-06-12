import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminPassword = bcrypt.hashSync("admin123", 10);
  const buyerPassword = bcrypt.hashSync("buyer123", 10);
  const sellerPassword = bcrypt.hashSync("seller123", 10);
  const applicantPassword = bcrypt.hashSync("applicant123", 10);

  // 1. Clean existing records (optional, but good for repeatable runs)
  await prisma.notification.deleteMany({});
  await prisma.seller.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Admin
  const admin = await prisma.user.create({
    data: {
      email: "admin@appstack.com",
      firstName: "Platform",
      lastName: "Admin",
      password: adminPassword,
      isVerified: true,
      roles: { set: ["ADMIN"] },
    },
  });
  console.log("Seeded Admin: admin@appstack.com / admin123");

  // 3. Create Buyer
  await prisma.user.create({
    data: {
      email: "buyer@appstack.com",
      firstName: "John",
      lastName: "Buyer",
      password: buyerPassword,
      isVerified: true,
      roles: { set: ["BUYER"] },
    },
  });
  console.log("Seeded Buyer: buyer@appstack.com / buyer123");

  // 4. Create Approved Seller
  const sellerUser = await prisma.user.create({
    data: {
      email: "seller@appstack.com",
      firstName: "Alice",
      lastName: "Seller",
      password: sellerPassword,
      isVerified: true,
      roles: { set: ["BUYER", "SELLER"] },
    },
  });
  await prisma.seller.create({
    data: {
      userId: sellerUser.id,
      payoutEmail: "payout-seller@appstack.com",
      businessName: "Alice SaaS Corp",
      aboutProject: "A high-performance cloud monitoring tool.",
      isApproveSeller: "APPROVED",
      approveByAdminId: admin.id,
    },
  });
  console.log("Seeded Seller: seller@appstack.com / seller123");

  // 5. Create Pending Seller Applicant
  const applicantUser = await prisma.user.create({
    data: {
      email: "applicant@appstack.com",
      firstName: "Bob",
      lastName: "Applicant",
      password: applicantPassword,
      isVerified: true,
      roles: { set: ["BUYER"] },
    },
  });
  await prisma.seller.create({
    data: {
      userId: applicantUser.id,
      payoutEmail: "payout-applicant@appstack.com",
      businessName: "Bob Analytics Lab",
      aboutProject: "AI-driven customer analytics suite.",
      isApproveSeller: "PENDING",
    },
  });
  console.log("Seeded Applicant: applicant@appstack.com / applicant123");

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
