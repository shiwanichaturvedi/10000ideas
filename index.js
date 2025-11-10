// server/index.ts
import express3 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import {
  users,
  submittedIdeas,
  campaigns,
  investments,
  paymentTransactions,
  aiGeneratedIdeas,
  aiGenerationSessions
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema });

// server/storage.ts
import { eq } from "drizzle-orm";
var DatabaseStorage = class {
  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true
    });
  }
  // User methods
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createUser(user) {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  // Submitted Ideas methods
  async createSubmittedIdea(idea) {
    const [newIdea] = await db.insert(submittedIdeas).values({
      ...idea,
      tags: idea.tags
    }).returning();
    return newIdea;
  }
  async getSubmittedIdeas() {
    return await db.select().from(submittedIdeas);
  }
  async getSubmittedIdeaById(id) {
    const [idea] = await db.select().from(submittedIdeas).where(eq(submittedIdeas.id, id));
    return idea;
  }
  async updateSubmittedIdeaStatus(id, status) {
    const [updated] = await db.update(submittedIdeas).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(submittedIdeas.id, id)).returning();
    return updated;
  }
  // Campaign methods
  async createCampaign(userId, campaign) {
    const campaignData = {
      userId,
      title: campaign.title || "",
      description: campaign.description || "",
      category: campaign.category || "",
      subcategory: campaign.subcategory || null,
      targetAmount: campaign.targetAmount || "0",
      fundingType: campaign.fundingType || "",
      stage: campaign.stage || "",
      location: campaign.location || "",
      useOfFunds: campaign.useOfFunds || "",
      campaignDuration: campaign.campaignDuration || ""
    };
    const [newCampaign] = await db.insert(campaigns).values(campaignData).returning();
    return newCampaign;
  }
  async getUserCampaigns(userId) {
    return await db.select().from(campaigns).where(eq(campaigns.userId, userId));
  }
  async getCampaignById(id) {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }
  async updateCampaign(id, updates) {
    const [updated] = await db.update(campaigns).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(campaigns.id, id)).returning();
    return updated;
  }
  async getActiveCampaigns() {
    return await db.select().from(campaigns);
  }
  // Investment methods
  async createInvestment(investment) {
    const investmentData = {
      campaignId: investment.campaignId,
      investorId: investment.investorId,
      amount: investment.amount || "0",
      investmentType: investment.investmentType || "",
      equityPercentage: investment.equityPercentage || null,
      expectedReturn: investment.expectedReturn || null,
      notes: investment.notes || null
    };
    const [newInvestment] = await db.insert(investments).values(investmentData).returning();
    return newInvestment;
  }
  async getUserInvestments(userId) {
    return await db.select().from(investments).where(eq(investments.investorId, userId));
  }
  async getCampaignInvestments(campaignId) {
    return await db.select().from(investments).where(eq(investments.campaignId, campaignId));
  }
  // Payment transaction methods
  async createPaymentTransaction(transaction) {
    const transactionData = {
      userId: transaction.userId,
      amount: transaction.amount || "0",
      type: transaction.type || ""
    };
    const [newTransaction] = await db.insert(paymentTransactions).values(transactionData).returning();
    return newTransaction;
  }
  async updatePaymentTransaction(id, updates) {
    const [updated] = await db.update(paymentTransactions).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(paymentTransactions.id, id)).returning();
    return updated;
  }
  // AI Generated Ideas methods
  async createAiGenerationSession(userId, session3) {
    const sessionData = {
      userId,
      userInput: session3.userInput || "",
      industry: session3.industry || void 0,
      budget: session3.budget || void 0,
      location: session3.location || void 0,
      ideasCount: "0",
      processingTime: void 0,
      status: "pending",
      errorMessage: void 0
    };
    const [newSession] = await db.insert(aiGenerationSessions).values(sessionData).returning();
    return newSession;
  }
  async updateAiGenerationSession(id, updates) {
    const [updated] = await db.update(aiGenerationSessions).set(updates).where(eq(aiGenerationSessions.id, id)).returning();
    return updated;
  }
  async createAiGeneratedIdea(idea) {
    const ideaData = {
      userId: idea.userId,
      sessionId: idea.sessionId,
      title: idea.title || "",
      description: idea.description || "",
      userInput: idea.userInput || "",
      marketSize: idea.marketSize || void 0,
      growthTrends: idea.growthTrends || void 0,
      competitors: idea.competitors || [],
      moats: idea.moats || [],
      opportunities: idea.opportunities || [],
      location: idea.location || void 0,
      risks: idea.risks || [],
      nextSteps: idea.nextSteps || [],
      isFavorited: "false"
    };
    const [newIdea] = await db.insert(aiGeneratedIdeas).values(ideaData).returning();
    return newIdea;
  }
  async getUserAiIdeas(userId) {
    return await db.select().from(aiGeneratedIdeas).where(eq(aiGeneratedIdeas.userId, userId));
  }
  async getUserAiSessions(userId) {
    return await db.select().from(aiGenerationSessions).where(eq(aiGenerationSessions.userId, userId));
  }
  async getAiIdeasBySession(sessionId) {
    return await db.select().from(aiGeneratedIdeas).where(eq(aiGeneratedIdeas.sessionId, sessionId));
  }
  async updateAiIdeaFavorite(ideaId, isFavorited) {
    const [updated] = await db.update(aiGeneratedIdeas).set({ isFavorited: isFavorited ? "true" : "false" }).where(eq(aiGeneratedIdeas.id, ideaId)).returning();
    return updated;
  }
  async getUserFavoriteAiIdeas(userId) {
    return await db.select().from(aiGeneratedIdeas).where(eq(aiGeneratedIdeas.userId, userId));
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { insertSubmittedIdeaSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "USER_NOT_FOUND" });
          }
          if (!await comparePasswords(password, user.password)) {
            return done(null, false, { message: "INVALID_PASSWORD" });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        name,
        email,
        password: hashedPassword
      });
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        });
      });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        if (info?.message === "USER_NOT_FOUND") {
          return res.status(404).json({
            message: "Account not found. Please sign up first to create your account.",
            code: "USER_NOT_FOUND",
            type: "NO_ACCOUNT",
            action: "SIGNUP_REQUIRED"
          });
        }
        if (info?.message === "INVALID_PASSWORD") {
          return res.status(401).json({
            message: "Invalid email or password. Please try again.",
            code: "INVALID_PASSWORD",
            type: "WRONG_CREDENTIALS"
          });
        }
        return res.status(401).json({
          message: "Authentication failed. Please try again.",
          code: "AUTH_FAILED",
          type: "GENERAL_ERROR"
        });
      }
      req.login(user, (err2) => {
        if (err2) return next(err2);
        res.status(200).json({
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        });
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    const user = req.user;
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  });
}

// server/campaign-api.ts
import { z } from "zod";
import { insertInvestmentSchema } from "@shared/schema";
function setupCampaignRoutes(app2) {
  app2.get("/api/campaigns/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      const campaigns2 = await storage.getUserCampaigns(req.user.id);
      res.json(campaigns2);
    } catch (error) {
      console.error("Error fetching user campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });
  app2.get("/api/campaigns/active", async (req, res) => {
    try {
      const campaigns2 = await storage.getActiveCampaigns();
      res.json(campaigns2);
    } catch (error) {
      console.error("Error fetching active campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });
  app2.post("/api/campaigns/setup", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      const setupSchema = z.object({
        targetAmount: z.number(),
        fundingType: z.string(),
        campaignDuration: z.string()
      });
      const setupData = setupSchema.parse(req.body);
      const campaign = await storage.createCampaign(req.user.id, {
        title: "Draft Campaign",
        description: "Campaign setup in progress",
        targetAmount: setupData.targetAmount.toString(),
        fundingType: setupData.fundingType,
        campaignDuration: setupData.campaignDuration,
        status: "draft",
        category: "Other",
        stage: "idea",
        location: "India",
        useOfFunds: "Setup in progress"
      });
      res.json({
        campaignId: campaign.id,
        message: "Campaign created successfully"
      });
    } catch (error) {
      console.error("Error setting up campaign:", error);
      res.status(500).json({ message: "Failed to setup campaign" });
    }
  });
  app2.get("/api/campaigns/:id", async (req, res) => {
    try {
      const campaign = await storage.getCampaignById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });
  app2.put("/api/campaigns/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      const campaign = await storage.getCampaignById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      if (campaign.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const updatedCampaign = await storage.updateCampaign(req.params.id, req.body);
      res.json(updatedCampaign);
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });
  app2.post("/api/campaigns/:id/publish", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      const campaign = await storage.getCampaignById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      if (campaign.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const updatedCampaign = await storage.updateCampaign(req.params.id, {
        status: "active",
        startDate: /* @__PURE__ */ new Date()
      });
      res.json({
        message: "Campaign published successfully",
        campaign: updatedCampaign
      });
    } catch (error) {
      console.error("Error publishing campaign:", error);
      res.status(500).json({ message: "Failed to publish campaign" });
    }
  });
  app2.get("/api/investments/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      const investments2 = await storage.getUserInvestments(req.user.id);
      res.json(investments2);
    } catch (error) {
      console.error("Error fetching user investments:", error);
      res.status(500).json({ message: "Failed to fetch investments" });
    }
  });
  app2.post("/api/investments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      const investmentData = insertInvestmentSchema.parse(req.body);
      const investment = await storage.createInvestment({
        ...investmentData,
        campaignId: req.body.campaignId,
        investorId: req.user.id
      });
      res.status(201).json(investment);
    } catch (error) {
      console.error("Error creating investment:", error);
      res.status(500).json({ message: "Failed to create investment" });
    }
  });
}

