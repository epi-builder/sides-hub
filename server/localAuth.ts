import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import type { ServerConfig } from "./config";

// Mock user for local development
const MOCK_USER = {
  id: "local-dev-user",
  email: "dev@localhost",
  firstName: "Local",
  lastName: "Developer", 
  profileImageUrl: null,
};

export function getSession(config: ServerConfig) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: config.database.url,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: config.auth.sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Always false for local development
      maxAge: sessionTtl,
    },
  });
}

async function createMockUser() {
  await storage.upsertUser({
    id: MOCK_USER.id,
    email: MOCK_USER.email,
    firstName: MOCK_USER.firstName,
    lastName: MOCK_USER.lastName,
    profileImageUrl: MOCK_USER.profileImageUrl,
  });
}

export async function setupLocalAuth(app: Express, serverConfig: ServerConfig) {
  app.set("trust proxy", 1);
  app.use(getSession(serverConfig));
  app.use(passport.initialize());
  app.use(passport.session());

  // Create mock user in database
  await createMockUser();

  // Passport serialization (simplified for local dev)
  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));

  // Local development login endpoint
  app.get("/api/login", (req, res) => {
    // Auto-login with mock user
    const mockSession = {
      claims: {
        sub: MOCK_USER.id,
        email: MOCK_USER.email,
        first_name: MOCK_USER.firstName,
        last_name: MOCK_USER.lastName,
        profile_image_url: MOCK_USER.profileImageUrl,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      },
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
    };

    req.login(mockSession, (err) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Login failed" });
      }
      res.redirect("/");
    });
  });

  // Callback endpoint (for compatibility)
  app.get("/api/callback", (req, res) => {
    res.redirect("/");
  });

  // Logout endpoint
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isLocalAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // For local development, we don't need to validate tokens
  // The session is sufficient
  next();
};