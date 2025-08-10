// Simple in-memory storage for development
// In production, you would replace this with a real database

export interface User {
  id: string;
  username: string;
  password: string;
  role: string;
  createdAt: Date;
}

export interface Farmer {
  id: string;
  userId: string;
  name: string;
  fatherName?: string;
  age?: number;
  gender?: string;
  category?: string;
  mobileNumber: string;
  aadharNumber?: string;
  address?: string;
  village?: string;
  district?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  bankAccountNumber?: string;
  ifscCode?: string;
  language: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Land {
  id: string;
  farmerId: string;
  surveyNumber?: string;
  area: number;
  landType?: string;
  ownershipType?: string;
  soilType?: string;
  createdAt: Date;
}

export interface Crop {
  id: string;
  farmerId: string;
  landId?: string;
  cropName: string;
  variety?: string;
  season?: string;
  sowingDate?: Date;
  expectedHarvest?: Date;
  area?: number;
  year: number;
  createdAt: Date;
}

export interface Livestock {
  id: string;
  farmerId: string;
  animalType: string;
  count: number;
  breed?: string;
  createdAt: Date;
}

export interface Scheme {
  id: string;
  name: string;
  description: string;
  benefits?: string;
  eligibilityCriteria?: string[];
  requiredDocuments?: string[];
  applicationProcess?: string;
  deadline?: Date;
  schemeType?: string;
  department?: string;
  benefitAmount?: number;
  isActive: boolean;
  targetStates?: string[];
  targetCrops?: string[];
  landSizeMin?: number;
  landSizeMax?: number;
  ageMin?: number;
  ageMax?: number;
  applicableCategories?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Application {
  id: string;
  farmerId: string;
  schemeId: string;
  status: string;
  applicationData?: any;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewNotes?: string;
  benefitReceived?: number;
  receivedAt?: Date;
}

export interface Bookmark {
  id: string;
  farmerId: string;
  schemeId: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  farmerId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
}

// In-memory storage
class InMemoryDatabase {
  private users: Map<string, User> = new Map();
  private farmers: Map<string, Farmer> = new Map();
  private lands: Map<string, Land> = new Map();
  private crops: Map<string, Crop> = new Map();
  private livestock: Map<string, Livestock> = new Map();
  private schemes: Map<string, Scheme> = new Map();
  private applications: Map<string, Application> = new Map();
  private bookmarks: Map<string, Bookmark> = new Map();
  private notifications: Map<string, Notification> = new Map();

