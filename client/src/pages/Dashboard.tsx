import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, Heart, MessageSquare, Code, Eye } from "lucide-react";

export default function Dashboard() {
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics"],
  });

  if (analyticsLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-5 w-96" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-12 w-12 mb-4" />
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-4 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className="flex items-center justify-between">
                          <Skeleton className="h-4 w-24" />
                          <div className="flex items-center space-x-2">
                            <Skeleton className="h-2 w-24" />
                            <Skeleton className="h-4 w-8" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!analytics) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Dashboard Unavailable</h1>
          <p className="text-muted-foreground">
            Unable to load dashboard data at this time.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Community Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Insights and analytics for the SidesHub developer community
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                    <p className="text-2xl font-bold text-primary">{analytics.totalProjects}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Code className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <p className="text-xs text-green-500 mt-2">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold text-secondary">{analytics.totalUsers}</p>
                  </div>
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                </div>
                <p className="text-xs text-green-500 mt-2">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  +8% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Likes</p>
                    <p className="text-2xl font-bold text-accent">{analytics.totalLikes}</p>
                  </div>
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Heart className="h-6 w-6 text-accent" />
                  </div>
                </div>
                <p className="text-xs text-green-500 mt-2">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  +23% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Comments</p>
                    <p className="text-2xl font-bold text-orange-500">{analytics.totalComments}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
                <p className="text-xs text-green-500 mt-2">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  +15% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Popular Tech Stacks */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Tech Stacks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topTechStacks.map((tech, index) => {
                    const percentage = (tech.count / analytics.topTechStacks[0].count) * 100;
                    return (
                      <div key={tech.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{tech.name}</span>
                          <span className="text-sm text-muted-foreground">{tech.count} projects</span>
                        </div>
                        <Progress 
                          value={percentage} 
                          className="h-2"
                          style={{
                            '--progress-background': index === 0 ? 'hsl(207, 90%, 54%)' : 
                                                   index === 1 ? 'hsl(142, 76%, 36%)' :
                                                   index === 2 ? 'hsl(38, 92%, 50%)' : 'hsl(258, 90%, 66%)'
                          } as React.CSSProperties}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Project Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Project Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topTags.map((tag, index) => {
                    const percentage = (tag.count / analytics.topTags[0].count) * 100;
                    return (
                      <div key={tag.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{tag.name}</span>
                          <span className="text-sm text-muted-foreground">{tag.count} projects</span>
                        </div>
                        <Progress 
                          value={percentage} 
                          className="h-2"
                          style={{
                            '--progress-background': index === 0 ? 'hsl(207, 90%, 54%)' : 
                                                   index === 1 ? 'hsl(142, 76%, 36%)' :
                                                   index === 2 ? 'hsl(38, 92%, 50%)' : 'hsl(258, 90%, 66%)'
                          } as React.CSSProperties}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Growth Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Community Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {Math.round((analytics.totalProjects / 30))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Average projects per day
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary mb-2">
                    {Math.round((analytics.totalLikes / analytics.totalProjects) || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Average likes per project
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent mb-2">
                    {Math.round((analytics.totalComments / analytics.totalProjects) || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Average comments per project
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Community Highlights */}
          <Card>
            <CardHeader>
              <CardTitle>Community Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Most Active Technologies</h4>
                  <div className="space-y-2">
                    {analytics.topTechStacks.slice(0, 3).map((tech, index) => (
                      <div key={tech.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            index === 0 ? 'bg-primary' : 
                            index === 1 ? 'bg-secondary' : 'bg-accent'
                          }`}></div>
                          <span className="text-sm font-medium">{tech.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{tech.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Popular Categories</h4>
                  <div className="space-y-2">
                    {analytics.topTags.slice(0, 3).map((tag, index) => (
                      <div key={tag.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            index === 0 ? 'bg-primary' : 
                            index === 1 ? 'bg-secondary' : 'bg-accent'
                          }`}></div>
                          <span className="text-sm font-medium">{tag.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{tag.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
