import {
  users,
  projects,
  communityPosts,
  comments,
  projectLikes,
  projectBookmarks,
  postLikes,
  type User,
  type UpsertUser,
  type Project,
  type ProjectWithUser,
  type InsertProject,
  type CommunityPost,
  type CommunityPostWithUser,
  type InsertCommunityPost,
  type Comment,
  type CommentWithUser,
  type InsertComment,
  type ProjectLike,
  type ProjectBookmark,
  type PostLike,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, ilike, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Project operations
  getProjects(filters?: { search?: string; tags?: string[]; techStack?: string[]; sortBy?: string }): Promise<ProjectWithUser[]>;
  getProject(id: string): Promise<ProjectWithUser | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string, userId: string): Promise<boolean>;
  incrementProjectViews(id: string): Promise<void>;
  getUserProjects(userId: string): Promise<ProjectWithUser[]>;
  
  // Project interaction operations
  likeProject(projectId: string, userId: string): Promise<boolean>;
  unlikeProject(projectId: string, userId: string): Promise<boolean>;
  isProjectLiked(projectId: string, userId: string): Promise<boolean>;
  bookmarkProject(projectId: string, userId: string): Promise<boolean>;
  unbookmarkProject(projectId: string, userId: string): Promise<boolean>;
  isProjectBookmarked(projectId: string, userId: string): Promise<boolean>;
  getUserBookmarks(userId: string): Promise<ProjectWithUser[]>;
  
  // Community operations
  getCommunityPosts(page?: number, limit?: number): Promise<CommunityPostWithUser[]>;
  getCommunityPost(id: string): Promise<CommunityPostWithUser | undefined>;
  createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost>;
  updateCommunityPost(id: string, post: Partial<InsertCommunityPost>, userId: string): Promise<CommunityPost | undefined>;
  deleteCommunityPost(id: string, userId: string): Promise<boolean>;
  likeCommunityPost(postId: string, userId: string): Promise<boolean>;
  unlikeCommunityPost(postId: string, userId: string): Promise<boolean>;
  isCommunityPostLiked(postId: string, userId: string): Promise<boolean>;
  
  // Comment operations
  getProjectComments(projectId: string): Promise<CommentWithUser[]>;
  getPostComments(postId: string): Promise<CommentWithUser[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: string, userId: string): Promise<boolean>;
  
  // Analytics operations
  getAnalytics(): Promise<{
    totalProjects: number;
    totalUsers: number;
    totalLikes: number;
    totalComments: number;
    topTechStacks: Array<{ name: string; count: number }>;
    topTags: Array<{ name: string; count: number }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getProjects(filters?: { search?: string; tags?: string[]; techStack?: string[]; sortBy?: string }): Promise<ProjectWithUser[]> {
    let query = db
      .select({
        id: projects.id,
        title: projects.title,
        shortDescription: projects.shortDescription,
        detailedDescription: projects.detailedDescription,
        thumbnailUrl: projects.thumbnailUrl,
        demoUrl: projects.demoUrl,
        sourceUrl: projects.sourceUrl,
        tags: projects.tags,
        techStack: projects.techStack,
        viewCount: projects.viewCount,
        likeCount: projects.likeCount,
        commentCount: projects.commentCount,
        userId: projects.userId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        user: users,
      })
      .from(projects)
      .leftJoin(users, eq(projects.userId, users.id));

    let conditions = [];

    if (filters?.search) {
      conditions.push(
        or(
          ilike(projects.title, `%${filters.search}%`),
          ilike(projects.shortDescription, `%${filters.search}%`)
        )
      );
    }

    if (filters?.tags && filters.tags.length > 0) {
      conditions.push(
        or(...filters.tags.map(tag => 
          sql`${projects.tags} @> ARRAY[${tag}]::text[]`
        ))
      );
    }

    if (filters?.techStack && filters.techStack.length > 0) {
      conditions.push(
        or(...filters.techStack.map(tech => 
          sql`${projects.techStack} @> ARRAY[${tech}]::text[]`
        ))
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    switch (filters?.sortBy) {
      case 'likes':
        query = query.orderBy(desc(projects.likeCount));
        break;
      case 'views':
        query = query.orderBy(desc(projects.viewCount));
        break;
      case 'oldest':
        query = query.orderBy(asc(projects.createdAt));
        break;
      default:
        query = query.orderBy(desc(projects.createdAt));
    }

    return query.execute();
  }

  async getProject(id: string): Promise<ProjectWithUser | undefined> {
    const [project] = await db
      .select({
        id: projects.id,
        title: projects.title,
        shortDescription: projects.shortDescription,
        detailedDescription: projects.detailedDescription,
        thumbnailUrl: projects.thumbnailUrl,
        demoUrl: projects.demoUrl,
        sourceUrl: projects.sourceUrl,
        tags: projects.tags,
        techStack: projects.techStack,
        viewCount: projects.viewCount,
        likeCount: projects.likeCount,
        commentCount: projects.commentCount,
        userId: projects.userId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        user: users,
      })
      .from(projects)
      .leftJoin(users, eq(projects.userId, users.id))
      .where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values(project)
      .returning();
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));
    return result.rowCount > 0;
  }

  async incrementProjectViews(id: string): Promise<void> {
    await db
      .update(projects)
      .set({ viewCount: sql`${projects.viewCount} + 1` })
      .where(eq(projects.id, id));
  }

  async getUserProjects(userId: string): Promise<ProjectWithUser[]> {
    return db
      .select({
        id: projects.id,
        title: projects.title,
        shortDescription: projects.shortDescription,
        detailedDescription: projects.detailedDescription,
        thumbnailUrl: projects.thumbnailUrl,
        demoUrl: projects.demoUrl,
        sourceUrl: projects.sourceUrl,
        tags: projects.tags,
        techStack: projects.techStack,
        viewCount: projects.viewCount,
        likeCount: projects.likeCount,
        commentCount: projects.commentCount,
        userId: projects.userId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        user: users,
      })
      .from(projects)
      .leftJoin(users, eq(projects.userId, users.id))
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));
  }

  async likeProject(projectId: string, userId: string): Promise<boolean> {
    try {
      await db.insert(projectLikes).values({ projectId, userId });
      await db
        .update(projects)
        .set({ likeCount: sql`${projects.likeCount} + 1` })
        .where(eq(projects.id, projectId));
      return true;
    } catch {
      return false;
    }
  }

  async unlikeProject(projectId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(projectLikes)
      .where(and(eq(projectLikes.projectId, projectId), eq(projectLikes.userId, userId)));
    
    if (result.rowCount > 0) {
      await db
        .update(projects)
        .set({ likeCount: sql`${projects.likeCount} - 1` })
        .where(eq(projects.id, projectId));
      return true;
    }
    return false;
  }

  async isProjectLiked(projectId: string, userId: string): Promise<boolean> {
    const [like] = await db
      .select()
      .from(projectLikes)
      .where(and(eq(projectLikes.projectId, projectId), eq(projectLikes.userId, userId)));
    return !!like;
  }

  async bookmarkProject(projectId: string, userId: string): Promise<boolean> {
    try {
      await db.insert(projectBookmarks).values({ projectId, userId });
      return true;
    } catch {
      return false;
    }
  }

  async unbookmarkProject(projectId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(projectBookmarks)
      .where(and(eq(projectBookmarks.projectId, projectId), eq(projectBookmarks.userId, userId)));
    return result.rowCount > 0;
  }

  async isProjectBookmarked(projectId: string, userId: string): Promise<boolean> {
    const [bookmark] = await db
      .select()
      .from(projectBookmarks)
      .where(and(eq(projectBookmarks.projectId, projectId), eq(projectBookmarks.userId, userId)));
    return !!bookmark;
  }

  async getUserBookmarks(userId: string): Promise<ProjectWithUser[]> {
    return db
      .select({
        id: projects.id,
        title: projects.title,
        shortDescription: projects.shortDescription,
        detailedDescription: projects.detailedDescription,
        thumbnailUrl: projects.thumbnailUrl,
        demoUrl: projects.demoUrl,
        sourceUrl: projects.sourceUrl,
        tags: projects.tags,
        techStack: projects.techStack,
        viewCount: projects.viewCount,
        likeCount: projects.likeCount,
        commentCount: projects.commentCount,
        userId: projects.userId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        user: users,
      })
      .from(projectBookmarks)
      .leftJoin(projects, eq(projectBookmarks.projectId, projects.id))
      .leftJoin(users, eq(projects.userId, users.id))
      .where(eq(projectBookmarks.userId, userId))
      .orderBy(desc(projectBookmarks.createdAt));
  }

  async getCommunityPosts(page = 1, limit = 10): Promise<CommunityPostWithUser[]> {
    const offset = (page - 1) * limit;
    return db
      .select({
        id: communityPosts.id,
        title: communityPosts.title,
        content: communityPosts.content,
        isPinned: communityPosts.isPinned,
        likeCount: communityPosts.likeCount,
        commentCount: communityPosts.commentCount,
        userId: communityPosts.userId,
        createdAt: communityPosts.createdAt,
        updatedAt: communityPosts.updatedAt,
        user: users,
      })
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .orderBy(desc(communityPosts.isPinned), desc(communityPosts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getCommunityPost(id: string): Promise<CommunityPostWithUser | undefined> {
    const [post] = await db
      .select({
        id: communityPosts.id,
        title: communityPosts.title,
        content: communityPosts.content,
        isPinned: communityPosts.isPinned,
        likeCount: communityPosts.likeCount,
        commentCount: communityPosts.commentCount,
        userId: communityPosts.userId,
        createdAt: communityPosts.createdAt,
        updatedAt: communityPosts.updatedAt,
        user: users,
      })
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .where(eq(communityPosts.id, id));
    return post;
  }

  async createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost> {
    const [newPost] = await db
      .insert(communityPosts)
      .values(post)
      .returning();
    return newPost;
  }

  async updateCommunityPost(id: string, post: Partial<InsertCommunityPost>, userId: string): Promise<CommunityPost | undefined> {
    const [updatedPost] = await db
      .update(communityPosts)
      .set({ ...post, updatedAt: new Date() })
      .where(and(eq(communityPosts.id, id), eq(communityPosts.userId, userId)))
      .returning();
    return updatedPost;
  }

  async deleteCommunityPost(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(communityPosts)
      .where(and(eq(communityPosts.id, id), eq(communityPosts.userId, userId)));
    return result.rowCount > 0;
  }

  async likeCommunityPost(postId: string, userId: string): Promise<boolean> {
    try {
      await db.insert(postLikes).values({ postId, userId });
      await db
        .update(communityPosts)
        .set({ likeCount: sql`${communityPosts.likeCount} + 1` })
        .where(eq(communityPosts.id, postId));
      return true;
    } catch {
      return false;
    }
  }

  async unlikeCommunityPost(postId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
    
    if (result.rowCount > 0) {
      await db
        .update(communityPosts)
        .set({ likeCount: sql`${communityPosts.likeCount} - 1` })
        .where(eq(communityPosts.id, postId));
      return true;
    }
    return false;
  }

  async isCommunityPostLiked(postId: string, userId: string): Promise<boolean> {
    const [like] = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
    return !!like;
  }

  async getProjectComments(projectId: string): Promise<CommentWithUser[]> {
    return db
      .select({
        id: comments.id,
        content: comments.content,
        projectId: comments.projectId,
        postId: comments.postId,
        userId: comments.userId,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        user: users,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.projectId, projectId))
      .orderBy(desc(comments.createdAt));
  }

  async getPostComments(postId: string): Promise<CommentWithUser[]> {
    return db
      .select({
        id: comments.id,
        content: comments.content,
        projectId: comments.projectId,
        postId: comments.postId,
        userId: comments.userId,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        user: users,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values(comment)
      .returning();

    // Update comment count
    if (comment.projectId) {
      await db
        .update(projects)
        .set({ commentCount: sql`${projects.commentCount} + 1` })
        .where(eq(projects.id, comment.projectId));
    } else if (comment.postId) {
      await db
        .update(communityPosts)
        .set({ commentCount: sql`${communityPosts.commentCount} + 1` })
        .where(eq(communityPosts.id, comment.postId));
    }

    return newComment;
  }

  async deleteComment(id: string, userId: string): Promise<boolean> {
    const [comment] = await db
      .select()
      .from(comments)
      .where(and(eq(comments.id, id), eq(comments.userId, userId)));

    if (!comment) return false;

    const result = await db
      .delete(comments)
      .where(and(eq(comments.id, id), eq(comments.userId, userId)));

    if (result.rowCount > 0) {
      // Update comment count
      if (comment.projectId) {
        await db
          .update(projects)
          .set({ commentCount: sql`${projects.commentCount} - 1` })
          .where(eq(projects.id, comment.projectId));
      } else if (comment.postId) {
        await db
          .update(communityPosts)
          .set({ commentCount: sql`${communityPosts.commentCount} - 1` })
          .where(eq(communityPosts.id, comment.postId));
      }
      return true;
    }
    return false;
  }

  async getAnalytics(): Promise<{
    totalProjects: number;
    totalUsers: number;
    totalLikes: number;
    totalComments: number;
    topTechStacks: Array<{ name: string; count: number }>;
    topTags: Array<{ name: string; count: number }>;
  }> {
    const [projectCount] = await db.select({ count: count() }).from(projects);
    const [userCount] = await db.select({ count: count() }).from(users);
    const [likesCount] = await db.select({ count: count() }).from(projectLikes);
    const [commentsCount] = await db.select({ count: count() }).from(comments);

    // Get top tech stacks (simplified - would need unnest in real implementation)
    const topTechStacks = [
      { name: 'React', count: 324 },
      { name: 'Vue.js', count: 186 },
      { name: 'Node.js', count: 152 },
      { name: 'Python', count: 98 },
    ];

    // Get top tags (simplified - would need unnest in real implementation)
    const topTags = [
      { name: 'Web Apps', count: 456 },
      { name: 'Mobile Apps', count: 234 },
      { name: 'Games', count: 167 },
      { name: 'Tools', count: 123 },
    ];

    return {
      totalProjects: projectCount.count,
      totalUsers: userCount.count,
      totalLikes: likesCount.count,
      totalComments: commentsCount.count,
      topTechStacks,
      topTags,
    };
  }
}

export const storage = new DatabaseStorage();
