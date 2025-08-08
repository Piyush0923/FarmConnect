import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("farmer").notNull(), // farmer, admin, agent
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const farmers = pgTable("farmers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  aadharNumber: varchar("aadhar_number", { length: 12 }),
  mobileNumber: varchar("mobile_number", { length: 15 }).notNull(),
  name: text("name").notNull(),
  fatherName: text("father_name"),
  age: integer("age"),
  gender: text("gender"), // male, female, other
  category: text("category"), // general, obc, sc, st
  address: text("address"),
  village: text("village"),
  district: text("district"),
  state: text("state"),
  pincode: varchar("pincode", { length: 6 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  bankAccountNumber: text("bank_account_number"),
  ifscCode: varchar("ifsc_code", { length: 11 }),
  isVerified: boolean("is_verified").default(false),
  language: text("language").default("en"), // en, hi, te, ta, bn
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const lands = pgTable("lands", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  farmerId: uuid("farmer_id").references(() => farmers.id).notNull(),
  surveyNumber: text("survey_number"),
  area: decimal("area", { precision: 10, scale: 2 }).notNull(), // in acres
  landType: text("land_type"), // irrigated, rain-fed, dry
  ownershipType: text("ownership_type"), // owned, leased, sharecropper
  soilType: text("soil_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const crops = pgTable("crops", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  farmerId: uuid("farmer_id").references(() => farmers.id).notNull(),
  landId: uuid("land_id").references(() => lands.id),
  cropName: text("crop_name").notNull(),
  variety: text("variety"),
  season: text("season"), // kharif, rabi, summer
  sowingDate: timestamp("sowing_date"),
  expectedHarvest: timestamp("expected_harvest"),
  area: decimal("area", { precision: 10, scale: 2 }), // in acres
  year: integer("year").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const livestock = pgTable("livestock", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  farmerId: uuid("farmer_id").references(() => farmers.id).notNull(),
  animalType: text("animal_type").notNull(), // cow, buffalo, goat, sheep, poultry
  count: integer("count").notNull(),
  breed: text("breed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const schemes = pgTable("schemes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  benefits: text("benefits"),
  eligibilityCriteria: jsonb("eligibility_criteria"),
  requiredDocuments: jsonb("required_documents"),
  applicationProcess: text("application_process"),
  deadline: timestamp("deadline"),
  schemeType: text("scheme_type"), // central, state, district
  department: text("department"),
  benefitAmount: decimal("benefit_amount", { precision: 15, scale: 2 }),
  isActive: boolean("is_active").default(true),
  targetStates: jsonb("target_states"), // array of state codes
  targetCrops: jsonb("target_crops"), // array of crop names
  landSizeMin: decimal("land_size_min", { precision: 10, scale: 2 }),
  landSizeMax: decimal("land_size_max", { precision: 10, scale: 2 }),
  ageMin: integer("age_min"),
  ageMax: integer("age_max"),
  applicableCategories: jsonb("applicable_categories"), // array of categories
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  farmerId: uuid("farmer_id").references(() => farmers.id).notNull(),
  schemeId: uuid("scheme_id").references(() => schemes.id).notNull(),
  status: text("status").default("pending").notNull(), // pending, approved, rejected, completed
  applicationData: jsonb("application_data"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  benefitReceived: decimal("benefit_received", { precision: 15, scale: 2 }),
  receivedAt: timestamp("received_at"),
});

export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  farmerId: uuid("farmer_id").references(() => farmers.id).notNull(),
  schemeId: uuid("scheme_id").references(() => schemes.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  farmerId: uuid("farmer_id").references(() => farmers.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // info, warning, success, error
  isRead: boolean("is_read").default(false),
  actionUrl: text("action_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  farmer: one(farmers, { fields: [users.id], references: [farmers.userId] }),
}));

export const farmersRelations = relations(farmers, ({ one, many }) => ({
  user: one(users, { fields: [farmers.userId], references: [users.id] }),
  lands: many(lands),
  crops: many(crops),
  livestock: many(livestock),
  applications: many(applications),
  bookmarks: many(bookmarks),
  notifications: many(notifications),
}));

export const landsRelations = relations(lands, ({ one, many }) => ({
  farmer: one(farmers, { fields: [lands.farmerId], references: [farmers.id] }),
  crops: many(crops),
}));

export const cropsRelations = relations(crops, ({ one }) => ({
  farmer: one(farmers, { fields: [crops.farmerId], references: [farmers.id] }),
  land: one(lands, { fields: [crops.landId], references: [lands.id] }),
}));

export const livestockRelations = relations(livestock, ({ one }) => ({
  farmer: one(farmers, { fields: [livestock.farmerId], references: [farmers.id] }),
}));

export const schemesRelations = relations(schemes, ({ many }) => ({
  applications: many(applications),
  bookmarks: many(bookmarks),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  farmer: one(farmers, { fields: [applications.farmerId], references: [farmers.id] }),
  scheme: one(schemes, { fields: [applications.schemeId], references: [schemes.id] }),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  farmer: one(farmers, { fields: [bookmarks.farmerId], references: [farmers.id] }),
  scheme: one(schemes, { fields: [bookmarks.schemeId], references: [schemes.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  farmer: one(farmers, { fields: [notifications.farmerId], references: [farmers.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertFarmerSchema = createInsertSchema(farmers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLandSchema = createInsertSchema(lands).omit({
  id: true,
  createdAt: true,
});

export const insertCropSchema = createInsertSchema(crops).omit({
  id: true,
  createdAt: true,
});

export const insertLivestockSchema = createInsertSchema(livestock).omit({
  id: true,
  createdAt: true,
});

export const insertSchemeSchema = createInsertSchema(schemes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  submittedAt: true,
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Farmer = typeof farmers.$inferSelect;
export type InsertFarmer = z.infer<typeof insertFarmerSchema>;
export type Land = typeof lands.$inferSelect;
export type InsertLand = z.infer<typeof insertLandSchema>;
export type Crop = typeof crops.$inferSelect;
export type InsertCrop = z.infer<typeof insertCropSchema>;
export type Livestock = typeof livestock.$inferSelect;
export type InsertLivestock = z.infer<typeof insertLivestockSchema>;
export type Scheme = typeof schemes.$inferSelect;
export type InsertScheme = z.infer<typeof insertSchemeSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Extended types with relations
export type FarmerWithProfile = Farmer & {
  lands: Land[];
  crops: Crop[];
  livestock: Livestock[];
};

export type SchemeWithEligibility = Scheme & {
  matchPercentage?: number;
  isBookmarked?: boolean;
  applicationStatus?: string;
};

export type ApplicationWithDetails = Application & {
  scheme: Scheme;
  farmer: Farmer;
};
