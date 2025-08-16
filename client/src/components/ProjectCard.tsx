import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Heart, Eye, MessageCircle, Bookmark, ExternalLink, Github } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectWithUser, LikeStatus } from "@shared/schema";

interface ProjectCardProps {
  project: ProjectWithUser;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get like and bookmark status
  const { data: likeStatus } = useQuery<LikeStatus>({
    queryKey: ["/api/projects", project.id, "like-status"],
    enabled: isAuthenticated,
    retry: false,
  });

  const likeMutation = useMutation({
    mutationFn: async (isLiked: boolean) => {
      if (isLiked) {
        await apiRequest("DELETE", `/api/projects/${project.id}/like`);
      } else {
        await apiRequest("POST", `/api/projects/${project.id}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project.id, "like-status"] });
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
        await apiRequest("DELETE", `/api/projects/${project.id}/bookmark`);
      } else {
        await apiRequest("POST", `/api/projects/${project.id}/bookmark`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project.id, "like-status"] });
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

  const formatDate = (date: string | Date) => {
    const now = new Date();
    const projectDate = new Date(date);
    const diffInDays = Math.floor((now.getTime() - projectDate.getTime()) / (1000 * 3600 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} ago`;
    return projectDate.toLocaleDateString();
  };

  const formatCount = (count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-border overflow-hidden">
      {/* Project Image */}
      <Link href={`/projects/${project.id}`}>
        <div className="aspect-video relative overflow-hidden bg-muted">
          {project.thumbnailUrl ? (
            <img
              src={project.thumbnailUrl}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <Link href={`/projects/${project.id}`}>
            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-1">
              {project.title}
            </h3>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            disabled={bookmarkMutation.isPending}
            className={cn(
              "h-8 w-8 p-0",
              likeStatus?.isBookmarked && "text-primary"
            )}
          >
            <Bookmark className={cn(
              "h-4 w-4",
              likeStatus?.isBookmarked && "fill-current"
            )} />
          </Button>
        </div>

        {/* Description */}
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {project.shortDescription}
        </p>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {project.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {project.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{project.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Links */}
        {(project.demoUrl || project.sourceUrl) && (
          <div className="flex gap-2 mb-4">
            {project.demoUrl && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Demo
                </a>
              </Button>
            )}
            {project.sourceUrl && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer">
                  <Github className="h-3 w-3 mr-1" />
                  Code
                </a>
              </Button>
            )}
          </div>
        )}

        {/* Stats and Author */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Eye className="h-3 w-3" />
              <span>{formatCount(project.viewCount || 0)}</span>
            </div>
            <button
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className={cn(
                "flex items-center space-x-1 hover:text-primary transition-colors",
                likeStatus?.isLiked && "text-primary"
              )}
            >
              <Heart className={cn(
                "h-3 w-3",
                likeStatus?.isLiked && "fill-current"
              )} />
              <span>{formatCount(project.likeCount || 0)}</span>
            </button>
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-3 w-3" />
              <span>{formatCount(project.commentCount || 0)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={project.user?.profileImageUrl || ""} />
              <AvatarFallback className="text-xs">
                {project.user?.firstName?.[0] || project.user?.email?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <span>{formatDate(project.createdAt!)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
