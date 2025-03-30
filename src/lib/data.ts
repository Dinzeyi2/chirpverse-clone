
export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  verified: boolean;
  name?: string;
  profession?: string;
  following?: number;
  followers?: number;
}

// Simple types that don't cause circular references
export interface MediaItem {
  type: string;
  url: string;
}

export type Json = string | number | boolean | { [key: string]: Json } | Json[];

// Use a more specific type for metadata to avoid circular references
export interface CommentMetadata {
  reply_to?: {
    comment_id: string;
    username: string;
  };
  parent_id?: string;
  display_username?: string;
  is_ai_generated?: boolean;
  reactions?: string[];
  [key: string]: any; // Allow additional properties
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string; // Matches our frontend expected format
  userId: string; // Matches our frontend expected format
  user?: User;
  media?: MediaItem[] | null;
  metadata?: CommentMetadata | Record<string, any> | null;
  // Add aliases for database field mappings
  created_at?: string; // From database
  user_id?: string; // From database
  likes?: number; // Adding the missing property
  liked_by_user?: boolean; // Adding the missing property
}

export interface Post {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  likes: number;
  replies: number;
  reposts?: number;
  views?: number;
  user?: User;
  liked?: boolean;
  bookmarked?: boolean;
  isOwner?: boolean;
  images?: Array<string | MediaItem> | null;
  codeBlocks?: {code: string, language: string}[];
  languages?: string[];
  metadata?: Record<string, any> | null;
  comments?: Comment[]; // Add comments to the Post interface
}

export interface ReplyTo {
  comment_id: string;
  username: string;
}

// Define interfaces for the Comment component to avoid circular dependencies
export interface ReplyUser {
  id: string;
  username: string;
  avatar: string;
  full_name: string;
  verified: boolean;
}

export interface Reply {
  id: string;
  content: string;
  created_at: string;
  user: ReplyUser;
  media?: MediaItem[] | null;
  likes: number;
  liked_by_user: boolean;
  metadata?: Record<string, any> | null; // Use Record<string, any> to avoid circular references
}

// Add this to ensure compatibility with Comment.tsx
export interface ReplyComment {
  id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    avatar: string;
    full_name: string;
    verified: boolean;
  };
  media?: MediaItem[] | null;
  likes: number;
  liked_by_user: boolean;
  metadata?: Record<string, any> | null;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 7) {
    return date.toLocaleDateString();
  } else if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}
