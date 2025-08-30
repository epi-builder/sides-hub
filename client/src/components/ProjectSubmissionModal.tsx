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
import { ObjectUploader } from "./ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertProjectSchema } from "@shared/schema";
import { X, Plus } from "lucide-react";
import { z } from "zod";
import type { UploadResult } from "@uppy/core";

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
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [thumbnailInputMethod, setThumbnailInputMethod] = useState<"upload" | "url">("upload");
  const [thumbnailUrlInput, setThumbnailUrlInput] = useState<string>("");
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
      setThumbnailUrlInput("");
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

  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload");
      if (!response.ok) {
        throw new Error("Upload service unavailable");
      }
      const data = await response.json();
      return {
        method: "PUT" as const,
        url: data.uploadURL,
      };
    } catch (error) {
      toast({
        title: "Upload Unavailable",
        description: "File upload is currently not available. Please use URL input instead.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.uploadURL;
      
      console.log("Upload completed, processing with URL:", uploadURL);
      
      try {
        // Set ACL policy for the uploaded thumbnail
        const response = await apiRequest("PUT", "/api/projects/thumbnail", {
          thumbnailUrl: uploadURL,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        setThumbnailUrl(data.objectPath);
        
        console.log("Thumbnail processing successful, objectPath:", data.objectPath);
        
        toast({
          title: "Success",
          description: "Thumbnail uploaded successfully!",
        });
      } catch (error) {
        console.error("Error setting thumbnail ACL:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast({
          title: "Error",
          description: `Failed to process thumbnail upload: ${errorMessage}`,
          variant: "destructive",
        });
      }
    }
  };

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
        description: "썸네일 이미지를 업로드하거나 URL을 입력해주세요",
        variant: "destructive",
      });
      return;
    }
    
    createProjectMutation.mutate(data);
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      action();
    }
  };

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

            {/* Thumbnail Upload */}
            <div className="space-y-3">
              <Label>Thumbnail Image *</Label>
              
              {/* Method Selection */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={thumbnailInputMethod === "upload" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setThumbnailInputMethod("upload");
                    setThumbnailUrlInput("");
                  }}
                  data-testid="button-upload-method"
                >
                  파일 업로드
                </Button>
                <Button
                  type="button"
                  variant={thumbnailInputMethod === "url" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setThumbnailInputMethod("url");
                    setThumbnailUrl("");
                  }}
                  data-testid="button-url-method"
                >
                  URL 입력
                </Button>
              </div>

              {/* File Upload Method */}
              {thumbnailInputMethod === "upload" && (
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5242880} // 5MB
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleUploadComplete}
                  buttonClassName="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors bg-transparent"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">클릭하여 업로드하거나 드래그 앤 드롭</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG 최대 5MB</p>
                      {thumbnailUrl && (
                        <p className="text-xs text-primary mt-1">✓ 썸네일 업로드 완료</p>
                      )}
                    </div>
                  </div>
                </ObjectUploader>
              )}

              {/* URL Input Method */}
              {thumbnailInputMethod === "url" && (
                <div className="space-y-2">
                  <Input
                    placeholder="이미지 URL을 입력하세요 (예: https://example.com/image.jpg)"
                    value={thumbnailUrlInput}
                    onChange={(e) => {
                      setThumbnailUrlInput(e.target.value);
                      setThumbnailUrl(e.target.value);
                    }}
                    data-testid="input-thumbnail-url"
                  />
                  {thumbnailUrlInput && (
                    <div className="border rounded-lg p-2 bg-muted/20">
                      <p className="text-xs text-muted-foreground mb-2">미리보기:</p>
                      <img
                        src={thumbnailUrlInput}
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
              )}
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