  // User methods
  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByUsername(username: string): User | undefined {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const id = this.generateId();
    const user: User = {
      ...userData,
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Farmer methods
  getFarmer(id: string): Farmer | undefined {
    return this.farmers.get(id);
  }

  getFarmerByUserId(userId: string): Farmer | undefined {
    return Array.from(this.farmers.values()).find(farmer => farmer.userId === userId);
  }

  createFarmer(farmerData: Omit<Farmer, 'id' | 'createdAt' | 'updatedAt'>): Farmer {
    const id = this.generateId();
    const farmer: Farmer = {
      ...farmerData,
      id,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.farmers.set(id, farmer);
    return farmer;
  }

  updateFarmer(id: string, updates: Partial<Farmer>): Farmer | undefined {
    const farmer = this.farmers.get(id);
    if (!farmer) return undefined;
    
    const updatedFarmer = { ...farmer, ...updates, updatedAt: new Date() };
    this.farmers.set(id, updatedFarmer);
    return updatedFarmer;
  }

  // Land methods
  getLandsByFarmerId(farmerId: string): Land[] {
    return Array.from(this.lands.values()).filter(land => land.farmerId === farmerId);
  }

  createLand(landData: Omit<Land, 'id' | 'createdAt'>): Land {
    const id = this.generateId();
    const land: Land = {
      ...landData,
      id,
      createdAt: new Date()
    };
    this.lands.set(id, land);
    return land;
  }

  // Crop methods
  getCropsByFarmerId(farmerId: string): Crop[] {
    return Array.from(this.crops.values()).filter(crop => crop.farmerId === farmerId);
  }

  createCrop(cropData: Omit<Crop, 'id' | 'createdAt'>): Crop {
    const id = this.generateId();
    const crop: Crop = {
      ...cropData,
      id,
      createdAt: new Date()
    };
    this.crops.set(id, crop);
    return crop;
  }

  // Livestock methods
  getLivestockByFarmerId(farmerId: string): Livestock[] {
    return Array.from(this.livestock.values()).filter(animal => animal.farmerId === farmerId);
  }

  createLivestock(livestockData: Omit<Livestock, 'id' | 'createdAt'>): Livestock {
    const id = this.generateId();
    const animal: Livestock = {
      ...livestockData,
      id,
      createdAt: new Date()
    };
    this.livestock.set(id, animal);
    return animal;
  }

  // Scheme methods
  getSchemes(): Scheme[] {
    return Array.from(this.schemes.values()).filter(scheme => scheme.isActive);
  }

  getScheme(id: string): Scheme | undefined {
    return this.schemes.get(id);
  }

  createScheme(schemeData: Omit<Scheme, 'id' | 'createdAt' | 'updatedAt'>): Scheme {
    const id = this.generateId();
    const scheme: Scheme = {
      ...schemeData,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.schemes.set(id, scheme);
    return scheme;
  }

  // Application methods
  getApplicationsByFarmerId(farmerId: string): Application[] {
    return Array.from(this.applications.values()).filter(app => app.farmerId === farmerId);
  }

  createApplication(appData: Omit<Application, 'id' | 'submittedAt'>): Application {
    const id = this.generateId();
    const application: Application = {
      ...appData,
      id,
      submittedAt: new Date()
    };
    this.applications.set(id, application);
    return application;
  }

  // Bookmark methods
  getBookmarksByFarmerId(farmerId: string): Bookmark[] {
    return Array.from(this.bookmarks.values()).filter(bookmark => bookmark.farmerId === farmerId);
  }

  createBookmark(bookmarkData: Omit<Bookmark, 'id' | 'createdAt'>): Bookmark {
    const id = this.generateId();
    const bookmark: Bookmark = {
      ...bookmarkData,
      id,
      createdAt: new Date()
    };
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }

  deleteBookmark(farmerId: string, schemeId: string): void {
    const bookmark = Array.from(this.bookmarks.values())
      .find(b => b.farmerId === farmerId && b.schemeId === schemeId);
    if (bookmark) {
      this.bookmarks.delete(bookmark.id);
    }
  }

  // Notification methods
  getNotificationsByFarmerId(farmerId: string): Notification[] {
    return Array.from(this.notifications.values())
      .filter(notification => notification.farmerId === farmerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  createNotification(notificationData: Omit<Notification, 'id' | 'createdAt'>): Notification {
    const id = this.generateId();
    const notification: Notification = {
      ...notificationData,
      id,
      createdAt: new Date()
    };
    this.notifications.set(id, notification);
    return notification;
  }

  markNotificationAsRead(id: string): void {
    const notification = this.notifications.get(id);
    if (notification) {
      this.notifications.set(id, { ...notification, isRead: true });
    }
  }

  markAllNotificationsAsRead(farmerId: string): void {
    Array.from(this.notifications.values())
      .filter(notification => notification.farmerId === farmerId)
      .forEach(notification => {
        this.notifications.set(notification.id, { ...notification, isRead: true });
      });
  }

  // Stats methods
  getFarmerStats(farmerId: string): {
    activeSchemes: number;
    totalBenefits: number;
    totalLandArea: number;
    activeCrops: number;
  } {
    const applications = this.getApplicationsByFarmerId(farmerId);
    const lands = this.getLandsByFarmerId(farmerId);
    const crops = this.getCropsByFarmerId(farmerId);
    const currentYear = new Date().getFullYear();

    return {
      activeSchemes: applications.filter(app => ['pending', 'approved'].includes(app.status)).length,
      totalBenefits: applications
        .filter(app => app.status === 'completed')
        .reduce((sum, app) => sum + (app.benefitReceived || 0), 0),
      totalLandArea: lands.reduce((sum, land) => sum + land.area, 0),
      activeCrops: crops.filter(crop => crop.year === currentYear).length
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Initialize with empty data
  clear(): void {
    this.users.clear();
    this.farmers.clear();
    this.lands.clear();
    this.crops.clear();
    this.livestock.clear();
    this.schemes.clear();
    this.applications.clear();
    this.bookmarks.clear();
    this.notifications.clear();
  }
}

export const db = new InMemoryDatabase();