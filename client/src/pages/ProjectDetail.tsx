import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Heart, Eye, MessageCircle, Bookmark, ExternalLink, Github, Calendar, User, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectWithUser, CommentWithUser, User as UserType, LikeStatus } from "@shared/schema";

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

  // Navigate back to home after deletion
  const navigate = (path: string) => {
    window.location.href = path;
  };

  const projectId = params?.id;

  const { data: project, isLoading: projectLoading } = useQuery<ProjectWithUser>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery<CommentWithUser[]>({
    queryKey: ["/api/projects", projectId, "comments"],
    enabled: !!projectId,
  });

  const { data: likeStatus } = useQuery<LikeStatus>({
    queryKey: ["/api/projects", projectId, "like-status"],
    enabled: isAuthenticated && !!projectId,
    retry: false,
  });

  const likeMutation = useMutation({
    mutationFn: async (isLiked: boolean) => {
      if (isLiked) {
        await apiRequest("DELETE", `/api/projects/${projectId}/like`);
      } else {
        await apiRequest("POST", `/api/projects/${projectId}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "like-status"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (isBookmarked: boolean) => {
      if (isBookmarked) {
        await apiRequest("DELETE", `/api/projects/${projectId}/bookmark`);
      } else {
        await apiRequest("POST", `/api/projects/${projectId}/bookmark`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "like-status"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update bookmark status",
        variant: "destructive",
      });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/comments", {
        content,
        projectId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      setCommentText("");
      toast({
        title: "Success",
        description: "Comment added successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      navigate("/");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    likeMutation.mutate(likeStatus?.isLiked || false);
  };

  const handleBookmark = () => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    bookmarkMutation.mutate(likeStatus?.isBookmarked || false);
  };

  const handleComment = () => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText.trim());
  };

  const handleDelete = () => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    
    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  // Check if current user is the project owner
  const isOwner = isAuthenticated && user && (user as UserType).id === project?.userId;

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCount = (count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  if (projectLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-18" />
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Project not found</h1>
          <p className="text-muted-foreground mb-8">
            The project you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <a href="/">Browse Projects</a>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Project Header */}
          <div className="space-y-6">
            {/* Thumbnail */}
            {project.thumbnailUrl && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={project.thumbnailUrl}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Title and Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">{project.title}</h1>
                <p className="text-lg text-muted-foreground">{project.shortDescription}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleLike}
                  disabled={likeMutation.isPending}
                  className={cn(
                    likeStatus?.isLiked && "text-primary border-primary"
                  )}
                  data-testid="button-like-project"
                >
                  <Heart className={cn(
                    "h-4 w-4 mr-2",
                    likeStatus?.isLiked && "fill-current"
                  )} />
                  {formatCount(project.likeCount || 0)}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleBookmark}
                  disabled={bookmarkMutation.isPending}
                  className={cn(
                    likeStatus?.isBookmarked && "text-primary border-primary"
                  )}
                  data-testid="button-bookmark-project"
                >
                  <Bookmark className={cn(
                    "h-4 w-4",
                    likeStatus?.isBookmarked && "fill-current"
                  )} />
                </Button>

                {isOwner ? (
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="text-muted-foreground hover:text-destructive hover:border-destructive"
                    data-testid="button-delete-project"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                ) : null}
              </div>
            </div>

            {/* Links */}
            {(project.demoUrl || project.sourceUrl) && (
              <div className="flex gap-4">
                {project.demoUrl && (
                  <Button asChild>
                    <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Live Demo
                    </a>
                  </Button>
                )}
                {project.sourceUrl && (
                  <Button variant="outline" asChild>
                    <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4 mr-2" />
                      Source Code
                    </a>
                  </Button>
                )}
              </div>
            )}

            {/* Tags and Tech Stack */}
            <div className="space-y-3">
              {project.tags && project.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {project.techStack && project.techStack.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Tech Stack</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                      <Badge key={tech} variant="outline">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{formatCount(project.viewCount || 0)} views</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>{formatCount(project.likeCount || 0)} likes</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                <span>{formatCount(project.commentCount || 0)} comments</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(project.createdAt!)}</span>
              </div>
            </div>
          </div>

          {/* Project Description */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">About this project</h2>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap">{project.detailedDescription}</p>
              </div>
            </CardContent>
          </Card>

          {/* Author Info */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">About the creator</h2>
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={project.user?.profileImageUrl || ""} />
                  <AvatarFallback>
                    {project.user?.firstName?.[0] || project.user?.email?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {project.user?.firstName && project.user?.lastName
                      ? `${project.user.firstName} ${project.user.lastName}`
                      : project.user?.email?.split('@')[0] || "Anonymous"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Joined {formatDate(project.user?.createdAt || project.createdAt!)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Comments ({comments.length})
              </h2>

              {/* Add Comment */}
              {isAuthenticated ? (
                <div className="space-y-4 mb-6">
                  <Textarea
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleComment}
                      disabled={!commentText.trim() || commentMutation.isPending}
                    >
                      {commentMutation.isPending ? "Posting..." : "Post Comment"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg">
                  <p className="text-muted-foreground mb-4">
                    Sign in to join the discussion
                  </p>
                  <Button asChild>
                    <a href="/api/login">Sign In</a>
                  </Button>
                </div>
              )}

              {/* Comments List */}
              {commentsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={comment.user?.profileImageUrl || ""} />
                        <AvatarFallback>
                          {comment.user?.firstName?.[0] || comment.user?.email?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {comment.user?.firstName && comment.user?.lastName
                              ? `${comment.user.firstName} ${comment.user.lastName}`
                              : comment.user?.email?.split('@')[0] || "Anonymous"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(comment.createdAt!)}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
