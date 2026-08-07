import { PrismaClient, RoomType, RoomStatus, EmployeeRole, EmployeeStatus, BookingStatus, BookingPriority } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create initial Admin / Employee records
  const admin = await prisma.employee.upsert({
    where: { email: "pratapsubramani@gmail.com" },
    update: { role: EmployeeRole.ADMIN, status: EmployeeStatus.ACTIVE },
    create: {
      clerkId: "user_admin_pratap",
      email: "pratapsubramani@gmail.com",
      firstName: "Pratap",
      lastName: "Subramani",
      department: "Management",
      jobTitle: "Administrator",
      role: EmployeeRole.ADMIN,
      status: EmployeeStatus.ACTIVE,
    },
  });

  const employee = await prisma.employee.upsert({
    where: { email: "user@company.com" },
    update: {},
    create: {
      clerkId: "user_sample_employee_clerk_id",
      email: "user@company.com",
      firstName: "Jane",
      lastName: "Doe",
      department: "Engineering",
      jobTitle: "Senior Software Engineer",
      role: EmployeeRole.EMPLOYEE,
      status: EmployeeStatus.ACTIVE,
    },
  });

  // Seed sample rooms
  const room1 = await prisma.room.upsert({
    where: { code: "CONF-101" },
    update: {},
    create: {
      name: "Innovate Conference Room",
      code: "CONF-101",
      description: "Spacious conference room equipped with 4K display and video conferencing system.",
      floor: 1,
      building: "Building A",
      capacity: 12,
      type: RoomType.CONFERENCE,
      status: RoomStatus.AVAILABLE,
      amenities: ["Projector", "Whiteboard", "Video Conferencing", "WiFi"],
      isActive: true,
    },
  });

  const room2 = await prisma.room.upsert({
    where: { code: "BOARD-201" },
    update: {},
    create: {
      name: "Executive Boardroom",
      code: "BOARD-201",
      description: "High-end boardroom for executive meetings and presentations.",
      floor: 2,
      building: "Building A",
      capacity: 20,
      type: RoomType.BOARDROOM,
      status: RoomStatus.AVAILABLE,
      amenities: ["4K Display", "Executive Seating", "Catering Setup", "Video Conferencing"],
      isActive: true,
    },
  });

  const room3 = await prisma.room.upsert({
    where: { code: "COLLAB-301" },
    update: {},
    create: {
      name: "Synergy Collab Space",
      code: "COLLAB-301",
      description: "Casual collaboration space for team huddles and brainstorming.",
      floor: 3,
      building: "Building B",
      capacity: 8,
      type: RoomType.COLLABORATION,
      status: RoomStatus.AVAILABLE,
      amenities: ["Smartboard", "Whiteboard", "WiFi"],
      isActive: true,
    },
  });

  // Seed a sample booking
  const today = new Date();
  const startTime = new Date(today.setHours(14, 0, 0, 0));
  const endTime = new Date(today.setHours(15, 30, 0, 0));

  await prisma.booking.create({
    data: {
      title: "Sprint Planning & Review",
      description: "Bi-weekly sprint planning meeting for the core dev team.",
      startTime,
      endTime,
      date: new Date(today.toISOString().split("T")[0]),
      attendeeCount: 6,
      priority: BookingPriority.HIGH,
      status: BookingStatus.CONFIRMED,
      employeeId: employee.id,
      roomId: room1.id,
    },
  });

  console.log("Database successfully seeded!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
