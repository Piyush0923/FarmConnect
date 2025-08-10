import { db, type User, type Farmer, type Land, type Crop, type Livestock, type Scheme, type Application, type Bookmark, type Notification } from "./db";
import bcrypt from "bcryptjs";

export class DatabaseStorage {
  // User management
  async getUser(id: string): Promise<User | undefined> {
    return db.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return db.getUserByUsername(username);
  }

  async createUser(userData: { username: string; password: string; role?: string }): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    return db.createUser({
      username: userData.username,
      password: hashedPassword,
      role: userData.role || 'farmer'
    });
  }

  // Farmer management
  async getFarmer(id: string): Promise<Farmer | undefined> {
    return db.getFarmer(id);
  }

  async getFarmerByUserId(userId: string): Promise<Farmer | undefined> {
    return db.getFarmerByUserId(userId);
  }

  async getFarmerWithProfile(id: string): Promise<any> {
    const farmer = db.getFarmer(id);
    if (!farmer) return undefined;

    const lands = db.getLandsByFarmerId(id);
    const crops = db.getCropsByFarmerId(id);
    const livestock = db.getLivestockByFarmerId(id);

    return {
      ...farmer,
      lands,
      crops,
      livestock
    };
  }

  async createFarmer(farmerData: any): Promise<Farmer> {
    return db.createFarmer(farmerData);
  }

  async updateFarmer(id: string, updates: Partial<Farmer>): Promise<Farmer> {
    const updated = db.updateFarmer(id, updates);
    if (!updated) {
      throw new Error('Farmer not found');
    }
    return updated;
  }

  // Land management
  async getLandsByFarmerId(farmerId: string): Promise<Land[]> {
    return db.getLandsByFarmerId(farmerId);
  }

  async createLand(landData: any): Promise<Land> {
    return db.createLand(landData);
  }

  // Crop management
  async getCropsByFarmerId(farmerId: string): Promise<Crop[]> {
    return db.getCropsByFarmerId(farmerId);
  }

  async createCrop(cropData: any): Promise<Crop> {
    return db.createCrop(cropData);
  }

  // Livestock management
  async getLivestockByFarmerId(farmerId: string): Promise<Livestock[]> {
    return db.getLivestockByFarmerId(farmerId);
  }

  async createLivestock(livestockData: any): Promise<Livestock> {
    return db.createLivestock(livestockData);
  }

  // Scheme management
  async getSchemes(filters?: any): Promise<Scheme[]> {
    return db.getSchemes();
  }

  async getScheme(id: string): Promise<Scheme | undefined> {
    return db.getScheme(id);
  }

  async createScheme(schemeData: any): Promise<Scheme> {
    return db.createScheme(schemeData);
  }

  async getRecommendedSchemes(farmerId: string): Promise<Scheme[]> {
    const farmer = await this.getFarmerWithProfile(farmerId);
    if (!farmer) return [];

    const allSchemes = db.getSchemes();
    
    // Simple matching logic
    return allSchemes.filter(scheme => {
      if (!scheme.isActive) return false;
      
      // State match
      if (scheme.targetStates && farmer.state && 
          !scheme.targetStates.includes(farmer.state.toLowerCase())) {
        return false;
      }
      
      // Land size match
      const totalLandArea = farmer.lands.reduce((sum: number, land: Land) => sum + land.area, 0);
      if (scheme.landSizeMin && totalLandArea < scheme.landSizeMin) return false;
      if (scheme.landSizeMax && totalLandArea > scheme.landSizeMax) return false;
      
      // Age match
      if (farmer.age) {
        if (scheme.ageMin && farmer.age < scheme.ageMin) return false;
        if (scheme.ageMax && farmer.age > scheme.ageMax) return false;
      }
      
      // Category match
      if (scheme.applicableCategories && farmer.category && 
          !scheme.applicableCategories.includes(farmer.category)) {
        return false;
      }
      
      return true;
    }).slice(0, 5);
  }

  // Application management
  async getApplicationsByFarmerId(farmerId: string): Promise<any[]> {
    const applications = db.getApplicationsByFarmerId(farmerId);
    return applications.map(app => {
      const scheme = db.getScheme(app.schemeId);
      return {
        ...app,
        scheme
      };
    });
  }

  async createApplication(applicationData: any): Promise<Application> {
    return db.createApplication(applicationData);
  }

  // Bookmark management
  async getBookmarksByFarmerId(farmerId: string): Promise<Bookmark[]> {
    return db.getBookmarksByFarmerId(farmerId);
  }

  async createBookmark(bookmarkData: any): Promise<Bookmark> {
    return db.createBookmark(bookmarkData);
  }

  async deleteBookmark(farmerId: string, schemeId: string): Promise<void> {
    db.deleteBookmark(farmerId, schemeId);
  }

  // Notification management
  async getNotificationsByFarmerId(farmerId: string): Promise<Notification[]> {
    return db.getNotificationsByFarmerId(farmerId);
  }

  async createNotification(notificationData: any): Promise<Notification> {
    return db.createNotification(notificationData);
  }

  async markNotificationAsRead(id: string): Promise<void> {
    db.markNotificationAsRead(id);
  }

  async markAllNotificationsAsRead(farmerId: string): Promise<void> {
    db.markAllNotificationsAsRead(farmerId);
  }

  // Dashboard stats
  async getFarmerStats(farmerId: string): Promise<{
    activeSchemes: number;
    totalBenefits: number;
    totalLandArea: number;
    activeCrops: number;
  }> {
    return db.getFarmerStats(farmerId);
  }
}

export const storage = new DatabaseStorage();