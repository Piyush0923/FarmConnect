import { 
  users, farmers, lands, crops, livestock, schemes, applications, bookmarks, notifications,
  type User, type InsertUser, type Farmer, type InsertFarmer, type FarmerWithProfile,
  type Land, type InsertLand, type Crop, type InsertCrop, type Livestock, type InsertLivestock,
  type Scheme, type InsertScheme, type SchemeWithEligibility,
  type Application, type InsertApplication, type ApplicationWithDetails,
  type Bookmark, type InsertBookmark, type Notification, type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, like, inArray, gte, lte, isNull, count, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Farmer management
  getFarmer(id: string): Promise<Farmer | undefined>;
  getFarmerByUserId(userId: string): Promise<Farmer | undefined>;
  getFarmerWithProfile(id: string): Promise<FarmerWithProfile | undefined>;
  createFarmer(farmer: InsertFarmer): Promise<Farmer>;
  updateFarmer(id: string, farmer: Partial<InsertFarmer>): Promise<Farmer>;
  
  // Land management
  getLandsByFarmerId(farmerId: string): Promise<Land[]>;
  createLand(land: InsertLand): Promise<Land>;
  updateLand(id: string, land: Partial<InsertLand>): Promise<Land>;
  
  // Crop management
  getCropsByFarmerId(farmerId: string): Promise<Crop[]>;
  createCrop(crop: InsertCrop): Promise<Crop>;
  updateCrop(id: string, crop: Partial<InsertCrop>): Promise<Crop>;
  
  // Livestock management
  getLivestockByFarmerId(farmerId: string): Promise<Livestock[]>;
  createLivestock(livestock: InsertLivestock): Promise<Livestock>;
  updateLivestock(id: string, livestock: Partial<InsertLivestock>): Promise<Livestock>;
  
  // Scheme management
  getSchemes(filters?: any): Promise<SchemeWithEligibility[]>;
  getScheme(id: string): Promise<Scheme | undefined>;
  createScheme(scheme: InsertScheme): Promise<Scheme>;
  updateScheme(id: string, scheme: Partial<InsertScheme>): Promise<Scheme>;
  getRecommendedSchemes(farmerId: string): Promise<SchemeWithEligibility[]>;
  
  // Application management
  getApplicationsByFarmerId(farmerId: string): Promise<ApplicationWithDetails[]>;
  getApplication(id: string): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: string, application: Partial<InsertApplication>): Promise<Application>;
  
  // Bookmark management
  getBookmarksByFarmerId(farmerId: string): Promise<Bookmark[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(farmerId: string, schemeId: string): Promise<void>;
  isSchemeBookmarked(farmerId: string, schemeId: string): Promise<boolean>;
  
  // Notification management
  getNotificationsByFarmerId(farmerId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(farmerId: string): Promise<void>;
  
  // Dashboard stats
  getFarmerStats(farmerId: string): Promise<{
    activeSchemes: number;
    totalBenefits: number;
    totalLandArea: number;
    activeCrops: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async getFarmer(id: string): Promise<Farmer | undefined> {
    const [farmer] = await db.select().from(farmers).where(eq(farmers.id, id));
    return farmer || undefined;
  }

  async getFarmerByUserId(userId: string): Promise<Farmer | undefined> {
    const [farmer] = await db.select().from(farmers).where(eq(farmers.userId, userId));
    return farmer || undefined;
  }

  async getFarmerWithProfile(id: string): Promise<FarmerWithProfile | undefined> {
    const [farmer] = await db.select().from(farmers).where(eq(farmers.id, id));
    if (!farmer) return undefined;

    const farmerLands = await this.getLandsByFarmerId(id);
    const farmerCrops = await this.getCropsByFarmerId(id);
    const farmerLivestock = await this.getLivestockByFarmerId(id);

    return {
      ...farmer,
      lands: farmerLands,
      crops: farmerCrops,
      livestock: farmerLivestock,
    };
  }

  async createFarmer(farmer: InsertFarmer): Promise<Farmer> {
    const [newFarmer] = await db.insert(farmers).values(farmer).returning();
    return newFarmer;
  }

  async updateFarmer(id: string, farmer: Partial<InsertFarmer>): Promise<Farmer> {
    const [updatedFarmer] = await db
      .update(farmers)
      .set({ ...farmer, updatedAt: new Date() })
      .where(eq(farmers.id, id))
      .returning();
    return updatedFarmer;
  }

  async getLandsByFarmerId(farmerId: string): Promise<Land[]> {
    return await db.select().from(lands).where(eq(lands.farmerId, farmerId));
  }

  async createLand(land: InsertLand): Promise<Land> {
    const [newLand] = await db.insert(lands).values(land).returning();
    return newLand;
  }

  async updateLand(id: string, land: Partial<InsertLand>): Promise<Land> {
    const [updatedLand] = await db
      .update(lands)
      .set(land)
      .where(eq(lands.id, id))
      .returning();
    return updatedLand;
  }

  async getCropsByFarmerId(farmerId: string): Promise<Crop[]> {
    return await db.select().from(crops).where(eq(crops.farmerId, farmerId));
  }

  async createCrop(crop: InsertCrop): Promise<Crop> {
    const [newCrop] = await db.insert(crops).values(crop).returning();
    return newCrop;
  }

  async updateCrop(id: string, crop: Partial<InsertCrop>): Promise<Crop> {
    const [updatedCrop] = await db
      .update(crops)
      .set(crop)
      .where(eq(crops.id, id))
      .returning();
    return updatedCrop;
  }

  async getLivestockByFarmerId(farmerId: string): Promise<Livestock[]> {
    return await db.select().from(livestock).where(eq(livestock.farmerId, farmerId));
  }

  async createLivestock(livestockData: InsertLivestock): Promise<Livestock> {
    const [newLivestock] = await db.insert(livestock).values(livestockData).returning();
    return newLivestock;
  }

  async updateLivestock(id: string, livestockData: Partial<InsertLivestock>): Promise<Livestock> {
    const [updatedLivestock] = await db
      .update(livestock)
      .set(livestockData)
      .where(eq(livestock.id, id))
      .returning();
    return updatedLivestock;
  }

  async getSchemes(filters?: any): Promise<SchemeWithEligibility[]> {
    const conditions = [eq(schemes.isActive, true)];
    
    if (filters?.state) {
      conditions.push(sql`${schemes.targetStates} @> ${JSON.stringify([filters.state])}`);
    }
    if (filters?.crop) {
      conditions.push(sql`${schemes.targetCrops} @> ${JSON.stringify([filters.crop])}`);
    }
    
    return await db
      .select()
      .from(schemes)
      .where(and(...conditions))
      .orderBy(desc(schemes.createdAt));
  }

  async getScheme(id: string): Promise<Scheme | undefined> {
    const [scheme] = await db.select().from(schemes).where(eq(schemes.id, id));
    return scheme || undefined;
  }

  async createScheme(scheme: InsertScheme): Promise<Scheme> {
    const [newScheme] = await db.insert(schemes).values(scheme).returning();
    return newScheme;
  }

  async updateScheme(id: string, scheme: Partial<InsertScheme>): Promise<Scheme> {
    const [updatedScheme] = await db
      .update(schemes)
      .set({ ...scheme, updatedAt: new Date() })
      .where(eq(schemes.id, id))
      .returning();
    return updatedScheme;
  }

  async getRecommendedSchemes(farmerId: string): Promise<SchemeWithEligibility[]> {
    const farmer = await this.getFarmerWithProfile(farmerId);
    if (!farmer) return [];

    // Get all active schemes
    const allSchemes = await db.select().from(schemes).where(eq(schemes.isActive, true));
    
    // Get farmer's bookmarks and applications
    const farmerBookmarks = await this.getBookmarksByFarmerId(farmerId);
    const farmerApplications = await this.getApplicationsByFarmerId(farmerId);
    
    const bookmarkedSchemeIds = new Set(farmerBookmarks.map(b => b.schemeId));
    const applicationSchemeMap = new Map(farmerApplications.map(a => [a.schemeId, a.status]));

    // Calculate match percentage for each scheme
    const schemesWithMatch = allSchemes.map(scheme => {
      let matchScore = 0;
      let totalCriteria = 0;

      // State match
      totalCriteria++;
      if (!scheme.targetStates || 
          (Array.isArray(scheme.targetStates) && scheme.targetStates.includes(farmer.state))) {
        matchScore++;
      }

      // Crop match
      totalCriteria++;
      const farmerCropNames = farmer.crops.map(c => c.cropName.toLowerCase());
      if (!scheme.targetCrops || 
          (Array.isArray(scheme.targetCrops) && 
           scheme.targetCrops.some(crop => 
             farmerCropNames.includes(crop.toLowerCase())))) {
        matchScore++;
      }

      // Land size match
      const totalLandArea = farmer.lands.reduce((sum, land) => sum + parseFloat(land.area || '0'), 0);
      totalCriteria++;
      if ((!scheme.landSizeMin || totalLandArea >= parseFloat(scheme.landSizeMin)) &&
          (!scheme.landSizeMax || totalLandArea <= parseFloat(scheme.landSizeMax))) {
        matchScore++;
      }

      // Age match
      if (farmer.age) {
        totalCriteria++;
        if ((!scheme.ageMin || farmer.age >= scheme.ageMin) &&
            (!scheme.ageMax || farmer.age <= scheme.ageMax)) {
          matchScore++;
        }
      }

      // Category match
      totalCriteria++;
      if (!scheme.applicableCategories || 
          (Array.isArray(scheme.applicableCategories) && 
           scheme.applicableCategories.includes(farmer.category))) {
        matchScore++;
      }

      const matchPercentage = Math.round((matchScore / totalCriteria) * 100);

      return {
        ...scheme,
        matchPercentage,
        isBookmarked: bookmarkedSchemeIds.has(scheme.id),
        applicationStatus: applicationSchemeMap.get(scheme.id),
      };
    });

    // Sort by match percentage and return top matches
    return schemesWithMatch
      .filter(scheme => scheme.matchPercentage >= 50)
      .sort((a, b) => b.matchPercentage - a.matchPercentage);
  }

  async getApplicationsByFarmerId(farmerId: string): Promise<ApplicationWithDetails[]> {
    const result = await db
      .select({
        application: applications,
        scheme: schemes,
        farmer: farmers,
      })
      .from(applications)
      .innerJoin(schemes, eq(applications.schemeId, schemes.id))
      .innerJoin(farmers, eq(applications.farmerId, farmers.id))
      .where(eq(applications.farmerId, farmerId))
      .orderBy(desc(applications.submittedAt));

    return result.map(row => ({
      ...row.application,
      scheme: row.scheme,
      farmer: row.farmer,
    }));
  }

  async getApplication(id: string): Promise<Application | undefined> {
    const [application] = await db.select().from(applications).where(eq(applications.id, id));
    return application || undefined;
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const [newApplication] = await db.insert(applications).values(application).returning();
    return newApplication;
  }

  async updateApplication(id: string, application: Partial<InsertApplication>): Promise<Application> {
    const [updatedApplication] = await db
      .update(applications)
      .set(application)
      .where(eq(applications.id, id))
      .returning();
    return updatedApplication;
  }

  async getBookmarksByFarmerId(farmerId: string): Promise<Bookmark[]> {
    return await db.select().from(bookmarks).where(eq(bookmarks.farmerId, farmerId));
  }

  async createBookmark(bookmark: InsertBookmark): Promise<Bookmark> {
    const [newBookmark] = await db.insert(bookmarks).values(bookmark).returning();
    return newBookmark;
  }

  async deleteBookmark(farmerId: string, schemeId: string): Promise<void> {
    await db
      .delete(bookmarks)
      .where(and(
        eq(bookmarks.farmerId, farmerId),
        eq(bookmarks.schemeId, schemeId)
      ));
  }

  async isSchemeBookmarked(farmerId: string, schemeId: string): Promise<boolean> {
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(and(
        eq(bookmarks.farmerId, farmerId),
        eq(bookmarks.schemeId, schemeId)
      ));
    return !!bookmark;
  }

  async getNotificationsByFarmerId(farmerId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.farmerId, farmerId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(farmerId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.farmerId, farmerId));
  }

  async getFarmerStats(farmerId: string): Promise<{
    activeSchemes: number;
    totalBenefits: number;
    totalLandArea: number;
    activeCrops: number;
  }> {
    // Active schemes (applications)
    const [activeSchemes] = await db
      .select({ count: count() })
      .from(applications)
      .where(and(
        eq(applications.farmerId, farmerId),
        inArray(applications.status, ['pending', 'approved'])
      ));

    // Total benefits received
    const [benefitsResult] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${applications.benefitReceived}), 0)`
      })
      .from(applications)
      .where(and(
        eq(applications.farmerId, farmerId),
        eq(applications.status, 'completed')
      ));

    // Total land area
    const [landResult] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${lands.area}), 0)`
      })
      .from(lands)
      .where(eq(lands.farmerId, farmerId));

    // Active crops (current year)
    const currentYear = new Date().getFullYear();
    const [cropsResult] = await db
      .select({ count: count() })
      .from(crops)
      .where(and(
        eq(crops.farmerId, farmerId),
        eq(crops.year, currentYear)
      ));

    return {
      activeSchemes: activeSchemes.count,
      totalBenefits: benefitsResult.total,
      totalLandArea: landResult.total,
      activeCrops: cropsResult.count,
    };
  }
}

export const storage = new DatabaseStorage();
