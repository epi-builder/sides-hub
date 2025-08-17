import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectSubmissionModal } from "@/components/ProjectSubmissionModal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, Heart, MessageSquare } from "lucide-react";
import type { ProjectWithUser, Analytics } from "@shared/schema";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTechStack, setSelectedTechStack] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Get URL search params
  const urlParams = new URLSearchParams(window.location.search);
  const urlSearch = urlParams.get("search");

  // Set search query from URL on mount
  useState(() => {
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  });

  const queryParams = new URLSearchParams();
  if (searchQuery || urlSearch) {
    queryParams.set('search', searchQuery || urlSearch || '');
  }
  if (selectedCategory !== "all") {
    queryParams.set('tags', selectedCategory);
  }
  if (selectedTechStack !== "all") {
    queryParams.set('techStack', selectedTechStack);
  }
  if (sortBy !== "recent") {
    queryParams.set('sortBy', sortBy);
  }
  
  const queryString = queryParams.toString();
  const apiUrl = queryString ? `/api/projects?${queryString}` : '/api/projects';

  const { data: projects = [], isLoading } = useQuery<ProjectWithUser[]>({
    queryKey: [apiUrl],
  });

  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["/api/analytics"],
  });

  // Extract unique categories and tech stacks
  const categories = useMemo(() => {
    const allTags = projects.flatMap(p => p.tags || []);
    return Array.from(new Set(allTags)).slice(0, 10); // Top 10 categories
  }, [projects]);

  const techStacks = useMemo(() => {
    const allTech = projects.flatMap(p => p.techStack || []);
    return Array.from(new Set(allTech)).slice(0, 10); // Top 10 tech stacks
  }, [projects]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedTechStack("all");
    setSortBy("recent");
    setCurrentPage(1);
    // Clear URL search params
    window.history.replaceState({}, '', window.location.pathname);
  };

  const hasFilters = searchQuery || urlSearch || selectedCategory !== "all" || selectedTechStack !== "all" || sortBy !== "recent";

  // Handler functions for buttons
  const handleSubmitProject = () => {
    setIsModalOpen(true);
  };

  const handleExploreProjects = () => {
    const projectsSection = document.getElementById('projects-section');
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      // In a real implementation, this would load the next page of projects
      // For now, we simulate loading time and indicate that this would load more
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentPage(prev => prev + 1);
      
      // Note: This is a placeholder implementation. In a real app, you would:
      // 1. Add page/limit parameters to the API call
      // 2. Append new projects to the existing array
      // 3. Hide the button when no more projects are available
      console.log(`Would load page ${currentPage + 1} of projects`);
    } catch (error) {
      console.error('Failed to load more projects:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen">
          {/* Hero Section Skeleton */}
          <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <Skeleton className="h-12 w-3/4 mx-auto mb-6" />
              <Skeleton className="h-6 w-1/2 mx-auto mb-8" />
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Skeleton className="h-12 w-40" />
                <Skeleton className="h-12 w-40" />
              </div>
            </div>
          </section>

          {/* Content Skeleton */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          </section>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Showcase Your Side Projects
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join a community of developers sharing their passion projects. Discover amazing side projects, get feedback, and inspire others.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={handleSubmitProject}
                data-testid="button-submit-project"
              >
                Submit Your Project
              </Button>
              <Button 
                variant="outline"
                onClick={handleExploreProjects}
                data-testid="button-explore-projects"
              >
                Explore Projects
              </Button>
            </div>
          </div>
        </section>

        {/* Stats and Filters */}
        <section id="projects-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            {/* Stats */}
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {analytics?.totalProjects || projects.length}
                </div>
                <div className="text-sm text-muted-foreground">Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">
                  {analytics?.totalUsers || 856}
                </div>
                <div className="text-sm text-muted-foreground">Developers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  {analytics?.totalLikes || 3429}
                </div>
                <div className="text-sm text-muted-foreground">Likes</div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTechStack} onValueChange={setSelectedTechStack}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Any Tech Stack" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Tech Stack</SelectItem>
                  {techStacks.map((tech) => (
                    <SelectItem key={tech} value={tech}>
                      {tech}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="likes">Most Liked</SelectItem>
                  <SelectItem value="views">Most Viewed</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>

              {hasFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mb-6">
              {(searchQuery || urlSearch) && (
                <Badge variant="secondary">
                  Search: "{searchQuery || urlSearch}"
                </Badge>
              )}
              {selectedCategory !== "all" && (
                <Badge variant="secondary">
                  Category: {selectedCategory}
                </Badge>
              )}
              {selectedTechStack !== "all" && (
                <Badge variant="secondary">
                  Tech: {selectedTechStack}
                </Badge>
              )}
              {sortBy !== "recent" && (
                <Badge variant="secondary">
                  Sort: {sortBy === "likes" ? "Most Liked" : sortBy === "views" ? "Most Viewed" : "Oldest First"}
                </Badge>
              )}
            </div>
          )}

          {/* Projects Grid */}
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                {hasFilters ? "No projects found matching your filters" : "No projects found"}
              </div>
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          )}

          {/* Load More */}
          {projects.length > 0 && projects.length >= 6 && (
            <div className="text-center">
              <Button 
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                data-testid="button-load-more"
              >
                {loadingMore ? "Loading..." : "Load More Projects"}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Showing {projects.length} projects
              </p>
            </div>
          )}
        </section>

        {/* Dashboard Preview */}
        {analytics && (
          <section className="bg-muted/30 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold mb-8 text-center">Community Insights</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Projects</p>
                        <p className="text-2xl font-bold text-primary">{analytics.totalProjects}</p>
                      </div>
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Users</p>
                        <p className="text-2xl font-bold text-secondary">{analytics.totalUsers}</p>
                      </div>
                      <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-secondary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Likes</p>
                        <p className="text-2xl font-bold text-accent">{analytics.totalLikes}</p>
                      </div>
                      <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                        <Heart className="h-6 w-6 text-accent" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Comments</p>
                        <p className="text-2xl font-bold text-orange-500">{analytics.totalComments}</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-orange-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          </section>
        )}
      </div>
      
      {/* Project Submission Modal */}
      <ProjectSubmissionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </Layout>
  );
}
