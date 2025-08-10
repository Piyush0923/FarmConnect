import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { openRouterService } from "./services/openrouter";
import { weatherService } from "./services/weather";
import { marketService } from "./services/market";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    (req as any).user = user;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({ username, password });
      
      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({ 
        user: { id: user.id, username: user.username, role: user.role },
        token 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({ 
        user: { id: user.id, username: user.username, role: user.role },
        token 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Farmer profile routes
  app.post("/api/farmer/profile", authenticateToken, async (req, res) => {
    try {
      const farmerData = { ...req.body, userId: (req as any).user.userId };
      const farmer = await storage.createFarmer(farmerData);
      res.json(farmer);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/farmer/profile", authenticateToken, async (req, res) => {
    try {
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }
      
      const fullProfile = await storage.getFarmerWithProfile(farmer.id);
      res.json(fullProfile);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/farmer/profile", authenticateToken, async (req, res) => {
    try {
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      const updatedFarmer = await storage.updateFarmer(farmer.id, req.body);
      res.json(updatedFarmer);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Location service using OpenRouter
  app.post("/api/location/detect", authenticateToken, async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ message: "Address is required" });
      }

      const locationData = await openRouterService.getLocationFromAddress(address);
      
      if (locationData) {
        // Update farmer profile with location data
        const farmer = await storage.getFarmerByUserId((req as any).user.userId);
        if (farmer) {
          await storage.updateFarmer(farmer.id, {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            district: locationData.district,
            state: locationData.state
          });
        }
      }

      res.json(locationData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Land management routes
  app.post("/api/farmer/lands", authenticateToken, async (req, res) => {
    try {
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      const landData = { ...req.body, farmerId: farmer.id };
      const land = await storage.createLand(landData);
      res.json(land);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/farmer/lands", authenticateToken, async (req, res) => {
    try {
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      const lands = await storage.getLandsByFarmerId(farmer.id);
      res.json(lands);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Crop management routes
  app.post("/api/farmer/crops", authenticateToken, async (req, res) => {
    try {
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      const cropData = { ...req.body, farmerId: farmer.id };
      const crop = await storage.createCrop(cropData);
      res.json(crop);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/farmer/crops", authenticateToken, async (req, res) => {
    try {
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      const crops = await storage.getCropsByFarmerId(farmer.id);
      res.json(crops);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Livestock management routes
  app.post("/api/farmer/livestock", authenticateToken, async (req, res) => {
    try {
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      const livestockData = { ...req.body, farmerId: farmer.id };
      const livestock = await storage.createLivestock(livestockData);
      res.json(livestock);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Scheme discovery routes using OpenRouter
  app.get("/api/schemes", authenticateToken, async (req, res) => {
    try {
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      // Get existing schemes first
      let schemes = await storage.getSchemes();
      
      // If no schemes exist, generate them using OpenRouter
      if (schemes.length === 0) {
        const farmerProfile = await storage.getFarmerWithProfile(farmer.id);
        const generatedSchemes = await openRouterService.generateSchemes(farmerProfile);
        
        // Store generated schemes
        for (const scheme of generatedSchemes) {
          await storage.createScheme(scheme);
        }
        
        schemes = generatedSchemes;
      }

      res.json(schemes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/schemes/recommended", authenticateToken, async (req, res) => {
    try {
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      const farmerProfile = await storage.getFarmerWithProfile(farmer.id);
      
      // Get all schemes
      let allSchemes = await storage.getSchemes();
      
      // If no schemes exist, generate them
      if (allSchemes.length === 0) {
        const generatedSchemes = await openRouterService.generateSchemes(farmerProfile);
        
        for (const scheme of generatedSchemes) {
          await storage.createScheme(scheme);
        }
        
        allSchemes = generatedSchemes;
      }

      // Use OpenRouter to analyze eligibility and get recommendations
      const recommendations = await openRouterService.analyzeSchemeEligibility(farmerProfile, allSchemes);
      
      // Map recommendations back to schemes with match percentages
      const recommendedSchemes = recommendations
        .filter(rec => rec.matchPercentage >= 60)
        .sort((a, b) => b.matchPercentage - a.matchPercentage)
        .slice(0, 5)
        .map(rec => {
          const scheme = allSchemes.find(s => s.id === rec.schemeId);
          return scheme ? { ...scheme, matchPercentage: rec.matchPercentage } : null;
        })
        .filter(Boolean);

      res.json(recommendedSchemes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Application management routes
  app.get("/api/applications", authenticateToken, async (req, res) => {
    try {
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      const applications = await storage.getApplicationsByFarmerId(farmer.id);
      res.json(applications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/applications", authenticateToken, async (req, res) => {
    try {
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      const applicationData = {
        ...req.body,
        farmerId: farmer.id,
        status: 'pending'
      };
      
      const application = await storage.createApplication(applicationData);
      
      // Create notification
      await storage.createNotification({
        farmerId: farmer.id,
        title: "Application Submitted",
        message: "Your scheme application has been submitted successfully.",
        type: "success",
        isRead: false
      });

      res.json(application);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Bookmark management routes
  app.get("/api/bookmarks", authenticateToken, async (req, res) => {
    try {
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      const bookmarks = await storage.getBookmarksByFarmerId(farmer.id);
      res.json(bookmarks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/bookmarks", authenticateToken, async (req, res) => {
    try {
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      const bookmarkData = {
        ...req.body,
        farmerId: farmer.id
      };

      const bookmark = await storage.createBookmark(bookmarkData);
      res.json(bookmark);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/bookmarks/:schemeId", authenticateToken, async (req, res) => {
    try {
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      await storage.deleteBookmark(farmer.id, req.params.schemeId);
      res.json({ message: "Bookmark removed" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Notification routes
  app.get("/api/notifications", authenticateToken, async (req, res) => {
    try {
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      const notifications = await storage.getNotificationsByFarmerId(farmer.id);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
    try {
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      const stats = await storage.getFarmerStats(farmer.id);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Weather routes using OpenRouter
  app.get("/api/weather", authenticateToken, async (req, res) => {
    try {
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      const weather = await weatherService.getCurrentWeather(farmer);
      res.json(weather);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Market price routes  
  app.get("/api/market/prices", authenticateToken, async (req, res) => {
    try {
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      const prices = await marketService.getCurrentPrices(farmer.state || '', farmer.district || '');
      res.json(prices);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Translation routes using OpenRouter
  app.post("/api/translate", authenticateToken, async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;
      
      const translation = await openRouterService.translateContent({ text, targetLanguage });
      res.json(translation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Voice assistant routes using OpenRouter
  app.post("/api/voice/command", authenticateToken, async (req, res) => {
    try {
      const { command } = req.body;
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      const farmerProfile = await storage.getFarmerWithProfile(farmer.id);
      const result = await openRouterService.processVoiceCommand(command, farmerProfile);
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ 
        intent: 'error',
        response: 'Sorry, I encountered an error processing your command.',
        action: 'error',
        message: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}