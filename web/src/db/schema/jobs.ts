import { pgTable, pgEnum, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const contractTypeEnum = pgEnum("contract_type", [
  "Full-time",
  "Contract",
  "Part-time",
  "Project Based",
  "Internship",
]);

export const workingTypeEnum = pgEnum("working_type", [
  "On-site",
  "Remote",
  "Hybrid",
]);

export const jobStatusEnum = pgEnum("job_status", ["draft", "pending_review", "published"]);

export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  companyImageUrl: text("company_image_url"),
  location: varchar("location", { length: 255 }).notNull(),
  contractType: contractTypeEnum("contract_type").notNull(),
  workingType: workingTypeEnum("working_type").notNull(),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 50 }).notNull(),
  status: jobStatusEnum("status").default("draft").notNull(),
  postedById: uuid("posted_by_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
