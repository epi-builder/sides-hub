import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { ProjectCard } from "@/components/ProjectCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Calendar, Heart, Eye, MessageSquare, Code, Bookmark, User, Mail } from "lucide-react";
import type { ProjectWithUser } from "@shared/schema";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Get user's projects
  const { data: userProjects = [], isLoading: projectsLoading } = useQuery<ProjectWithUser[]>({
    queryKey: ["/api/users", user?.id, "projects"],
    enabled: !!user?.id,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    },
  });

  // Get user's bookmarks
  const { data: bookmarks = [], isLoading: bookmarksLoading } = useQuery<ProjectWithUser[]>({
    queryKey: ["/api/users/me/bookmarks"],
    enabled: isAuthenticated,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    },
  });

  if (!isAuthenticated || !user) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-8">
            You need to be signed in to view your profile.
          </p>
          <Button asChild>
            <a href="/api/login">Sign In</a>
          </Button>
        </div>
      </Layout>
    );
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const totalLikes = userProjects.reduce((sum, project) => sum + (project.likeCount || 0), 0);
  const totalViews = userProjects.reduce((sum, project) => sum + (project.viewCount || 0), 0);
  const totalComments = userProjects.reduce((sum, project) => sum + (project.commentCount || 0), 0);

  const getDisplayName = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    if (user.email) {
      return user.email.split('@')[0];
    }
    return "Anonymous User";
  };

  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    if (user.firstName) {
      return user.firstName[0];
    }
    if (user.email) {
      return user.email[0];
    }
    return "U";
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Profile Header */}
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.profileImageUrl || ""} />
                  <AvatarFallback className="text-2xl">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-3">
                  <div>
                    <h1 className="text-2xl font-bold">{getDisplayName()}</h1>
                    {user.email && (
                      <div className="flex items-center space-x-2 text-muted-foreground mt-1">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {formatDate(user.createdAt!)}</span>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                  <Button variant="outline" asChild>
                    <a href="/api/logout">Sign Out</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mx-auto mb-3">
                  <Code className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold">{userProjects.length}</div>
                <div className="text-sm text-muted-foreground">Projects</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-accent/10 rounded-lg mx-auto mb-3">
                  <Heart className="h-6 w-6 text-accent" />
                </div>
                <div className="text-2xl font-bold">{totalLikes}</div>
                <div className="text-sm text-muted-foreground">Total Likes</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-secondary/10 rounded-lg mx-auto mb-3">
                  <Eye className="h-6 w-6 text-secondary" />
                </div>
                <div className="text-2xl font-bold">{totalViews}</div>
                <div className="text-sm text-muted-foreground">Total Views</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-500/10 rounded-lg mx-auto mb-3">
                  <MessageSquare className="h-6 w-6 text-orange-500" />
                </div>
                <div className="text-2xl font-bold">{totalComments}</div>
                <div className="text-sm text-muted-foreground">Total Comments</div>
              </CardContent>
            </Card>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="projects" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="projects">My Projects</TabsTrigger>
              <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
            </TabsList>

            {/* My Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              {projectsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}>
                      <Skeleton className="aspect-video w-full" />
                      <CardContent className="p-6">
                        <Skeleton className="h-6 w-3/4 mb-3" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3 mb-4" />
                        <div className="flex gap-2 mb-4">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-20" />
                        </div>
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : userProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Code className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Start showcasing your work by submitting your first project.
                    </p>
                    <Button>Submit Your First Project</Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Bookmarks Tab */}
            <TabsContent value="bookmarks" className="space-y-6">
              {bookmarksLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}>
                      <Skeleton className="aspect-video w-full" />
                      <CardContent className="p-6">
                        <Skeleton className="h-6 w-3/4 mb-3" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3 mb-4" />
                        <div className="flex gap-2 mb-4">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-20" />
                        </div>
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : bookmarks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bookmarks.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No bookmarks yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Save your favorite projects by clicking the bookmark icon on any project.
                    </p>
                    <Button variant="outline" asChild>
                      <a href="/">Browse Projects</a>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
