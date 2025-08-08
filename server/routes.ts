import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { geminiService } from "./services/gemini";
import { weatherService } from "./services/weather";
import { marketService } from "./services/market";
import { 
  insertUserSchema, insertFarmerSchema, insertLandSchema, insertCropSchema,
  insertLivestockSchema, insertApplicationSchema, insertBookmarkSchema,
  insertNotificationSchema 
} from "@shared/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(userData);
      
      // Create basic farmer profile automatically
      const basicFarmerData = {
        userId: user.id,
        name: '',
        mobileNumber: '',
        language: 'en'
      };
      await storage.createFarmer(basicFarmerData);
      
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
      const farmerData = insertFarmerSchema.parse({ ...req.body, userId: (req as any).user.userId });
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

  // Land management routes
  app.post("/api/farmer/lands", authenticateToken, async (req, res) => {
    try {
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      const landData = insertLandSchema.parse({ ...req.body, farmerId: farmer.id });
      const land = await storage.createLand(landData);
      res.json(land);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Crop management routes
  app.post("/api/farmer/crops", authenticateToken, async (req, res) => {
    try {
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      const cropData = insertCropSchema.parse({ ...req.body, farmerId: farmer.id });
      const crop = await storage.createCrop(cropData);
      res.json(crop);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Livestock management routes
  app.post("/api/farmer/livestock", authenticateToken, async (req, res) => {
    try {
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      const livestockData = insertLivestockSchema.parse({ ...req.body, farmerId: farmer.id });
      const livestock = await storage.createLivestock(livestockData);
      res.json(livestock);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Scheme discovery routes
  app.get("/api/schemes", authenticateToken, async (req, res) => {
    try {
      const schemes = await storage.getSchemes(req.query);
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

      // Check if profile is complete enough for recommendations
      if (!farmer.district || !farmer.state || !farmer.name) {
        const basicSchemes = await storage.getSchemes({ isActive: true });
        return res.json(basicSchemes.slice(0, 3)); // Return top 3 schemes
      }

      const recommendedSchemes = await storage.getRecommendedSchemes(farmer.id);
      
      // Enhance with AI recommendations if Gemini is available
      try {
        const farmerProfile = await storage.getFarmerWithProfile(farmer.id);
        if (farmerProfile && process.env.GEMINI_API_KEY) {
          const aiRecommendations = await geminiService.analyzeSchemeEligibility(
            farmerProfile, 
            recommendedSchemes
          );
          
          // Merge AI insights with database recommendations
          const enhancedSchemes = recommendedSchemes.map(scheme => {
            const aiRec = aiRecommendations.find(r => r.schemeId === scheme.id);
            return aiRec ? { ...scheme, ...aiRec } : scheme;
          });
          
          return res.json(enhancedSchemes);
        }
      } catch (aiError) {
        console.error("AI enhancement failed:", aiError);
      }

      res.json(recommendedSchemes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/schemes/:id", authenticateToken, async (req, res) => {
    try {
      const scheme = await storage.getScheme(req.params.id);
      if (!scheme) {
        return res.status(404).json({ message: "Scheme not found" });
      }
      res.json(scheme);
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

      const applicationData = insertApplicationSchema.parse({
        ...req.body,
        farmerId: farmer.id
      });
      
      const application = await storage.createApplication(applicationData);
      
      // Create notification for successful application
      await storage.createNotification({
        farmerId: farmer.id,
        title: "Application Submitted",
        message: `Your application for scheme has been submitted successfully.`,
        type: "success"
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

      const bookmarkData = insertBookmarkSchema.parse({
        ...req.body,
        farmerId: farmer.id
      });

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

  app.put("/api/notifications/:id/read", authenticateToken, async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/notifications/read-all", authenticateToken, async (req, res) => {
    try {
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      await storage.markAllNotificationsAsRead(farmer.id);
      res.json({ message: "All notifications marked as read" });
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

  // Weather routes
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

  // Translation routes
  app.post("/api/translate", authenticateToken, async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ message: "Translation service not available" });
      }

      const translation = await geminiService.translateContent({ text, targetLanguage });
      res.json(translation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Voice assistant routes
  app.post("/api/voice/command", authenticateToken, async (req, res) => {
    try {
      const { command } = req.body;
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      // Basic voice command processing
      const commandLower = command.toLowerCase();
      
      let intent = 'unknown';
      let response = 'Sorry, I didn\'t understand that command.';
      let action = '';
      let data = {};
      
      if (commandLower.includes('weather') || commandLower.includes('मौसम') || commandLower.includes('వాతావరణం')) {
        intent = 'weather';
        response = 'Here is the current weather information for your location.';
        action = 'navigate';
        data = { path: '/weather' };
      } else if (commandLower.includes('scheme') || commandLower.includes('योजना') || commandLower.includes('పథకం')) {
        intent = 'schemes';
        response = 'Here are the government schemes available for you.';
        action = 'navigate';
        data = { path: '/schemes' };
      } else if (commandLower.includes('profile') || commandLower.includes('प्रोफाइल') || commandLower.includes('ప్రొఫైల్')) {
        intent = 'navigate';
        response = 'Opening your profile page.';
        action = 'navigate';
        data = { path: '/profile' };
      } else if (commandLower.includes('dashboard') || commandLower.includes('डैशबोर्ड') || commandLower.includes('డాష్‌బోర్డ్')) {
        intent = 'navigate';
        response = 'Opening your dashboard.';
        action = 'navigate';
        data = { path: '/dashboard' };
      } else if (commandLower.includes('market') || commandLower.includes('price') || commandLower.includes('बाजार') || commandLower.includes('దరలు')) {
        intent = 'market';
        response = 'Here are the current market prices for agricultural products.';
        action = 'navigate';
        data = { path: '/market' };
      } else if (commandLower.includes('help') || commandLower.includes('मदद') || commandLower.includes('సహాయం')) {
        intent = 'help';
        response = 'I can help you check weather, view schemes, navigate to your profile, or check market prices. Just say what you need!';
        action = 'help';
      } else {
        response = 'I can help you with weather information, government schemes, profile updates, market prices, or navigation. What would you like to know?';
        action = 'help';
      }
      
      res.json({ intent, response, action, data });
    } catch (error: any) {
      res.status(500).json({ 
        intent: 'error',
        response: 'Sorry, I encountered an error processing your command.',
        action: 'error',
        message: error.message 
      });
    }
  });

  // Farming tips
  app.get("/api/farming/tips", authenticateToken, async (req, res) => {
    try {
      const farmer = await storage.getFarmerByUserId((req as any).user.userId);
      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.json([
          "Ensure proper irrigation management based on crop requirements",
          "Monitor soil moisture levels regularly",
          "Apply organic compost to improve soil health",
          "Check for pest and disease symptoms weekly"
        ]);
      }

      const farmerProfile = await storage.getFarmerWithProfile(farmer.id);
      const tips = await geminiService.generateFarmingTips(farmerProfile!);
      res.json(tips);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}