// server/ai-service.ts
import { GoogleGenAI } from "@google/genai";
var ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
var AIIdeaService = class _AIIdeaService {
  constructor() {
    this.cache = /* @__PURE__ */ new Map();
  }
  static getInstance() {
    if (!_AIIdeaService.instance) {
      _AIIdeaService.instance = new _AIIdeaService();
    }
    return _AIIdeaService.instance;
  }
  generatePrompt(input) {
    const { userInput, industry, budget, location } = input;
    return `You are an expert business consultant and venture capitalist with access to current market research, industry reports, and real-time data. Generate 5 comprehensive, highly detailed business ideas for the "10000Ideas" platform using ONLY authentic, verifiable market data with precise figures and proper citations.

CRITICAL INSTRUCTIONS:
- Use REAL market data from recent industry reports, government statistics, and credible research sources
- Include PRECISE figures with proper units (\u20B9 crores, $ millions/billions, percentages, growth rates)
- Cite data sources where possible (industry reports, market research firms, government data)
- For Indian market: Use \u20B9 (Indian Rupees) in crores/lakhs for local market data
- For global market: Use $ (USD) in millions/billions
- Provide SPECIFIC CAGR figures with exact time periods
- Include competitor revenue figures, funding amounts, and market share data

User Context:
- Interest/Background: "${userInput}"
${industry ? `- Industry Focus: ${industry}` : ""}
${location ? `- Target Location: ${location}` : ""}
${budget ? `- Available Budget: ${budget}` : ""}

For each business idea, provide exhaustive analysis with REAL, QUANTIFIED data:

{
  "title": "Compelling business name (be creative and professional)",
  "description": "Comprehensive business concept description explaining the core value proposition, target market, and unique differentiators (4-5 sentences)",
  "marketSize": "TAM (Total Addressable Market): $X.X billion globally (Source: [Industry Report/Research Firm]). SAM (Serviceable Addressable Market): \u20B9X,XXX crores in India or $X.X billion in target region (Source: [Government/Industry Data]). SOM (Serviceable Obtainable Market): \u20B9XXX crores/$XX million achievable in 3-5 years based on X% market penetration. CAGR: XX.X% (2024-2030) (Source: [Market Research Report]). ${location || "Target location"} market size: \u20B9XXX crores/$XX million with XX% annual growth (Source: [Local Market Data]).",
  "growthTrends": "Market maturity: [Early/Growth/Mature] stage with XX% market penetration. Primary growth driver: [Technology adoption/Demographic shifts/Policy changes] contributing XX.X% annual growth (Source: [Industry Analysis]). Digital adoption rate: XX% year-over-year increase. Consumer spending increase: XX% annually in target segment. ${location || "Target market"} specific trends: XX% market growth, XX% digital penetration, \u20B9XXX crores additional market opportunity. Regulatory environment: [Favorable/Challenging] with XX impact on market growth. Future projection: Market expected to reach \u20B9X,XXX crores/$XX billion by 2030.",
  "competitors": [
    {"name": "[Real Company Name]", "description": "Market share: XX.X% (Source: [Report]). Revenue: \u20B9XXX crores/$XX million (FY2024). Funding: $XX million total raised. Strengths: [Specific operational advantages]. Weaknesses: [Market gaps, customer complaints]. Growth rate: XX% YoY. Geographic presence: XX cities/countries."},
    {"name": "[Real Company Name]", "description": "Market position: #X player with XX% market share. Revenue: \u20B9XXX crores/$XX million annually. Recent funding: $XX million Series [X] (Date). Customer base: X million users. Key differentiators: [Specific features/services]. Vulnerabilities: [Competition weak points]."},
    {"name": "[Real Company Name]", "description": "Business model: [B2B/B2C/Marketplace]. Market approach: [Direct/Partnership/Digital-first]. Revenue: \u20B9XXX crores/$XX million. Funding status: [Bootstrap/Series X]. Threat level: [High/Medium/Low]. Partnership opportunities: [Specific collaboration potential]."}
  ],
  "moats": [
    "Network Effects: How user/customer growth creates exponential value and competitive barriers",
    "Switching Costs: Customer retention mechanisms, data lock-in, integration complexity that prevents churn",
    "Operational Excellence: Process advantages, cost leadership, supply chain optimization, or execution superiority",
    "Brand/Community: Brand recognition strategy, community building, thought leadership positioning",
    "Technology/IP: Proprietary technology, patents, exclusive data, or technical expertise barriers"
  ],
  "opportunities": [
    "Market Expansion: Specific geographic markets, customer segments, or demographic opportunities with addressable market size",
    "Product Extension: Adjacent products/services, revenue stream diversification, cross-selling opportunities with revenue potential",
    "Strategic Partnerships: Key industry partnerships, distribution channels, technology integrations that accelerate growth",
    "Technology Leverage: AI/ML integration, automation opportunities, emerging tech adoption for competitive advantage",
    "Market Timing: First-mover advantages, regulatory changes, demographic shifts creating optimal market entry timing"
  ],
  "risks": [
    "Market Risk: Competition intensity, market saturation, economic sensitivity (probability: X%, impact: high/medium/low)",
    "Operational Risk: Execution challenges, scalability limitations, operational complexity (mitigation: specific strategies)",
    "Financial Risk: Cash flow challenges, funding requirements, revenue concentration (contingency: backup plans)",
    "Regulatory Risk: Compliance requirements, regulatory changes, licensing challenges (preparation: compliance strategy)",
    "Technology Risk: Technical execution difficulty, technology obsolescence, cybersecurity (prevention: technical strategies)"
  ],
  "investmentRange": "Total Investment: \u20B9XX-XX lakhs/$XXX,XXX-$XXX,XXX. Initial Setup: \u20B9X.X lakhs/$XX,XXX (registration \u20B9XX,XXX, permits \u20B9XX,XXX, infrastructure \u20B9XX,XXX). Technology Development: \u20B9X.X lakhs/$XX,XXX (development team, software licenses, testing). Operations (6-12 months): \u20B9XX lakhs/$XX,XXX (salaries \u20B9XX,XXX/month, rent \u20B9XX,XXX/month, utilities \u20B9XX,XXX/month). Marketing: \u20B9X.X lakhs/$XX,XXX (digital ads \u20B9XX,XXX, content \u20B9XX,XXX, branding \u20B9XX,XXX). Working Capital: \u20B9X.X lakhs/$XX,XXX (inventory, cash flow buffer). Funding stages: Bootstrap \u20B9XX lakhs (months 1-6), Seed \u20B9XX lakhs-\u20B9X crore (months 6-18), Series A \u20B9X-X crores (year 2-3).",
  "roiPotential": "Break-even: XX months with \u20B9XX lakhs monthly revenue target. Revenue Projections: Year 1 \u20B9XX lakhs/$XXX,XXX (customer base: X,XXX users at \u20B9XXX/user/month). Year 2 \u20B9X.X crores/$X.X million (XX% growth, X,XXX customers). Year 3 \u20B9XX crores/$XX million (XX% market penetration). Unit Economics: Customer LTV \u20B9XX,XXX/$X,XXX, CAC \u20B9X,XXX/$XXX, LTV/CAC ratio X.X:1. Gross margins: XX%, Net margins: XX% by year 3. Market capture: X.X% of \u20B9XXX crores SOM. Exit valuation: \u20B9XXX-XXX crores/$XX-XX million (X-X revenue multiple based on industry standards). Comparable exits: [Real company examples with valuations].",
  "nextSteps": [
    "Month 1-2: Market Research & Validation - Survey XXX potential customers, analyze 5 direct competitors, validate problem-solution fit. Budget: \u20B9X.X lakhs/$X,XXX (research tools \u20B9XX,XXX, travel \u20B9XX,XXX, surveys \u20B9XX,XXX)",
    "Month 2-4: MVP Development - Build core features, develop technology stack, alpha testing with XX users. Budget: \u20B9X.X lakhs/$XX,XXX (developer salary \u20B9XXX,XXX, software licenses \u20B9XX,XXX, testing \u20B9XX,XXX)",
    "Month 3-5: Legal Setup & Compliance - Business registration, IP filing, regulatory approvals, initial partnerships. Budget: \u20B9XX,XXX/$X,XXX (registration \u20B9XX,XXX, legal fees \u20B9XX,XXX, compliance \u20B9XX,XXX)",
    "Month 4-7: Pilot Launch - Limited market test with XXX customers, product refinement, initial revenue generation. Budget: \u20B9X.X lakhs/$XX,XXX (operations \u20B9XX,XXX, marketing \u20B9XX,XXX)",
    "Month 6-9: Team & Operations Scaling - Hire X employees, establish processes, expand to XX locations/customers. Budget: \u20B9XX lakhs/$XX,XXX (salaries \u20B9XXX,XXX, infrastructure \u20B9XX,XXX)",
    "Month 8-11: Growth & Marketing - Launch customer acquisition campaigns, achieve XXX customers, \u20B9XX lakhs revenue target. Budget: \u20B9X.X lakhs/$XX,XXX (digital marketing \u20B9XX,XXX, sales team \u20B9XX,XXX)",
    "Month 10-12: Funding & Expansion - Raise \u20B9X-X crores Series A, expand to XX cities, achieve \u20B9XX lakhs monthly revenue. Budget: \u20B9XX,XXX/$X,XXX (fundraising, expansion planning)"
  ]
}

Generate exactly 5 unique, well-researched business ideas with this comprehensive level of detail. Each idea should include specific market data, realistic financial projections, and actionable implementation plans tailored to the user's background and constraints.`;
  }
  async generateIdeas(input) {
    const startTime = Date.now();
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
      const cacheKey = JSON.stringify(input);
      if (this.cache.has(cacheKey)) {
        const cachedResult = this.cache.get(cacheKey);
        return {
          ...cachedResult,
          sessionId,
          processingTime: Date.now() - startTime
        };
      }
      const prompt = this.generatePrompt(input);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                marketSize: { type: "string" },
                growthTrends: { type: "string" },
                competitors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      website: { type: "string" }
                    },
                    required: ["name", "description"]
                  }
                },
                moats: { type: "array", items: { type: "string" } },
                opportunities: { type: "array", items: { type: "string" } },
                risks: { type: "array", items: { type: "string" } },
                investmentRange: { type: "string" },
                roiPotential: { type: "string" },
                nextSteps: { type: "array", items: { type: "string" } }
              },
              required: ["title", "description", "marketSize", "growthTrends", "competitors", "moats", "opportunities", "risks", "investmentRange", "roiPotential", "nextSteps"]
            }
          }
        },
        contents: prompt
      });
      const rawIdeas = JSON.parse(response.text || "[]");
      const enrichedIdeas = await this.enrichIdeasWithMarketData(rawIdeas, input);
      const result = {
        ideas: enrichedIdeas,
        processingTime: Date.now() - startTime,
        sessionId
      };
      this.cache.set(cacheKey, { ideas: enrichedIdeas });
      setTimeout(() => this.cache.delete(cacheKey), 60 * 60 * 1e3);
      return result;
    } catch (error) {
      console.error("Error generating ideas:", error);
      throw new Error(`Failed to generate ideas: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  async enrichIdeasWithMarketData(ideas, input) {
    const enrichmentPromises = ideas.map(async (idea) => {
      try {
        const marketQuery = `${idea.title} market size growth trends 2024 2025`;
        const competitorQuery = `${idea.title} competitors companies ${input.location || "global"}`;
        return {
          ...idea,
          competitors: idea.competitors || [],
          moats: Array.isArray(idea.moats) ? idea.moats : [],
          opportunities: Array.isArray(idea.opportunities) ? idea.opportunities : [],
          risks: Array.isArray(idea.risks) ? idea.risks : [],
          nextSteps: Array.isArray(idea.nextSteps) ? idea.nextSteps : []
        };
      } catch (error) {
        console.warn(`Failed to enrich idea "${idea.title}":`, error);
        return idea;
      }
    });
    return Promise.all(enrichmentPromises);
  }
  async searchMarketData(query) {
    try {
      const searchResults = await this.webSearch(`${query} market research data 2024`);
      return searchResults;
    } catch (error) {
      console.warn("Market data search failed:", error);
      return null;
    }
  }
  async webSearch(query) {
    return {
      query,
      results: [],
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  clearCache() {
    this.cache.clear();
  }
};
var aiIdeaService = AIIdeaService.getInstance();

// server/ai-routes.ts
import { insertAiGenerationSessionSchema } from "@shared/schema";
import { z as z2 } from "zod";
function registerAiRoutes(app2) {
  const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };
  app2.post("/api/ai/generate-ideas", requireAuth, async (req, res) => {
    try {
      console.log("AI generate-ideas request received from user:", req.user?.id);
      console.log("Request body:", req.body);
      const userId = req.user.id;
      const validatedInput = insertAiGenerationSessionSchema.parse(req.body);
      console.log("Validated input:", validatedInput);
      const session3 = await storage.createAiGenerationSession(userId, validatedInput);
      const startTime = Date.now();
      const aiResponse = await aiIdeaService.generateIdeas({
        userInput: validatedInput.userInput,
        industry: validatedInput.industry || void 0,
        budget: validatedInput.budget || void 0,
        location: validatedInput.location || void 0
      });
      const storedIdeas = await Promise.all(
        aiResponse.ideas.map(
          (idea) => storage.createAiGeneratedIdea({
            userId,
            sessionId: session3.id,
            title: idea.title,
            description: idea.description,
            marketSize: idea.marketSize,
            growthTrends: idea.growthTrends,
            competitors: idea.competitors,
            moats: idea.moats,
            opportunities: idea.opportunities,
            risks: idea.risks,
            investmentRange: idea.investmentRange,
            roiPotential: idea.roiPotential,
            nextSteps: idea.nextSteps,
            userInput: validatedInput.userInput,
            industry: validatedInput.industry,
            budget: validatedInput.budget,
            location: validatedInput.location
          })
        )
      );
      await storage.updateAiGenerationSession(session3.id, {
        status: "completed",
        ideasCount: storedIdeas.length.toString(),
        processingTime: (Date.now() - startTime).toString()
      });
      res.json({
        sessionId: session3.id,
        ideas: storedIdeas,
        processingTime: Date.now() - startTime,
        message: `Generated ${storedIdeas.length} personalized business ideas`
      });
    } catch (error) {
      console.error("Error generating ideas:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
      if (req.sessionId) {
        try {
          await storage.updateAiGenerationSession(req.sessionId, {
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error"
          });
        } catch (updateError) {
          console.error("Failed to update session error:", updateError);
        }
      }
      if (error instanceof z2.ZodError) {
        console.log("Validation error details:", error.errors);
        return res.status(400).json({
          message: "Invalid input",
          errors: error.errors
        });
      }
      res.status(500).json({
        message: "Failed to generate ideas",
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : void 0
      });
    }
  });
  app2.get("/api/ideas/history", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const allSessions = await storage.getUserAiSessions(userId);
      const sessions = allSessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice((page - 1) * limit, page * limit);
      const sessionsWithIdeas = await Promise.all(
        sessions.map(async (session3) => {
          const ideas = await storage.getAiIdeasBySession(session3.id);
          return {
            ...session3,
            ideas: ideas.length,
            sampleIdeas: ideas.slice(0, 3).map((idea) => ({
              id: idea.id,
              title: idea.title,
              description: idea.description.substring(0, 100) + "...",
              isFavorited: idea.isFavorited === "true"
            }))
          };
        })
      );
      res.json({
        sessions: sessionsWithIdeas,
        pagination: {
          page,
          limit,
          total: allSessions.length,
          totalPages: Math.ceil(allSessions.length / limit)
        }
      });
    } catch (error) {
      console.error("Error fetching history:", error);
      res.status(500).json({
        message: "Failed to fetch idea history",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/ideas/session/:sessionId", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const sessionId = req.params.sessionId;
      const sessions = await storage.getUserAiSessions(userId);
      const session3 = sessions.find((s) => s.id === sessionId);
      if (!session3) {
        return res.status(404).json({ message: "Session not found" });
      }
      const ideas = await storage.getAiIdeasBySession(sessionId);
      res.json({
        session: session3,
        ideas
      });
    } catch (error) {
      console.error("Error fetching session ideas:", error);
      res.status(500).json({
        message: "Failed to fetch session ideas",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/ideas/favorite", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { ideaId, isFavorited } = req.body;
      if (!ideaId || typeof isFavorited !== "boolean") {
        return res.status(400).json({
          message: "ideaId and isFavorited (boolean) are required"
        });
      }
      const userIdeas = await storage.getUserAiIdeas(userId);
      const idea = userIdeas.find((i) => i.id === ideaId);
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      const updatedIdea = await storage.updateAiIdeaFavorite(ideaId, isFavorited);
      res.json({
        message: isFavorited ? "Idea added to favorites" : "Idea removed from favorites",
        idea: updatedIdea
      });
    } catch (error) {
      console.error("Error updating favorite:", error);
      res.status(500).json({
        message: "Failed to update favorite status",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/ideas/favorites", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const favorites = await storage.getUserFavoriteAiIdeas(userId);
      res.json({
        favorites: favorites.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      });
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({
        message: "Failed to fetch favorite ideas",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/ideas/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const [sessions, ideas, favorites] = await Promise.all([
        storage.getUserAiSessions(userId),
        storage.getUserAiIdeas(userId),
        storage.getUserFavoriteAiIdeas(userId)
      ]);
      const completedSessions = sessions.filter((s) => s.status === "completed");
      const totalProcessingTime = completedSessions.reduce((total, session3) => {
        return total + parseInt(session3.processingTime || "0");
      }, 0);
      const industryUsage = sessions.reduce((acc, session3) => {
        const industry = session3.industry || "General";
        acc[industry] = (acc[industry] || 0) + 1;
        return acc;
      }, {});
      res.json({
        totalSessions: sessions.length,
        completedSessions: completedSessions.length,
        totalIdeas: ideas.length,
        favoriteIdeas: favorites.length,
        averageProcessingTime: completedSessions.length > 0 ? Math.round(totalProcessingTime / completedSessions.length) : 0,
        industryUsage,
        recentActivity: sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map((session3) => ({
          id: session3.id,
          userInput: session3.userInput.substring(0, 50) + "...",
          status: session3.status,
          createdAt: session3.createdAt
        }))
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({
        message: "Failed to fetch statistics",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}

// server/admin-routes.ts
import express from "express";
import multer from "multer";
import csv from "csv-parser";
import Papa from "papaparse";
import fs from "fs";
import { z as z3 } from "zod";

// server/admin-auth.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { eq as eq2, and } from "drizzle-orm";
import { adminUsers, adminSessions, adminActivityLogs } from "@shared/schema";
var JWT_SECRET = process.env.ADMIN_JWT_SECRET || crypto.randomBytes(64).toString("hex");
var TOKEN_EXPIRY = "24h";
var AUTHORIZED_ADMIN_EMAILS = ["admin1@10000ideas.com", "admin2@10000ideas.com"];
var AdminAuthService = class {
  // Initialize admin users if they don't exist
  static async initializeAdminUsers() {
    try {
      const existingAdmins = await db.select().from(adminUsers);
      if (existingAdmins.length === 0) {
        console.log("Initializing admin users...");
        const hashedPassword = await bcrypt.hash("admin123", 12);
        await db.insert(adminUsers).values([
          {
            email: AUTHORIZED_ADMIN_EMAILS[0],
            name: "Admin One",
            password: hashedPassword
          },
          {
            email: AUTHORIZED_ADMIN_EMAILS[1],
            name: "Admin Two",
            password: hashedPassword
          }
        ]);
        console.log("Admin users initialized with default passwords");
      }
    } catch (error) {
      console.error("Error initializing admin users:", error);
    }
  }
  // Validate admin login credentials
  static async validateAdmin(email, password) {
    try {
      if (!AUTHORIZED_ADMIN_EMAILS.includes(email)) {
        return { success: false, error: "Unauthorized email" };
      }
      const [admin] = await db.select().from(adminUsers).where(and(eq2(adminUsers.email, email), eq2(adminUsers.isActive, "true")));
      if (!admin) {
        return { success: false, error: "Admin not found" };
      }
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        return { success: false, error: "Invalid password" };
      }
      return { success: true, admin };
    } catch (error) {
      console.error("Error validating admin:", error);
      return { success: false, error: "Authentication failed" };
    }
  }
  // Create admin session and JWT token
  static async createAdminSession(adminId, req) {
    try {
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3);
      await db.insert(adminSessions).values({
        id: sessionId,
        adminId,
        token: sessionId,
        // We'll update this with the JWT
        expiresAt,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent") || ""
      });
      const [admin] = await db.select().from(adminUsers).where(eq2(adminUsers.id, adminId));
      const payload = {
        adminId,
        email: admin.email,
        sessionId
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
      await db.update(adminSessions).set({ token }).where(eq2(adminSessions.id, sessionId));
      await db.update(adminUsers).set({ lastLogin: /* @__PURE__ */ new Date() }).where(eq2(adminUsers.id, adminId));
      return { success: true, token, sessionId };
    } catch (error) {
      console.error("Error creating admin session:", error);
      return { success: false, error: "Session creation failed" };
    }
  }
  // Verify admin token and session
  static async verifyAdminToken(token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const [session3] = await db.select().from(adminSessions).where(
        and(
          eq2(adminSessions.token, token),
          eq2(adminSessions.isRevoked, "false")
        )
      );
      if (!session3 || session3.expiresAt < /* @__PURE__ */ new Date()) {
        return { success: false, error: "Invalid or expired session" };
      }
      const [admin] = await db.select().from(adminUsers).where(eq2(adminUsers.id, payload.adminId));
      if (!admin || admin.isActive !== "true") {
        return { success: false, error: "Admin not found or inactive" };
      }
      return { success: true, admin, session: session3 };
    } catch (error) {
      console.error("Error verifying admin token:", error);
      return { success: false, error: "Token verification failed" };
    }
  }
  // Revoke admin session
  static async revokeAdminSession(sessionId) {
    try {
      await db.update(adminSessions).set({ isRevoked: "true" }).where(eq2(adminSessions.id, sessionId));
      return { success: true };
    } catch (error) {
      console.error("Error revoking admin session:", error);
      return { success: false, error: "Session revocation failed" };
    }
  }
  // Log admin activity
  static async logActivity(adminId, action, req, details, resourceType, resourceId, success = true, errorMessage) {
    try {
      await db.insert(adminActivityLogs).values({
        adminId,
        action,
        resource: resourceType || "admin",
        resourceId,
        details,
        status: success ? "success" : "error",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent") || ""
      });
    } catch (error) {
      console.error("Error logging admin activity:", error);
    }
  }
};
var requireAdminAuth = async (req, res, next) => {
  try {
    let token = req.cookies["admin-token"];
    if (!token) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Admin authentication required" });
      }
      token = authHeader.substring(7);
    }
    const result = await AdminAuthService.verifyAdminToken(token);
    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }
    req.admin = result.admin;
    req.adminSession = result.session;
    next();
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    res.status(500).json({ error: "Authentication error" });
  }
};
var requireSuperAdmin = async (req, res, next) => {
  const admin = req.admin;
  if (!admin || !AUTHORIZED_ADMIN_EMAILS.includes(admin.email)) {
    return res.status(403).json({ error: "Super admin access required" });
  }
  next();
};

// server/admin-storage.ts
import { eq as eq3, and as and2, desc, count, sql, gte, lte, ilike, or } from "drizzle-orm";
import {
  platformIdeas,
  uploadHistory,
  deleteHistory,
  adminActivityLogs as adminActivityLogs2
} from "@shared/schema";
var AdminStorage = class {
  // Dashboard Statistics
  async getDashboardStats() {
    const now = /* @__PURE__ */ new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
    const [
      totalIdeasCount,
      visibleIdeasCount,
      hiddenIdeasCount,
      recentlyAddedCount,
      recentlyModifiedCount,
      pendingDeletionsCount,
      totalUploadsCount,
      viewsAndLikes
    ] = await Promise.all([
      db.select({ count: count() }).from(platformIdeas),
      db.select({ count: count() }).from(platformIdeas).where(eq3(platformIdeas.isVisible, "true")),
      db.select({ count: count() }).from(platformIdeas).where(eq3(platformIdeas.isVisible, "false")),
      db.select({ count: count() }).from(platformIdeas).where(gte(platformIdeas.createdAt, weekAgo)),
      db.select({ count: count() }).from(platformIdeas).where(gte(platformIdeas.updatedAt, weekAgo)),
      db.select({ count: count() }).from(deleteHistory).where(
        and2(
          eq3(deleteHistory.itemType, "platform_idea"),
          eq3(deleteHistory.canRestore, "true"),
          gte(deleteHistory.permanentDeleteAt, now)
        )
      ),
      db.select({ count: count() }).from(uploadHistory).where(eq3(uploadHistory.isDeleted, "false")),
      db.select({
        totalViews: sql`sum(cast(${platformIdeas.views} as integer))`,
        totalLikes: sql`sum(cast(${platformIdeas.likes} as integer))`
      }).from(platformIdeas)
    ]);
    return {
      totalIdeas: totalIdeasCount[0].count,
      visibleIdeas: visibleIdeasCount[0].count,
      hiddenIdeas: hiddenIdeasCount[0].count,
      recentlyAdded: recentlyAddedCount[0].count,
      recentlyModified: recentlyModifiedCount[0].count,
      pendingDeletions: pendingDeletionsCount[0].count,
      totalUploads: totalUploadsCount[0].count,
      totalViews: viewsAndLikes[0]?.totalViews || 0,
      totalLikes: viewsAndLikes[0]?.totalLikes || 0
    };
  }
  // Platform Ideas Management
  async getPlatformIdeas(options) {
    const { page, limit, sortBy = "createdAt", sortOrder = "desc", search, category, visible } = options;
    const offset = (page - 1) * limit;
    let whereConditions = [];
    if (search) {
      whereConditions.push(
        or(
          ilike(platformIdeas.title, `%${search}%`),
          ilike(platformIdeas.description, `%${search}%`),
          ilike(platformIdeas.category, `%${search}%`)
        )
      );
    }
    if (category && category !== "all") {
      whereConditions.push(eq3(platformIdeas.category, category));
    }
    if (visible && visible !== "all") {
      whereConditions.push(eq3(platformIdeas.isVisible, visible));
    }
    const whereClause = whereConditions.length > 0 ? and2(...whereConditions) : void 0;
    const totalCountResult = await db.select({ count: count() }).from(platformIdeas).where(whereClause);
    let query = db.select({
      id: platformIdeas.id,
      title: platformIdeas.title,
      description: platformIdeas.description,
      category: platformIdeas.category,
      subcategory: platformIdeas.subcategory,
      difficulty: platformIdeas.difficulty,
      investment: platformIdeas.investment,
      isVisible: platformIdeas.isVisible,
      isFeatured: platformIdeas.isFeatured,
      views: platformIdeas.views,
      likes: platformIdeas.likes,
      tags: platformIdeas.tags,
      createdAt: platformIdeas.createdAt,
      updatedAt: platformIdeas.updatedAt,
      createdBy: platformIdeas.createdBy
    }).from(platformIdeas);
    if (whereClause) {
      query = query.where(whereClause);
    }
    const ideas = await query.orderBy(sortOrder === "desc" ? desc(platformIdeas.createdAt) : platformIdeas.createdAt).limit(limit).offset(offset);
    return {
      ideas,
      pagination: {
        page,
        limit,
        total: totalCountResult[0].count,
        totalPages: Math.ceil(totalCountResult[0].count / limit)
      }
    };
  }
  async getPlatformIdeaById(id) {
    const [idea] = await db.select().from(platformIdeas).where(eq3(platformIdeas.id, id));
    return idea || null;
  }
  async createPlatformIdea(ideaData) {
    const [idea] = await db.insert(platformIdeas).values([ideaData]).returning();
    return idea;
  }
  async updatePlatformIdea(id, updates) {
    const [idea] = await db.update(platformIdeas).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(platformIdeas.id, id)).returning();
    return idea || null;
  }
  async toggleIdeaVisibility(id) {
    const idea = await this.getPlatformIdeaById(id);
    if (!idea) return null;
    const newVisibility = idea.isVisible === "true" ? "false" : "true";
    return this.updatePlatformIdea(id, { isVisible: newVisibility });
  }
  async softDeletePlatformIdea(id, deletedBy, reason) {
    const idea = await this.getPlatformIdeaById(id);
    if (!idea) return false;
    const permanentDeleteAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3);
    await db.insert(deleteHistory).values({
      itemType: "platform_idea",
      itemId: id,
      itemData: idea,
      deletedBy,
      deletionReason: reason,
      permanentDeleteAt
    });
    await db.delete(platformIdeas).where(eq3(platformIdeas.id, id));
    return true;
  }
  // Bulk operations for CSV/JSON uploads
  async bulkCreatePlatformIdeas(ideas) {
    const successful = [];
    const errors = [];
    for (let i = 0; i < ideas.length; i++) {
      try {
        const created = await this.createPlatformIdea(ideas[i]);
        successful.push(created);
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    return { successful, errors };
  }
  // Upload History Management
  async createUploadHistory(uploadData) {
    const [upload2] = await db.insert(uploadHistory).values(uploadData).returning();
    return upload2;
  }
  async getUploadHistory(options) {
    const { page, limit, sortBy = "createdAt", sortOrder = "desc" } = options;
    const offset = (page - 1) * limit;
    const whereClause = eq3(uploadHistory.isDeleted, "false");
    const [totalCountResult, uploads] = await Promise.all([
      db.select({ count: count() }).from(uploadHistory).where(whereClause),
      db.select({
        id: uploadHistory.id,
        filename: uploadHistory.filename,
        fileType: uploadHistory.fileType,
        fileSize: uploadHistory.fileSize,
        ideasCount: uploadHistory.ideasCount,
        successCount: uploadHistory.successCount,
        errorCount: uploadHistory.errorCount,
        processingStatus: uploadHistory.processingStatus,
        uploadedBy: uploadHistory.uploadedBy,
        createdAt: uploadHistory.createdAt
      }).from(uploadHistory).where(whereClause).orderBy(sortOrder === "desc" ? desc(uploadHistory.createdAt) : uploadHistory.createdAt).limit(limit).offset(offset)
    ]);
    return {
      uploads,
      pagination: {
        page,
        limit,
        total: totalCountResult[0].count,
        totalPages: Math.ceil(totalCountResult[0].count / limit)
      }
    };
  }
  async updateUploadHistory(id, updates) {
    const [upload2] = await db.update(uploadHistory).set(updates).where(eq3(uploadHistory.id, id)).returning();
    return upload2 || null;
  }
  async softDeleteUploadHistory(id, deletedBy) {
    const upload2 = await db.select().from(uploadHistory).where(eq3(uploadHistory.id, id));
    if (!upload2.length) return false;
    const permanentDeleteAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3);
    await db.insert(deleteHistory).values({
      itemType: "upload_batch",
      itemId: id,
      itemData: upload2[0],
      deletedBy,
      permanentDeleteAt
    });
    await db.update(uploadHistory).set({
      isDeleted: "true",
      deletedAt: /* @__PURE__ */ new Date(),
      deletedBy
    }).where(eq3(uploadHistory.id, id));
    return true;
  }
  // Delete History Management
  async getDeleteHistory(options) {
    const { page, limit, sortBy = "deletedAt", sortOrder = "desc" } = options;
    const offset = (page - 1) * limit;
    const whereClause = eq3(deleteHistory.canRestore, "true");
    const [totalCountResult, deletedItems] = await Promise.all([
      db.select({ count: count() }).from(deleteHistory).where(whereClause),
      db.select().from(deleteHistory).where(whereClause).orderBy(sortOrder === "desc" ? desc(deleteHistory.deletedAt) : deleteHistory.deletedAt).limit(limit).offset(offset)
    ]);
    return {
      deletedItems,
      pagination: {
        page,
        limit,
        total: totalCountResult[0].count,
        totalPages: Math.ceil(totalCountResult[0].count / limit)
      }
    };
  }
  async restoreFromDeleteHistory(id, restoredBy) {
    const [deletedItem] = await db.select().from(deleteHistory).where(and2(eq3(deleteHistory.id, id), eq3(deleteHistory.canRestore, "true")));
    if (!deletedItem) return false;
    try {
      if (deletedItem.itemType === "platform_idea") {
        await db.insert(platformIdeas).values(deletedItem.itemData);
      } else if (deletedItem.itemType === "upload_batch") {
        await db.update(uploadHistory).set({ isDeleted: "false", deletedAt: null, deletedBy: null }).where(eq3(uploadHistory.id, deletedItem.itemId));
      }
      await db.update(deleteHistory).set({
        canRestore: "false",
        restoredAt: /* @__PURE__ */ new Date(),
        restoredBy
      }).where(eq3(deleteHistory.id, id));
      return true;
    } catch (error) {
      console.error("Error restoring item:", error);
      return false;
    }
  }
  // Clean up expired delete history (called by background job)
  async cleanupExpiredDeleteHistory() {
    const now = /* @__PURE__ */ new Date();
    const deletedItems = await db.delete(deleteHistory).where(and2(
      lte(deleteHistory.permanentDeleteAt, now),
      eq3(deleteHistory.canRestore, "true")
    )).returning({ id: deleteHistory.id });
    return deletedItems.length;
  }
  // Admin Activity Logs
  async getAdminActivityLogs(options) {
    const { page, limit, sortBy = "createdAt", sortOrder = "desc", adminId } = options;
    const offset = (page - 1) * limit;
    let whereClause;
    if (adminId) {
      whereClause = eq3(adminActivityLogs2.adminId, adminId);
    }
    const [totalCountResult, logs] = await Promise.all([
      db.select({ count: count() }).from(adminActivityLogs2).where(whereClause),
      db.select().from(adminActivityLogs2).where(whereClause).orderBy(sortOrder === "desc" ? desc(adminActivityLogs2.createdAt) : adminActivityLogs2.createdAt).limit(limit).offset(offset)
    ]);
    return {
      logs,
      pagination: {
        page,
        limit,
        total: totalCountResult[0].count,
        totalPages: Math.ceil(totalCountResult[0].count / limit)
      }
    };
  }
  // Get categories for filtering
  async getCategories() {
    const categories = await db.selectDistinct({ category: platformIdeas.category }).from(platformIdeas).where(eq3(platformIdeas.isVisible, "true"));
    return categories.map((c) => c.category);
  }
};
var adminStorage = new AdminStorage();

// server/admin-routes.ts
import {
  insertPlatformIdeaSchema,
  platformIdeas as platformIdeas2,
  uploadHistory as uploadHistory2
} from "@shared/schema";
import { eq as eq4, and as and3, desc as desc2, asc, or as or2, like, count as count2 } from "drizzle-orm";
var router = express.Router();
var upload = multer({
  dest: "temp_uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["text/csv", "application/json", "text/plain"];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith(".csv") || file.originalname.endsWith(".json")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV and JSON files are allowed"));
    }
  }
});
var adminLoginSchema = z3.object({
  email: z3.string().email("Valid email is required"),
  password: z3.string().min(1, "Password is required")
});
var paginationSchema = z3.object({
  page: z3.string().optional().default("1").transform((val) => parseInt(val, 10)),
  limit: z3.string().optional().default("10").transform((val) => parseInt(val, 10)),
  sortBy: z3.string().optional().default("createdAt"),
  sortOrder: z3.enum(["asc", "desc"]).optional().default("desc"),
  search: z3.string().optional(),
  category: z3.string().optional(),
  visible: z3.string().optional()
});
router.post("/login", async (req, res) => {
  try {
    const { email, password } = adminLoginSchema.parse(req.body);
    const authResult = await AdminAuthService.validateAdmin(email, password);
    if (!authResult.success) {
      await AdminAuthService.logActivity(
        "unknown",
        "login_failed",
        req,
        { email, reason: authResult.error },
        void 0,
        void 0,
        false,
        authResult.error
      );
      return res.status(401).json({ error: authResult.error });
    }
    const sessionResult = await AdminAuthService.createAdminSession(authResult.admin.id, req);
    if (!sessionResult.success) {
      return res.status(500).json({ error: sessionResult.error });
    }
    await AdminAuthService.logActivity(
      authResult.admin.id,
      "login_success",
      req,
      { email }
    );
    res.cookie("admin-token", sessionResult.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    });
    res.json({
      success: true,
      admin: {
        id: authResult.admin.id,
        email: authResult.admin.email,
        name: authResult.admin.name
      }
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(400).json({ error: "Invalid request data" });
  }
});
router.get("/me", requireAdminAuth, async (req, res) => {
  try {
    const admin = req.admin;
    res.json({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      isActive: admin.isActive,
      lastLogin: admin.lastLogin
    });
  } catch (error) {
    console.error("Get admin me error:", error);
    res.status(500).json({ error: "Failed to get admin info" });
  }
});
router.post("/upload-ideas", requireAdminAuth, upload.single("file"), async (req, res) => {
  try {
    const admin = req.admin;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const allowedTypes = ["text/csv", "application/json", "text/plain"];
    if (!allowedTypes.includes(file.mimetype) && !file.originalname.match(/\.(csv|json)$/i)) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: "Only CSV and JSON files are allowed" });
    }
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [uploadRecord] = await db.insert(uploadHistory2).values({
      filename: file.originalname,
      fileType: file.mimetype.includes("csv") ? "csv" : "json",
      fileSize: file.size.toString(),
      ideasCount: "0",
      // Will be updated after processing
      uploadedBy: admin.id,
      processingStatus: "processing"
    }).returning();
    let ideas = [];
    const errors = [];
    try {
      if (file.mimetype.includes("csv") || file.originalname.toLowerCase().endsWith(".csv")) {
        const csvData = fs.readFileSync(file.path, "utf8");
        const parseResult = Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim().toLowerCase().replace(/[^a-z0-9]/g, "_")
        });
        ideas = parseResult.data;
        if (parseResult.errors.length > 0) {
          parseResult.errors.forEach((error, index) => {
            errors.push({ row: index + 1, error: error.message });
          });
        }
      } else {
        const jsonData = fs.readFileSync(file.path, "utf8");
        const parsedData = JSON.parse(jsonData);
        ideas = Array.isArray(parsedData) ? parsedData : [parsedData];
      }
      let successCount = 0;
      const validatedIdeas = [];
      for (let i = 0; i < ideas.length; i++) {
        try {
          const idea = ideas[i];
          const mappedIdea = {
            title: idea.title || idea.idea_title || idea.name,
            description: idea.description || idea.desc || idea.summary,
            fullDescription: idea.full_description || idea.detailed_description || idea.description,
            category: idea.category || idea.cat || idea.type,
            subcategory: idea.subcategory || idea.sub_category || idea.subtype,
            difficulty: idea.difficulty || idea.level,
            investment: idea.investment || idea.investment_level,
            timeframe: idea.timeframe || idea.timeline,
            marketSize: idea.market_size || idea.market,
            competitors: Array.isArray(idea.competitors) ? idea.competitors : idea.competitors ? [{ name: idea.competitors, description: "" }] : [],
            targetAudience: idea.target_audience || idea.audience,
            revenueModel: idea.revenue_model || idea.business_model,
            investmentRequired: idea.investment_required || idea.funding_needed,
            expectedRoi: idea.expected_roi || idea.roi,
            marketTrends: idea.market_trends || idea.trends,
            risks: Array.isArray(idea.risks) ? idea.risks : idea.risks ? [idea.risks] : [],
            opportunities: Array.isArray(idea.opportunities) ? idea.opportunities : idea.opportunities ? [idea.opportunities] : [],
            keyFeatures: Array.isArray(idea.key_features) ? idea.key_features : idea.key_features ? [idea.key_features] : [],
            implementationSteps: Array.isArray(idea.implementation_steps) ? idea.implementation_steps : [],
            tags: Array.isArray(idea.tags) ? idea.tags : idea.tags ? [idea.tags] : [],
            images: Array.isArray(idea.images) ? idea.images : [],
            uploadBatchId: batchId,
            createdBy: admin.id
          };
          const validatedIdea = insertPlatformIdeaSchema.parse(mappedIdea);
          validatedIdeas.push(validatedIdea);
          successCount++;
        } catch (error) {
          errors.push({
            row: i + 1,
            error: error instanceof Error ? error.message : "Validation failed"
          });
        }
      }
      if (validatedIdeas.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < validatedIdeas.length; i += batchSize) {
          const batch = validatedIdeas.slice(i, i + batchSize);
          await db.insert(platformIdeas2).values(batch);
        }
      }
      await db.update(uploadHistory2).set({
        ideasCount: ideas.length.toString(),
        successCount: successCount.toString(),
        errorCount: errors.length.toString(),
        processingStatus: "completed",
        errors
      }).where(eq4(uploadHistory2.id, uploadRecord.id));
      await AdminAuthService.logActivity(
        admin.id,
        "bulk_upload_ideas",
        req,
        {
          filename: file.originalname,
          totalIdeas: ideas.length,
          successCount,
          errorCount: errors.length,
          batchId
        }
      );
      res.json({
        success: true,
        message: `Upload completed. ${successCount} ideas uploaded successfully.`,
        results: {
          total: ideas.length,
          success: successCount,
          errors: errors.length,
          batchId,
          uploadId: uploadRecord.id
        },
        errors: errors.length > 0 ? errors : void 0
      });
    } catch (processingError) {
      await db.update(uploadHistory2).set({
        processingStatus: "failed",
        errorCount: "1",
        errors: [{ row: 0, error: processingError instanceof Error ? processingError.message : "Processing failed" }]
      }).where(eq4(uploadHistory2.id, uploadRecord.id));
      throw processingError;
    } finally {
      fs.unlinkSync(file.path);
    }
  } catch (error) {
    console.error("Upload ideas error:", error);
    res.status(500).json({
      error: "Failed to upload ideas",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
router.get("/upload-history", requireAdminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = paginationSchema.parse(req.query);
    const offset = (page - 1) * limit;
    const [uploadRecords, totalCount] = await Promise.all([
      db.select({
        id: uploadHistory2.id,
        filename: uploadHistory2.filename,
        fileType: uploadHistory2.fileType,
        fileSize: uploadHistory2.fileSize,
        ideasCount: uploadHistory2.ideasCount,
        successCount: uploadHistory2.successCount,
        errorCount: uploadHistory2.errorCount,
        processingStatus: uploadHistory2.processingStatus,
        errors: uploadHistory2.errors,
        createdAt: uploadHistory2.createdAt,
        uploadedBy: uploadHistory2.uploadedBy
      }).from(uploadHistory2).where(eq4(uploadHistory2.isDeleted, "false")).orderBy(desc2(uploadHistory2.createdAt)).limit(limit).offset(offset),
      db.select({ count: count2() }).from(uploadHistory2).where(eq4(uploadHistory2.isDeleted, "false"))
    ]);
    res.json({
      uploads: uploadRecords,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limit)
      }
    });
  } catch (error) {
    console.error("Get upload history error:", error);
    res.status(500).json({ error: "Failed to get upload history" });
  }
});
router.get("/ideas", requireAdminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
      category,
      visible
    } = paginationSchema.parse(req.query);
    const offset = (page - 1) * limit;
    const whereConditions = [];
    if (search) {
      whereConditions.push(
        or2(
          like(platformIdeas2.title, `%${search}%`),
          like(platformIdeas2.description, `%${search}%`)
        )
      );
    }
    if (category) {
      whereConditions.push(eq4(platformIdeas2.category, category));
    }
    if (visible) {
      whereConditions.push(eq4(platformIdeas2.isVisible, visible));
    }
    const whereClause = whereConditions.length > 0 ? and3(...whereConditions) : void 0;
    const sortColumn = platformIdeas2[sortBy] || platformIdeas2.createdAt;
    const orderBy = sortOrder === "asc" ? asc(sortColumn) : desc2(sortColumn);
    const [ideas, totalCount] = await Promise.all([
      db.select().from(platformIdeas2).where(whereClause).orderBy(orderBy).limit(limit).offset(offset),
      db.select({ count: count2() }).from(platformIdeas2).where(whereClause)
    ]);
    res.json({
      ideas,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limit)
      }
    });
  } catch (error) {
    console.error("Get ideas error:", error);
    res.status(500).json({ error: "Failed to get ideas" });
  }
});
router.post("/logout", requireAdminAuth, async (req, res) => {
  try {
    const admin = req.admin;
    const session3 = req.adminSession;
    await AdminAuthService.revokeAdminSession(session3.id);
    res.clearCookie("admin-token");
    await AdminAuthService.logActivity(
      admin.id,
      "logout",
      req,
      {}
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Admin logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});
router.get("/me", requireAdminAuth, async (req, res) => {
  const admin = req.admin;
  res.json({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    lastLogin: admin.lastLogin
  });
});
router.get("/dashboard/stats", requireAdminAuth, async (req, res) => {
  try {
    const stats = await adminStorage.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});
router.get("/ideas", requireAdminAuth, async (req, res) => {
  try {
    const options = paginationSchema.parse(req.query);
    const result = await adminStorage.getPlatformIdeas(options);
    res.json(result);
  } catch (error) {
    console.error("Get ideas error:", error);
    res.status(500).json({ error: "Failed to fetch ideas" });
  }
});
router.get("/ideas/:id", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const idea = await adminStorage.getPlatformIdeaById(id);
    if (!idea) {
      return res.status(404).json({ error: "Idea not found" });
    }
    res.json(idea);
  } catch (error) {
    console.error("Get idea error:", error);
    res.status(500).json({ error: "Failed to fetch idea" });
  }
});
router.post("/ideas", requireAdminAuth, async (req, res) => {
  try {
    const admin = req.admin;
    const ideaData = insertPlatformIdeaSchema.parse(req.body);
    const idea = await adminStorage.createPlatformIdea({
      ...ideaData,
      createdBy: admin.id
    });
    await AdminAuthService.logActivity(
      admin.id,
      "create_idea",
      req,
      { ideaId: idea.id, title: idea.title },
      "platform_idea",
      idea.id
    );
    res.status(201).json(idea);
  } catch (error) {
    console.error("Create idea error:", error);
    res.status(400).json({ error: "Failed to create idea" });
  }
});
router.put("/ideas/:id", requireAdminAuth, async (req, res) => {
  try {
    const admin = req.admin;
    const { id } = req.params;
    const updates = req.body;
    const idea = await adminStorage.updatePlatformIdea(id, updates);
    if (!idea) {
      return res.status(404).json({ error: "Idea not found" });
    }
    await AdminAuthService.logActivity(
      admin.id,
      "update_idea",
      req,
      { ideaId: id, updates },
      "platform_idea",
      id
    );
    res.json(idea);
  } catch (error) {
    console.error("Update idea error:", error);
    res.status(400).json({ error: "Failed to update idea" });
  }
});
router.patch("/ideas/:id/toggle-visibility", requireAdminAuth, async (req, res) => {
  try {
    const admin = req.admin;
    const { id } = req.params;
    const idea = await adminStorage.toggleIdeaVisibility(id);
    if (!idea) {
      return res.status(404).json({ error: "Idea not found" });
    }
    await AdminAuthService.logActivity(
      admin.id,
      "toggle_idea_visibility",
      req,
      { ideaId: id, newVisibility: idea.isVisible },
      "platform_idea",
      id
    );
    res.json(idea);
  } catch (error) {
    console.error("Toggle visibility error:", error);
    res.status(500).json({ error: "Failed to toggle visibility" });
  }
});
router.delete("/ideas/:id", requireAdminAuth, async (req, res) => {
  try {
    const admin = req.admin;
    const { id } = req.params;
    const { reason } = req.body;
    const success = await adminStorage.softDeletePlatformIdea(id, admin.id, reason);
    if (!success) {
      return res.status(404).json({ error: "Idea not found" });
    }
    await AdminAuthService.logActivity(
      admin.id,
      "delete_idea",
      req,
      { ideaId: id, reason },
      "platform_idea",
      id
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Delete idea error:", error);
    res.status(500).json({ error: "Failed to delete idea" });
  }
});
router.post("/upload-ideas", requireAdminAuth, requireSuperAdmin, upload.single("file"), async (req, res) => {
  try {
    const admin = req.admin;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileType = file.originalname.endsWith(".csv") ? "csv" : "json";
    let ideas = [];
    if (fileType === "csv") {
      const csvData = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(file.path).pipe(csv()).on("data", (data) => csvData.push(data)).on("end", resolve).on("error", reject);
      });
      ideas = csvData.map((row) => ({
        title: row.title || row.Title,
        description: row.description || row.Description,
        fullDescription: row.fullDescription || row.FullDescription || row.full_description,
        category: row.category || row.Category,
        subcategory: row.subcategory || row.Subcategory,
        difficulty: row.difficulty || row.Difficulty,
        investment: row.investment || row.Investment,
        timeframe: row.timeframe || row.Timeframe,
        marketSize: row.marketSize || row.MarketSize || row.market_size,
        targetAudience: row.targetAudience || row.TargetAudience || row.target_audience,
        revenueModel: row.revenueModel || row.RevenueModel || row.revenue_model,
        investmentRequired: row.investmentRequired || row.InvestmentRequired || row.investment_required,
        expectedRoi: row.expectedRoi || row.ExpectedRoi || row.expected_roi,
        marketTrends: row.marketTrends || row.MarketTrends || row.market_trends,
        tags: row.tags ? typeof row.tags === "string" ? row.tags.split(",").map((t) => t.trim()) : row.tags : [],
        risks: row.risks ? typeof row.risks === "string" ? row.risks.split(",").map((r) => r.trim()) : row.risks : [],
        opportunities: row.opportunities ? typeof row.opportunities === "string" ? row.opportunities.split(",").map((o) => o.trim()) : row.opportunities : [],
        keyFeatures: row.keyFeatures ? typeof row.keyFeatures === "string" ? row.keyFeatures.split(",").map((f) => f.trim()) : row.keyFeatures : []
      }));
    } else {
      const fileContent = fs.readFileSync(file.path, "utf8");
      const jsonData = JSON.parse(fileContent);
      ideas = Array.isArray(jsonData) ? jsonData : [jsonData];
    }
    const uploadRecord = await adminStorage.createUploadHistory({
      filename: file.originalname,
      fileType,
      fileSize: file.size.toString(),
      ideasCount: ideas.length.toString(),
      uploadedBy: admin.id,
      processingStatus: "processing"
    });
    const result = await adminStorage.bulkCreatePlatformIdeas(
      ideas.map((idea) => ({ ...idea, createdBy: admin.id, uploadBatchId: uploadRecord.id }))
    );
    await adminStorage.updateUploadHistory(uploadRecord.id, {
      successCount: result.successful.length.toString(),
      errorCount: result.errors.length.toString(),
      processingStatus: "completed",
      errors: result.errors
    });
    fs.unlinkSync(file.path);
    await AdminAuthService.logActivity(
      admin.id,
      "bulk_upload_ideas",
      req,
      {
        filename: file.originalname,
        totalIdeas: ideas.length,
        successful: result.successful.length,
        errors: result.errors.length
      },
      "upload_batch",
      uploadRecord.id
    );
    res.json({
      success: true,
      uploadId: uploadRecord.id,
      totalIdeas: ideas.length,
      successful: result.successful.length,
      errors: result.errors.length,
      errorDetails: result.errors
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error("Error cleaning up temp file:", e);
      }
    }
    res.status(500).json({ error: "Upload failed" });
  }
});
router.get("/upload-history", requireAdminAuth, async (req, res) => {
  try {
    const options = paginationSchema.parse(req.query);
    const result = await adminStorage.getUploadHistory(options);
    res.json(result);
  } catch (error) {
    console.error("Get upload history error:", error);
    res.status(500).json({ error: "Failed to fetch upload history" });
  }
});
router.delete("/upload-history/:id", requireAdminAuth, async (req, res) => {
  try {
    const admin = req.admin;
    const { id } = req.params;
    const success = await adminStorage.softDeleteUploadHistory(id, admin.id);
    if (!success) {
      return res.status(404).json({ error: "Upload not found" });
    }
    await AdminAuthService.logActivity(
      admin.id,
      "delete_upload",
      req,
      { uploadId: id },
      "upload_batch",
      id
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Delete upload error:", error);
    res.status(500).json({ error: "Failed to delete upload" });
  }
});
router.get("/delete-history", requireAdminAuth, async (req, res) => {
  try {
    const options = paginationSchema.parse(req.query);
    const result = await adminStorage.getDeleteHistory(options);
    res.json(result);
  } catch (error) {
    console.error("Get delete history error:", error);
    res.status(500).json({ error: "Failed to fetch delete history" });
  }
});
router.post("/delete-history/:id/restore", requireAdminAuth, async (req, res) => {
  try {
    const admin = req.admin;
    const { id } = req.params;
    const success = await adminStorage.restoreFromDeleteHistory(id, admin.id);
    if (!success) {
      return res.status(404).json({ error: "Item not found or cannot be restored" });
    }
    await AdminAuthService.logActivity(
      admin.id,
      "restore_item",
      req,
      { deleteHistoryId: id },
      "delete_history",
      id
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Restore item error:", error);
    res.status(500).json({ error: "Failed to restore item" });
  }
});
router.get("/categories", requireAdminAuth, async (req, res) => {
  try {
    const categories = await adminStorage.getCategories();
    res.json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});
router.get("/activity-logs", requireAdminAuth, async (req, res) => {
  try {
    const options = paginationSchema.parse(req.query);
    const result = await adminStorage.getAdminActivityLogs(options);
    res.json(result);
  } catch (error) {
    console.error("Get activity logs error:", error);
    res.status(500).json({ error: "Failed to fetch activity logs" });
  }
});
var admin_routes_default = router;

// server/routes.ts
var cache = /* @__PURE__ */ new Map();
function getFromCache(key) {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > cached.ttl) {
    cache.delete(key);
    return null;
  }
  return cached.data;
}
function setCache(key, data, ttlMs = 3e5) {
  cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
}
var rateLimitMap = /* @__PURE__ */ new Map();
var RATE_LIMIT_WINDOW = 6e4;
var RATE_LIMIT_MAX = 60;
function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }
  entry.count++;
  return false;
}
async function registerRoutes(app2) {
  await AdminAuthService.initializeAdminUsers();
  setupAuth(app2);
  setupCampaignRoutes(app2);
  registerAiRoutes(app2);
  app2.use("/api/admin", admin_routes_default);
  app2.use("/api", (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress || "unknown";
    if (isRateLimited(clientIp)) {
      return res.status(429).json({
        success: false,
        message: "Too many requests, please try again later"
      });
    }
    next();
  });
  app2.post("/api/submit-idea", async (req, res) => {
    const startTime = Date.now();
    try {
      const validatedData = insertSubmittedIdeaSchema.parse(req.body);
      const { tags = [], ...ideaData } = req.body;
      const submittedIdea = await storage.createSubmittedIdea({
        ...validatedData,
        tags: Array.isArray(tags) ? tags : []
      });
      cache.delete("submitted-ideas");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.status(201).json({
        success: true,
        message: "Idea submitted successfully",
        idea: submittedIdea,
        _meta: {
          processTime: Date.now() - startTime
        }
      });
    } catch (error) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationError.details,
          _meta: {
            processTime: Date.now() - startTime
          }
        });
      } else {
        console.error("Error submitting idea:", error);
        res.status(500).json({
          success: false,
          message: "Internal server error",
          _meta: {
            processTime: Date.now() - startTime
          }
        });
      }
    }
  });
  app2.get("/api/submitted-ideas", async (req, res) => {
    const startTime = Date.now();
    const cacheKey = "submitted-ideas";
    try {
      const cachedIdeas = getFromCache(cacheKey);
      if (cachedIdeas) {
        res.setHeader("X-Cache", "HIT");
        return res.json({
          success: true,
          ideas: cachedIdeas,
          _meta: {
            processTime: Date.now() - startTime,
            cached: true
          }
        });
      }
      const ideas = await storage.getSubmittedIdeas();
      setCache(cacheKey, ideas, 3e5);
      res.setHeader("X-Cache", "MISS");
      res.setHeader("Cache-Control", "public, max-age=300");
      res.json({
        success: true,
        ideas,
        _meta: {
          processTime: Date.now() - startTime,
          cached: false
        }
      });
    } catch (error) {
      console.error("Error fetching ideas:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        _meta: {
          processTime: Date.now() - startTime
        }
      });
    }
  });
  app2.get("/api/submitted-ideas/:id", async (req, res) => {
    try {
      const idea = await storage.getSubmittedIdeaById(req.params.id);
      if (!idea) {
        res.status(404).json({
          success: false,
          message: "Idea not found"
        });
        return;
      }
      res.json({
        success: true,
        idea
      });
    } catch (error) {
      console.error("Error fetching idea:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });
  app2.patch("/api/submitted-ideas/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || !["pending", "reviewing", "approved", "rejected"].includes(status)) {
        res.status(400).json({
          success: false,
          message: "Invalid status. Must be one of: pending, reviewing, approved, rejected"
        });
        return;
      }
      const updatedIdea = await storage.updateSubmittedIdeaStatus(req.params.id, status);
      if (!updatedIdea) {
        res.status(404).json({
          success: false,
          message: "Idea not found"
        });
        return;
      }
      res.json({
        success: true,
        message: "Status updated successfully",
        idea: updatedIdea
      });
    } catch (error) {
      console.error("Error updating idea status:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs2 from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import compression from "compression";
import cookieParser from "cookie-parser";
var app = express3();
app.set("trust proxy", 1);
app.use(compression({
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  },
  level: 6
  // Good balance between compression and CPU usage
}));
app.use(express3.json({ limit: "10mb" }));
app.use(express3.urlencoded({ extended: false, limit: "10mb" }));
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
