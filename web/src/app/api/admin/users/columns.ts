import { users } from "@/db/schema";

/** User columns excluding sensitive fields (passwordHash, resetToken, resetTokenExpires). */
export const safeUserColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  nim: users.nim,
  yearOfEntry: users.yearOfEntry,
  phone: users.phone,
  role: users.role,
  emailVerified: users.emailVerified,
  profileImageUrl: users.profileImageUrl,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};
