import { auth, currentUser } from "@clerk/nextjs/server";
import { employeeRepository } from "@/repositories/employee.repository";
import type { Employee } from "@prisma/client";

export type ClerkUser = Awaited<ReturnType<typeof currentUser>>;

/**
 * Returns the Clerk user ID from the current session.
 * Throws if the request is unauthenticated.
 */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }
  return userId;
}

/**
 * Returns the full Clerk user object for the current session.
 * Throws if the request is unauthenticated.
 */
export async function requireClerkUser(): Promise<NonNullable<ClerkUser>> {
  const user = await currentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

/**
 * Resolves the Prisma Employee record for the currently authenticated Clerk user.
 * Automatically links or provisions employee records if needed.
 */
export async function requireEmployee(): Promise<Employee> {
  const userId = await requireAuth();

  // Fast path: employee already linked to this Clerk user ID.
  let employee = await employeeRepository.findByClerkId(userId);

  if (!employee) {
    const clerkUser = await currentUser();
    const primaryEmail = clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase();

    if (primaryEmail) {
      const isAdminEmail = primaryEmail === "pratapsubramani@gmail.com";

      // Atomically insert or update: safe under concurrent first-time sign-ins.
      // If two requests race here, the second will see the clerkId already taken
      // and update instead of create, avoiding the unique-constraint crash.
      employee = await employeeRepository.upsert(
        userId,
        // create — used when no row with this clerkId exists yet
        {
          clerkId: userId,
          email: primaryEmail,
          firstName: clerkUser?.firstName || primaryEmail.split("@")[0],
          lastName: clerkUser?.lastName || "User",
          role: isAdminEmail ? "ADMIN" : "EMPLOYEE",
          status: "ACTIVE",
        },
        // update — used when a row with this clerkId already exists
        // (e.g., a soft-deleted record, or a record created by a concurrent request)
        {
          email: primaryEmail,
          ...(isAdminEmail ? { role: "ADMIN" as const } : {}),
        },
      );
    }
  }

  // Ensure the hardcoded admin email always holds the ADMIN role,
  // even if the record was created before the email was designated as admin.
  if (employee && employee.email?.toLowerCase() === "pratapsubramani@gmail.com" && employee.role !== "ADMIN") {
    employee = await employeeRepository.update(employee.id, { role: "ADMIN" });
  }

  if (!employee || employee.status !== "ACTIVE") {
    throw new Error("EMPLOYEE_NOT_FOUND");
  }

  return employee;
}

/**
 * Returns true when the currently authenticated user holds the ADMIN role.
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const employee = await requireEmployee();
    return employee.role === "ADMIN";
  } catch {
    return false;
  }
}

/**
 * Returns true when the currently authenticated user holds the EMPLOYEE role.
 */
export async function isEmployee(): Promise<boolean> {
  try {
    const employee = await requireEmployee();
    return employee.status === "ACTIVE";
  } catch {
    return false;
  }
}

/**
 * Asserts that the currently authenticated user is an admin.
 * Throws if they are not.
 */
export async function requireAdmin(): Promise<Employee> {
  const employee = await requireEmployee();

  if (employee.role !== "ADMIN") {
    if (employee.email?.toLowerCase() === "pratapsubramani@gmail.com") {
      return await employeeRepository.update(employee.id, { role: "ADMIN" });
    }
    throw new Error("FORBIDDEN");
  }

  return employee;
}

export { auth, currentUser };
