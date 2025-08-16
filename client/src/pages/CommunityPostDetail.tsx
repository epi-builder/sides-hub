import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { CommunityPost } from "@/components/CommunityPost";
import { ArrowLeft, Pin } from "lucide-react";
import type { CommunityPostWithUser } from "@shared/schema";

export default function CommunityPostDetail() {
  const { id } = useParams();

  const { data: post, isLoading, error } = useQuery<CommunityPostWithUser>({
    queryKey: [`/api/community/posts/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Back button skeleton */}
            <Skeleton className="h-10 w-32" />
            
            {/* Post skeleton */}
            <Card>
              <CardContent className="p-6">
                <div className="flex space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !post) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/community">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Community
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Back button */}
          <Link href="/community">
            <Button variant="outline" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Community
            </Button>
          </Link>

          {/* Post detail */}
          <CommunityPost post={post} />

          {/* Comments section placeholder */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Comments ({post.commentCount || 0})</h3>
              <div className="text-muted-foreground text-center py-8">
                Comments feature will be implemented soon.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}