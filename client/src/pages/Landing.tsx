import { Button } from "@/components/ui/button";
import { Code, Users, Heart, TrendingUp } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation for landing page */}
      <nav className="border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <Code className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">SidesHub</span>
            </div>
            <Button asChild>
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Showcase Your Side Projects
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join a community of developers sharing their passion projects. Discover amazing side projects, get feedback, and inspire others.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90">
              <a href="/api/login">Get Started</a>
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose SidesHub?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to showcase your projects and connect with the developer community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Project Sharing</h3>
              <p className="text-muted-foreground text-sm">
                Submit your projects with detailed descriptions, screenshots, and links to demos or source code.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Community Engagement</h3>
              <p className="text-muted-foreground text-sm">
                Connect with fellow developers, get feedback, and discover inspiring projects from the community.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Heart className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Like & Bookmark</h3>
              <p className="text-muted-foreground text-sm">
                Show appreciation for great projects and save your favorites for later reference.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Discover Trends</h3>
              <p className="text-muted-foreground text-sm">
                Stay updated with the latest technologies and trends in the developer community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Join Our Growing Community</h2>
            <p className="text-muted-foreground">
              Thousands of developers are already sharing their passion projects
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1,200+</div>
              <div className="text-muted-foreground">Projects Shared</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-secondary mb-2">850+</div>
              <div className="text-muted-foreground">Active Developers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">3,400+</div>
              <div className="text-muted-foreground">Likes Given</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Share Your Projects?</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Join SidesHub today and start showcasing your side projects to the world.
          </p>
          <Button size="lg" asChild className="bg-primary hover:bg-primary/90">
            <a href="/api/login">Sign Up Now</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <Code className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">SidesHub</span>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <p>&copy; 2024 SidesHub. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
