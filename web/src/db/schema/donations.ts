import { pgTable, pgEnum, uuid, varchar, integer, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const donationCategoryEnum = pgEnum("donation_category", ["Scholarship", "Events"]);

export const donationStatusEnum = pgEnum("donation_status", ["pending", "verified", "rejected"]);

export const donationCampaigns = pgTable("donation_campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description").notNull(),
  category: donationCategoryEnum("category").notNull(),
  imageUrl: text("image_url"),
  targetAmount: integer("target_amount").notNull(),
  currentAmount: integer("current_amount").default(0).notNull(),
  accountNumber: varchar("account_number", { length: 50 }).notNull(),
  bankName: varchar("bank_name", { length: 100 }).notNull(),
  accountName: varchar("account_name", { length: 255 }).notNull(),
  donationInstructions: text("donation_instructions"),
  beneficiaryCount: integer("beneficiary_count").default(0),
  createdById: uuid("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const donationTransactions = pgTable("donation_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id").notNull().references(() => donationCampaigns.id),
  donorId: uuid("donor_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  proofImageUrl: text("proof_image_url").notNull(),
  status: donationStatusEnum("status").default("pending").notNull(),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
