import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { CommunityPost } from "@/components/CommunityPost";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CommunityPostModal } from "@/components/CommunityPostModal";
import { useAuth } from "@/hooks/useAuth";
import { Plus } from "lucide-react";
import type { CommunityPostWithUser } from "@shared/schema";

export default function Community() {
  const { isAuthenticated } = useAuth();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  const { data: posts = [], isLoading } = useQuery<CommunityPostWithUser[]>({
    queryKey: [`/api/community/posts?page=${currentPage}&limit=${postsPerPage}`],
  });

  const handleNewPost = () => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    setIsPostModalOpen(true);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Community Board</h1>
              <p className="text-muted-foreground mt-1">
                Connect with fellow developers and share your thoughts
              </p>
            </div>
            <Button onClick={handleNewPost} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </div>

          {/* Community Guidelines */}
          <Card className="border-yellow-200 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-900/10">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold mb-2">Community Guidelines</h3>
                  <p className="text-sm text-muted-foreground">
                    Please be respectful and constructive in your discussions. Share knowledge, 
                    ask questions, and help build a positive community for all developers.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Posts */}
          <div className="space-y-6">
            {posts.length > 0 ? (
              <>
                {posts.map((post) => (
                  <CommunityPost key={post.id} post={post} />
                ))}

                {/* Pagination */}
                {posts.length === postsPerPage && (
                  <div className="flex justify-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center px-4 py-2 text-sm">
                      Page {currentPage}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={posts.length < postsPerPage}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  No posts yet. Be the first to start a discussion!
                </div>
                <Button onClick={handleNewPost}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Post
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Post Modal */}
      <CommunityPostModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
      />
    </Layout>
  );
}
