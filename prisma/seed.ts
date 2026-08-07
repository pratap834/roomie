import {
  PrismaClient,
  RoomType,
  RoomStatus,
  EmployeeRole,
  EmployeeStatus,
  BookingStatus,
  BookingPriority,
  EmergencyPriority,
  EmergencyStatus,
} from "@prisma/client";

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

  let sampleBooking = await prisma.booking.findFirst({
    where: { title: "Sprint Planning & Review" },
  });

  if (!sampleBooking) {
    sampleBooking = await prisma.booking.create({
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
  }

  // Seed sample emergency requests if none exist
  const existingEmergencyCount = await prisma.emergencyRequest.count();
  if (existingEmergencyCount === 0 && sampleBooking) {
    await prisma.emergencyRequest.create({
      data: {
        subject: "Urgent Client Incident Response Meeting",
        description: "Critical outage affecting Tier-1 clients requires immediate war room assembly in Innovate Conference Room.",
        department: "Customer Success / Infrastructure",
        requestedStartTime: startTime,
        requestedEndTime: endTime,
        priority: EmergencyPriority.CRITICAL,
        status: EmergencyStatus.OPEN,
        employeeId: admin.id,
        roomId: room1.id,
        bookingId: sampleBooking.id,
      },
    });

    await prisma.emergencyRequest.create({
      data: {
        subject: "Executive Board Briefing",
        description: "Unscheduled board member briefing regarding Q3 budget alignment.",
        department: "Executive Management",
        requestedStartTime: startTime,
        requestedEndTime: endTime,
        priority: EmergencyPriority.HIGH,
        status: EmergencyStatus.IN_REVIEW,
        employeeId: admin.id,
        roomId: room2.id,
        bookingId: sampleBooking.id,
      },
    });
  }

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
