import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupLocalAuth, isLocalAuthenticated } from "./localAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { insertProjectSchema, insertCommunityPostSchema, insertCommentSchema } from "@shared/schema";
import { z } from "zod";
import type { ServerConfig } from "./config";

export async function registerRoutes(app: Express, config: ServerConfig): Promise<Server> {
  // Auth middleware - use local auth for local development, Replit auth otherwise
  const isLocal = config.appEnv === 'local';
  const authMiddleware: RequestHandler = isLocal ? isLocalAuthenticated : isAuthenticated;
  
  if (isLocal) {
    await setupLocalAuth(app, config);
  } else {
    await setupAuth(app, config);
  }

  // Auth routes
  app.get('/api/auth/user', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Project routes
  app.get('/api/projects', async (req, res) => {
    try {
      const { search, tags, techStack, sortBy, page, limit } = req.query;
      const filters = {
        search: search as string,
        tags: tags ? (tags as string).split(',') : undefined,
        techStack: techStack ? (techStack as string).split(',') : undefined,
        sortBy: sortBy as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 6,
      };
      const result = await storage.getProjects(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Track view (with user ID if authenticated, otherwise IP address)
      const userId = req.user?.claims?.sub;
      const ipAddress = req.ip || req.connection.remoteAddress;
      await storage.trackProjectView(req.params.id, userId, ipAddress);
      
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post('/api/projects', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let projectData = { ...req.body, userId };
      
      // Handle thumbnail URL ACL if it's a cloud storage URL
      if (projectData.thumbnail && projectData.thumbnail.startsWith("https://storage.googleapis.com/")) {
        try {
          const objectStorageService = new ObjectStorageService();
          const normalizedThumbnailPath = await objectStorageService.trySetObjectEntityAclPolicy(
            projectData.thumbnail,
            {
              owner: userId,
              visibility: "public",
            }
          );
          projectData.thumbnail = normalizedThumbnailPath;
          console.log(`Thumbnail ACL set for project. Original: ${req.body.thumbnail}, Normalized: ${normalizedThumbnailPath}`);
        } catch (error) {
          console.error("Error setting thumbnail ACL during project creation:", error);
          // Continue with original thumbnail URL if ACL setting fails
        }
      }
      
      const parsedProjectData = insertProjectSchema.parse(projectData);
      const project = await storage.createProject(parsedProjectData);
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put('/api/projects/:id', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await storage.getProject(req.params.id);
      
      if (!project || project.userId !== userId) {
        return res.status(404).json({ message: "Project not found" });
      }

      const projectData = insertProjectSchema.partial().parse(req.body);
      const updatedProject = await storage.updateProject(req.params.id, projectData);
      res.json(updatedProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete('/api/projects/:id', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const success = await storage.deleteProject(req.params.id, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Project interaction routes
  app.post('/api/projects/:id/like', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const success = await storage.likeProject(req.params.id, userId);
      res.json({ success });
    } catch (error) {
      console.error("Error liking project:", error);
      res.status(500).json({ message: "Failed to like project" });
    }
  });

  app.delete('/api/projects/:id/like', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const success = await storage.unlikeProject(req.params.id, userId);
      res.json({ success });
    } catch (error) {
      console.error("Error unliking project:", error);
      res.status(500).json({ message: "Failed to unlike project" });
    }
  });

  app.get('/api/projects/:id/like-status', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const isLiked = await storage.isProjectLiked(req.params.id, userId);
      const isBookmarked = await storage.isProjectBookmarked(req.params.id, userId);
      res.json({ isLiked, isBookmarked });
    } catch (error) {
      console.error("Error checking like status:", error);
      res.status(500).json({ message: "Failed to check like status" });
    }
  });

  app.post('/api/projects/:id/bookmark', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const success = await storage.bookmarkProject(req.params.id, userId);
      res.json({ success });
    } catch (error) {
      console.error("Error bookmarking project:", error);
      res.status(500).json({ message: "Failed to bookmark project" });
    }
  });

  app.delete('/api/projects/:id/bookmark', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const success = await storage.unbookmarkProject(req.params.id, userId);
      res.json({ success });
    } catch (error) {
      console.error("Error unbookmarking project:", error);
      res.status(500).json({ message: "Failed to unbookmark project" });
    }
  });

  // User routes
  app.get('/api/users/:id/projects', async (req, res) => {
    try {
      const projects = await storage.getUserProjects(req.params.id);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching user projects:", error);
      res.status(500).json({ message: "Failed to fetch user projects" });
    }
  });

  app.get('/api/users/me/bookmarks', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookmarks = await storage.getUserBookmarks(userId);
      res.json(bookmarks);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  // Community routes
  app.get('/api/community/posts', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const posts = await storage.getCommunityPosts(page, limit);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching community posts:", error);
      res.status(500).json({ message: "Failed to fetch community posts" });
    }
  });

  app.get('/api/community/posts/:id', async (req, res) => {
    try {
      const post = await storage.getCommunityPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching community post:", error);
      res.status(500).json({ message: "Failed to fetch community post" });
    }
  });

  app.post('/api/community/posts', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postData = insertCommunityPostSchema.parse({ ...req.body, userId });
      const post = await storage.createCommunityPost(postData);
      res.json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      console.error("Error creating community post:", error);
      res.status(500).json({ message: "Failed to create community post" });
    }
  });

  app.post('/api/community/posts/:id/like', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const success = await storage.likeCommunityPost(req.params.id, userId);
      res.json({ success });
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  app.delete('/api/community/posts/:id/like', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const success = await storage.unlikeCommunityPost(req.params.id, userId);
      res.json({ success });
    } catch (error) {
      console.error("Error unliking post:", error);
      res.status(500).json({ message: "Failed to unlike post" });
    }
  });

  app.get('/api/community/posts/:id/like-status', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const isLiked = await storage.isCommunityPostLiked(req.params.id, userId);
      res.json({ isLiked });
    } catch (error) {
      console.error("Error checking post like status:", error);
      res.status(500).json({ message: "Failed to check post like status" });
    }
  });

  // Comment routes
  app.get('/api/projects/:id/comments', async (req, res) => {
    try {
      const comments = await storage.getProjectComments(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching project comments:", error);
      res.status(500).json({ message: "Failed to fetch project comments" });
    }
  });

  app.get('/api/community/posts/:id/comments', async (req, res) => {
    try {
      const comments = await storage.getPostComments(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching post comments:", error);
      res.status(500).json({ message: "Failed to fetch post comments" });
    }
  });

  app.post('/api/comments', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const commentData = insertCommentSchema.parse({ ...req.body, userId });
      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.delete('/api/comments/:id', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const success = await storage.deleteComment(req.params.id, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Analytics routes
  app.get('/api/analytics', async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Object storage routes
  app.get("/objects/:objectPath(*)", authMiddleware, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", authMiddleware, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Object storage not available:", error);
      res.status(503).json({ 
        message: "File upload is currently unavailable. Please use URL input instead.",
        error: "Object storage not configured"
      });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}
