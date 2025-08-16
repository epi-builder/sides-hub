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
import { Heart, MessageCircle, Share, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommunityPostWithUser } from "@shared/schema";

interface CommunityPostProps {
  post: CommunityPostWithUser;
}

export function CommunityPost({ post }: CommunityPostProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get like status
  const { data: likeStatus } = useQuery({
    queryKey: ["/api/community/posts", post.id, "like-status"],
    enabled: isAuthenticated,
    retry: false,
  });

  const likeMutation = useMutation({
    mutationFn: async (isLiked: boolean) => {
      if (isLiked) {
        await apiRequest("DELETE", `/api/community/posts/${post.id}/like`);
      } else {
        await apiRequest("POST", `/api/community/posts/${post.id}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0]?.toString().startsWith("/api/community/posts")
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
        description: "Failed to update like status",
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

  const handleShare = () => {
    const url = `${window.location.origin}/community/posts/${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.content.substring(0, 100) + "...",
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Post link has been copied to clipboard",
      });
    }
  };

  const formatDate = (date: string | Date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 3600));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return postDate.toLocaleDateString();
  };

  const formatCount = (count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const getInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    if (user?.firstName) {
      return user.firstName[0];
    }
    if (user?.email) {
      return user.email[0];
    }
    return "U";
  };

  return (
    <Card className={cn(
      "border-border",
      post.isPinned && "border-yellow-200 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-900/10"
    )}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {post.isPinned && (
            <Pin className="h-4 w-4 text-yellow-500 mt-1 flex-shrink-0" />
          )}
          
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={post.user?.profileImageUrl || ""} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(post.user)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center space-x-2 mb-2">
              {post.isPinned && (
                <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700">
                  PINNED
                </Badge>
              )}
              <span className="font-medium">
                {post.user?.firstName && post.user?.lastName 
                  ? `${post.user.firstName} ${post.user.lastName}`
                  : post.user?.email?.split('@')[0] || "Anonymous"}
              </span>
              <span className="text-sm text-muted-foreground">
                • {formatDate(post.createdAt!)}
              </span>
            </div>

            {/* Content */}
            <Link href={`/community/posts/${post.id}`}>
              <h3 className="font-semibold mb-2 hover:text-primary transition-colors cursor-pointer">
                {post.title}
              </h3>
            </Link>
            <p className="text-muted-foreground mb-4 whitespace-pre-wrap">
              {post.content}
            </p>

            {/* Actions */}
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <button
                onClick={handleLike}
                disabled={likeMutation.isPending}
                className={cn(
                  "flex items-center space-x-1 hover:text-primary transition-colors",
                  likeStatus?.isLiked && "text-primary"
                )}
              >
                <Heart className={cn(
                  "h-4 w-4",
                  likeStatus?.isLiked && "fill-current"
                )} />
                <span>{formatCount(post.likeCount || 0)}</span>
              </button>
              
              <Link href={`/community/posts/${post.id}`}>
                <div className="flex items-center space-x-1 hover:text-primary transition-colors cursor-pointer">
                  <MessageCircle className="h-4 w-4" />
                  <span>{formatCount(post.commentCount || 0)}</span>
                </div>
              </Link>
              
              <button
                onClick={handleShare}
                className="flex items-center space-x-1 hover:text-primary transition-colors"
              >
                <Share className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
