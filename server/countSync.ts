import { db } from "./db";
import { projects, communityPosts, projectLikes, projectViews, postLikes, comments } from "@shared/schema";
import { eq, count, sql } from "drizzle-orm";

/**
 * Batch job to synchronize cached counts with actual data from normalized tables.
 * This provides eventual consistency between the fast-read cached counts and 
 * the accurate normalized tracking tables.
 */

interface CountSyncResult {
  projectsUpdated: number;
  postsUpdated: number;
  errors: string[];
}

export async function syncAllCounts(): Promise<CountSyncResult> {
  const result: CountSyncResult = {
    projectsUpdated: 0,
    postsUpdated: 0,
    errors: []
  };

  try {
    // Sync project counts
    const projectSyncResult = await syncProjectCounts();
    result.projectsUpdated = projectSyncResult;
    
    // Sync community post counts
    const postSyncResult = await syncCommunityPostCounts();
    result.postsUpdated = postSyncResult;
    
    console.log(`✅ Count sync completed: ${result.projectsUpdated} projects, ${result.postsUpdated} posts updated`);
  } catch (error) {
    result.errors.push(`Batch sync failed: ${error}`);
    console.error("❌ Count sync error:", error);
  }

  return result;
}

export async function syncProjectCounts(): Promise<number> {
  let updatedCount = 0;
  
  try {
    // Get all projects
    const allProjects = await db.select({ id: projects.id }).from(projects);
    
    for (const project of allProjects) {
      const projectId = project.id;
      
      // Calculate actual counts from normalized tables
      const [viewCountResult] = await db
        .select({ count: count() })
        .from(projectViews)
        .where(eq(projectViews.projectId, projectId));
      
      const [likeCountResult] = await db
        .select({ count: count() })
        .from(projectLikes)
        .where(eq(projectLikes.projectId, projectId));
      
      const [commentCountResult] = await db
        .select({ count: count() })
        .from(comments)
        .where(eq(comments.projectId, projectId));
      
      // Update cached counts
      await db
        .update(projects)
        .set({
          viewCount: viewCountResult.count,
          likeCount: likeCountResult.count,
          commentCount: commentCountResult.count,
          countsLastUpdated: new Date(),
        })
        .where(eq(projects.id, projectId));
      
      updatedCount++;
    }
    
    console.log(`📊 Synced counts for ${updatedCount} projects`);
  } catch (error) {
    console.error("❌ Error syncing project counts:", error);
    throw error;
  }
  
  return updatedCount;
}

export async function syncCommunityPostCounts(): Promise<number> {
  let updatedCount = 0;
  
  try {
    // Get all community posts
    const allPosts = await db.select({ id: communityPosts.id }).from(communityPosts);
    
    for (const post of allPosts) {
      const postId = post.id;
      
      // Calculate actual counts from normalized tables
      const [likeCountResult] = await db
        .select({ count: count() })
        .from(postLikes)
        .where(eq(postLikes.postId, postId));
      
      const [commentCountResult] = await db
        .select({ count: count() })
        .from(comments)
        .where(eq(comments.postId, postId));
      
      // Update cached counts
      await db
        .update(communityPosts)
        .set({
          likeCount: likeCountResult.count,
          commentCount: commentCountResult.count,
          countsLastUpdated: new Date(),
        })
        .where(eq(communityPosts.id, postId));
      
      updatedCount++;
    }
    
    console.log(`📊 Synced counts for ${updatedCount} community posts`);
  } catch (error) {
    console.error("❌ Error syncing community post counts:", error);
    throw error;
  }
  
  return updatedCount;
}

/**
 * Sync counts for a specific project only (for real-time updates on high-priority items)
 */
export async function syncSingleProjectCounts(projectId: string): Promise<void> {
  try {
    const [viewCountResult] = await db
      .select({ count: count() })
      .from(projectViews)
      .where(eq(projectViews.projectId, projectId));
    
    const [likeCountResult] = await db
      .select({ count: count() })
      .from(projectLikes)
      .where(eq(projectLikes.projectId, projectId));
    
    const [commentCountResult] = await db
      .select({ count: count() })
      .from(comments)
      .where(eq(comments.projectId, projectId));
    
    await db
      .update(projects)
      .set({
        viewCount: viewCountResult.count,
        likeCount: likeCountResult.count,
        commentCount: commentCountResult.count,
        countsLastUpdated: new Date(),
      })
      .where(eq(projects.id, projectId));
    
  } catch (error) {
    console.error(`❌ Error syncing counts for project ${projectId}:`, error);
    throw error;
  }
}

/**
 * Sync counts for a specific community post only
 */
export async function syncSinglePostCounts(postId: string): Promise<void> {
  try {
    const [likeCountResult] = await db
      .select({ count: count() })
      .from(postLikes)
      .where(eq(postLikes.postId, postId));
    
    const [commentCountResult] = await db
      .select({ count: count() })
      .from(comments)
      .where(eq(comments.postId, postId));
    
    await db
      .update(communityPosts)
      .set({
        likeCount: likeCountResult.count,
        commentCount: commentCountResult.count,
        countsLastUpdated: new Date(),
      })
      .where(eq(communityPosts.id, postId));
    
  } catch (error) {
    console.error(`❌ Error syncing counts for post ${postId}:`, error);
    throw error;
  }
}