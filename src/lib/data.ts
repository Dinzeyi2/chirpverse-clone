
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

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user?: User;
  media?: {
    type: string;
    url: string;
  }[];
  metadata?: {
    display_username?: string;
    is_ai_generated?: boolean;
    reactions?: string[];
    [key: string]: any;
  };
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
  images?: Array<string | {type: string, url: string}>;
  codeBlocks?: {code: string, language: string}[];
  languages?: string[];
  metadata?: {
    display_username?: string;
    is_ai_generated?: boolean;
    [key: string]: any;
  };
  comments?: Comment[]; // Add comments to the Post interface
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
