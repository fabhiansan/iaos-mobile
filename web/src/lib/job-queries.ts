import { eq } from "drizzle-orm";
import { db } from "@/db";
import { jobs, users } from "@/db/schema";

export const jobWithPosterSelect = {
  id: jobs.id,
  title: jobs.title,
  company: jobs.company,
  companyImageUrl: jobs.companyImageUrl,
  location: jobs.location,
  contractType: jobs.contractType,
  workingType: jobs.workingType,
  contactName: jobs.contactName,
  contactPhone: jobs.contactPhone,
  status: jobs.status,
  postedById: jobs.postedById,
  createdAt: jobs.createdAt,
  updatedAt: jobs.updatedAt,
  posterName: users.name,
  posterYearOfEntry: users.yearOfEntry,
} as const;

export function jobsWithPosterQuery() {
  return db
    .select(jobWithPosterSelect)
    .from(jobs)
    .leftJoin(users, eq(jobs.postedById, users.id));
}

export async function findJobOwner(id: string) {
  const [existing] = await db
    .select({ postedById: jobs.postedById })
    .from(jobs)
    .where(eq(jobs.id, id))
    .limit(1);
  return existing ?? null;
}
