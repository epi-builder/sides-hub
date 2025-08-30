import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertProjectSchema } from "@shared/schema";
import { X } from "lucide-react";
import { z } from "zod";

const formSchema = insertProjectSchema.extend({
  tags: z.array(z.string()).optional(),
  techStack: z.array(z.string()).optional(),
});

interface ProjectSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSubmissionModal({ isOpen, onClose }: ProjectSubmissionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [tagInput, setTagInput] = useState("");
  const [techStackInput, setTechStackInput] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      shortDescription: "",
      detailedDescription: "",
      thumbnailUrl: "",
      demoUrl: "",
      sourceUrl: "",
      tags: [],
      techStack: [],
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/projects", {
        ...data,
        thumbnailUrl: thumbnailUrl || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Your project has been submitted successfully!",
      });
      form.reset();
      setThumbnailUrl("");
      setTagInput("");
      setTechStackInput("");
      onClose();
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
        description: "Failed to submit project. Please try again.",
        variant: "destructive",
      });
    },
  });


  const addTag = () => {
    if (tagInput.trim()) {
      const currentTags = form.getValues("tags") || [];
      if (!currentTags.includes(tagInput.trim())) {
        form.setValue("tags", [...currentTags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue("tags", currentTags.filter(tag => tag !== tagToRemove));
  };

  const addTechStack = () => {
    if (techStackInput.trim()) {
      const currentTechStack = form.getValues("techStack") || [];
      if (!currentTechStack.includes(techStackInput.trim())) {
        form.setValue("techStack", [...currentTechStack, techStackInput.trim()]);
      }
      setTechStackInput("");
    }
  };

  const removeTechStack = (techToRemove: string) => {
    const currentTechStack = form.getValues("techStack") || [];
    form.setValue("techStack", currentTechStack.filter(tech => tech !== techToRemove));
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log("Form submission triggered!");
    console.log("Is authenticated:", isAuthenticated);
    console.log("Form data:", data);
    console.log("Thumbnail URL:", thumbnailUrl);
    console.log("Form errors:", form.formState.errors);
    
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "You need to be logged in to submit a project",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.demoUrl && !data.sourceUrl) {
      toast({
        title: "Error",
        description: "Please provide either a demo URL or source code URL",
        variant: "destructive",
      });
      return;
    }
    
    if (!thumbnailUrl) {
      toast({
        title: "Error",
        description: "썸네일 이미지 URL을 입력해주세요",
        variant: "destructive",
      });
      return;
    }
    
    console.log("About to submit project...");
    createProjectMutation.mutate(data);
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      action();
    }
  };

  // Show login prompt if not authenticated
  if (isOpen && !isLoading && !isAuthenticated) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              You need to be logged in to submit a project to the community.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-4">
            <Button asChild className="w-full">
              <a href="/api/login">Sign In</a>
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Your Project</DialogTitle>
          <DialogDescription>
            Share your side project with the developer community. Fill in the details below to showcase your work.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome Project" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Short Description */}
            <FormField
              control={form.control}
              name="shortDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description *</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description for project cards" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Detailed Description */}
            <FormField
              control={form.control}
              name="detailedDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Detailed description of your project..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Thumbnail URL Input */}
            <div className="space-y-3">
              <Label>Thumbnail Image URL *</Label>
              <div className="space-y-2">
                <Input
                  placeholder="이미지 URL을 입력하세요 (예: https://example.com/image.jpg)"
                  value={thumbnailUrl}
                  onChange={(e) => {
                    setThumbnailUrl(e.target.value);
                  }}
                  data-testid="input-thumbnail-url"
                />
                {thumbnailUrl && (
                  <div className="border rounded-lg p-2 bg-muted/20">
                    <p className="text-xs text-muted-foreground mb-2">미리보기:</p>
                    <img
                      src={thumbnailUrl}
                      alt="Thumbnail preview"
                      className="w-20 h-20 object-cover rounded border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                      onLoad={(e) => {
                        (e.target as HTMLImageElement).style.display = 'block';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Links */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="demoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Live Demo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://myproject.com" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sourceUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Code URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://github.com/user/repo" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, addTag)}
                    className="flex-1"
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    Add
                  </Button>
                </div>
                {form.watch("tags") && form.watch("tags")!.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.watch("tags")!.map((tag) => (
                      <Badge key={tag} variant="secondary" className="pr-1">
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1 ml-1"
                          onClick={() => removeTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tech Stack */}
            <div>
              <Label>Tech Stack</Label>
              <div className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add technology"
                    value={techStackInput}
                    onChange={(e) => setTechStackInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, addTechStack)}
                    className="flex-1"
                  />
                  <Button type="button" onClick={addTechStack} variant="outline">
                    Add
                  </Button>
                </div>
                {form.watch("techStack") && form.watch("techStack")!.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.watch("techStack")!.map((tech) => (
                      <Badge key={tech} variant="outline" className="pr-1">
                        {tech}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1 ml-1"
                          onClick={() => removeTechStack(tech)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createProjectMutation.isPending}
                className="bg-primary hover:bg-primary/90"
                onClick={() => {
                  console.log("Submit button clicked!");
                  console.log("Form is valid:", form.formState.isValid);
                  console.log("Form errors:", form.formState.errors);
                  console.log("Form values:", form.getValues());
                }}
                data-testid="button-submit-project"
              >
                {createProjectMutation.isPending ? "Submitting..." : "Submit Project"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
