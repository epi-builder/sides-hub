import { db } from "./db";
import { users, projects, communityPosts, comments, projectLikes, postLikes } from "@shared/schema";
import { eq } from "drizzle-orm";

const mockUsers = [
  {
    id: "mock-user-1",
    email: "alex@example.com",
    firstName: "Alex",
    lastName: "Kim",
    profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "mock-user-2",
    email: "sarah@example.com", 
    firstName: "Sarah",
    lastName: "Chen",
    profileImageUrl: "https://images.unsplash.com/photo-1494790108755-2616c6f6ad36?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "mock-user-3",
    email: "david@example.com",
    firstName: "David",
    lastName: "Rodriguez",
    profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "mock-user-4",
    email: "emma@example.com",
    firstName: "Emma",
    lastName: "Johnson",
    profileImageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "mock-user-5",
    email: "ryan@example.com",
    firstName: "Ryan",
    lastName: "Park",
    profileImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
  }
];

const mockProjects = [
  {
    id: "project-1",
    userId: "mock-user-1",
    title: "(Demo) TaskFlow - Smart Todo App",
    shortDescription: "AI-powered task management app with smart scheduling and productivity insights",
    detailedDescription: "TaskFlow is a next-generation todo application that uses AI to intelligently schedule your tasks based on priority, deadlines, and your productivity patterns. Features include smart notifications, time tracking, and detailed analytics to help you optimize your workflow.",
    thumbnailUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop",
    demoUrl: "https://taskflow-demo.example.com",
    sourceUrl: "https://github.com/alexkim/taskflow",
    tags: ["productivity", "ai", "mobile"],
    techStack: ["React Native", "Node.js", "OpenAI", "PostgreSQL"],
    isFeatured: true,
  },
  {
    id: "project-2", 
    userId: "mock-user-2",
    title: "(Demo) CodeSnap - Screenshot Tool for Developers",
    shortDescription: "Beautiful code screenshots with syntax highlighting and customizable themes",
    detailedDescription: "CodeSnap makes it easy to create beautiful screenshots of your code with perfect syntax highlighting, customizable themes, and automatic formatting. Perfect for documentation, social media, and presentations. Supports 50+ programming languages.",
    thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop",
    demoUrl: "https://codesnap.dev",
    sourceUrl: "https://github.com/sarahchen/codesnap",
    tags: ["developer-tools", "productivity", "design"],
    techStack: ["React", "TypeScript", "Canvas API", "Tailwind CSS"],
  },
  {
    id: "project-3",
    userId: "mock-user-3", 
    title: "(Demo) EcoTracker - Personal Carbon Footprint",
    shortDescription: "Track and reduce your environmental impact with personalized insights",
    detailedDescription: "EcoTracker helps individuals monitor their carbon footprint through daily activities, transportation, and consumption habits. Get personalized recommendations to reduce your environmental impact and connect with a community of eco-conscious users.",
    thumbnailUrl: "https://images.unsplash.com/photo-1569163139394-de44cb2883aa?w=800&h=600&fit=crop",
    demoUrl: "https://ecotracker.green",
    sourceUrl: "https://github.com/davidrodriguez/ecotracker",
    tags: ["sustainability", "lifestyle", "environment"],
    techStack: ["Vue.js", "Express", "MongoDB", "Chart.js"],
    isFeatured: true,
  },
  {
    id: "project-4",
    userId: "mock-user-4",
    title: "(Demo) MindfulMoments - Meditation App",
    shortDescription: "Personalized meditation and mindfulness practice with guided sessions",
    detailedDescription: "MindfulMoments offers a curated collection of meditation sessions, breathing exercises, and mindfulness practices. Features include progress tracking, customizable ambient sounds, and daily mindfulness reminders to help build a consistent practice.",
    thumbnailUrl: "https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&h=600&fit=crop",
    demoUrl: "https://mindfulmoments.app",
    sourceUrl: "https://github.com/emmajohnson/mindfulmoments",
    tags: ["health", "wellness", "mobile"],
    techStack: ["Flutter", "Firebase", "Dart", "Cloud Firestore"],
  },
  {
    id: "project-5",
    userId: "mock-user-5",
    title: "(Demo) DevLink - Developer Network Platform",
    shortDescription: "Connect with developers, share projects, and find collaboration opportunities",
    detailedDescription: "DevLink is a social platform specifically designed for developers to showcase their work, find collaborators, and build meaningful professional connections. Features include project galleries, skill-based matching, and integrated communication tools.",
    thumbnailUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop",
    demoUrl: "https://devlink.network",
    sourceUrl: "https://github.com/ryanpark/devlink",
    tags: ["social", "networking", "collaboration"],
    techStack: ["Next.js", "GraphQL", "Prisma", "PostgreSQL"],
    isFeatured: true,
  },
  {
    id: "project-6",
    userId: "mock-user-1",
    title: "(Demo) SpendSmart - Budget Tracking",
    shortDescription: "Simple and intuitive personal finance management with smart categorization",
    detailedDescription: "SpendSmart automatically categorizes your expenses, tracks your spending patterns, and provides insights to help you stay within budget. Connect your bank accounts for automatic transaction import and get personalized savings recommendations.",
    thumbnailUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop",
    demoUrl: "https://spendsmart.money",
    sourceUrl: "https://github.com/alexkim/spendsmart",
    tags: ["finance", "productivity", "mobile"],
    techStack: ["React Native", "Node.js", "Plaid API", "MongoDB"],
  },
  {
    id: "project-7",
    userId: "mock-user-2",
    title: "(Demo) RecipeRank - AI Recipe Recommendations",
    shortDescription: "Discover recipes tailored to your taste preferences and dietary needs",
    detailedDescription: "RecipeRank uses machine learning to recommend recipes based on your taste preferences, dietary restrictions, and available ingredients. Rate recipes to improve recommendations and save your favorites for easy access.",
    thumbnailUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
    demoUrl: "https://reciperank.kitchen",
    sourceUrl: "https://github.com/sarahchen/reciperank",
    tags: ["food", "ai", "lifestyle"],
    techStack: ["Python", "Django", "TensorFlow", "React"],
  },
  {
    id: "project-8",
    userId: "mock-user-3",
    title: "(Demo) FitQuest - Gamified Fitness Tracking",
    shortDescription: "Turn your fitness journey into an engaging RPG-style adventure",
    detailedDescription: "FitQuest gamifies your fitness routine by turning workouts into quests, achievements into rewards, and progress into character development. Join guilds, compete with friends, and unlock new challenges as you level up your fitness.",
    thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    demoUrl: "https://fitquest.game",
    sourceUrl: "https://github.com/davidrodriguez/fitquest", 
    tags: ["health", "gaming", "mobile"],
    techStack: ["Unity", "C#", "Firebase", "Google Fit API"],
  }
];

const mockCommunityPosts = [
  {
    id: "post-1",
    userId: "mock-user-1",
    title: "What's your favorite state management solution in 2024?",
    content: "I've been exploring different state management options for React projects. Currently torn between Zustand, Redux Toolkit, and Jotai. What are you all using and why? Would love to hear about your experiences with performance and developer experience!",
  },
  {
    id: "post-2", 
    userId: "mock-user-3",
    title: "Building sustainable tech: Green coding practices",
    content: "Recently learned about the environmental impact of our code choices. Simple optimizations like reducing API calls, optimizing images, and choosing efficient algorithms can significantly reduce energy consumption. What green coding practices do you follow?",
  },
  {
    id: "post-3",
    userId: "mock-user-4",
    title: "Mobile app accessibility - Resources and tips",
    content: "Sharing some great resources I've found for making mobile apps more accessible. Screen reader testing, color contrast tools, and gesture alternatives are game-changers. Happy to share specific tools and testing approaches that have worked well for me.",
  }
];

export async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Check if mock data already exists
    const existingUsers = await db.select().from(users).where(eq(users.id, "mock-user-1"));
    if (existingUsers.length > 0) {
      console.log("✅ Mock data already exists, skipping seed");
      return;
    }

    // Insert mock users
    console.log("👥 Creating mock users...");
    await db.insert(users).values(mockUsers);

    // Insert mock projects
    console.log("📁 Creating mock projects...");
    await db.insert(projects).values(mockProjects);

    // Insert mock community posts
    console.log("💬 Creating mock community posts...");
    await db.insert(communityPosts).values(mockCommunityPosts);

    // Seed project interactions
    console.log("❤️ Creating project likes...");
    const projectLikesData = [
      { projectId: "project-1", userId: "mock-user-2" },
      { projectId: "project-1", userId: "mock-user-3" },
      { projectId: "project-1", userId: "mock-user-4" },
      { projectId: "project-2", userId: "mock-user-1" },
      { projectId: "project-2", userId: "mock-user-4" },
      { projectId: "project-3", userId: "mock-user-1" },
      { projectId: "project-3", userId: "mock-user-2" },
      { projectId: "project-3", userId: "mock-user-5" },
      { projectId: "project-4", userId: "mock-user-3" },
      { projectId: "project-5", userId: "mock-user-2" },
    ];
    await db.insert(projectLikes).values(projectLikesData);



    // Seed post likes
    console.log("💙 Creating post likes...");
    const postLikesData = [
      { postId: "post-1", userId: "mock-user-2" },
      { postId: "post-1", userId: "mock-user-3" },
      { postId: "post-2", userId: "mock-user-1" },
      { postId: "post-2", userId: "mock-user-4" },
      { postId: "post-3", userId: "mock-user-2" },
      { postId: "post-3", userId: "mock-user-5" },
    ];
    await db.insert(postLikes).values(postLikesData);

    console.log("🎉 Database seeding completed successfully!");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}