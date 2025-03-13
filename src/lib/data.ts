// Sample user data
export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  following: number;
  followers: number;
  verified?: boolean;
}

// Sample post data
export interface Post {
  id: string;
  content: string;
  images?: string[];
  createdAt: string;
  likes: number;
  reposts: number;
  replies: number;
  views: number;
  userId: string;
  user?: User;
  liked?: boolean;
  reposted?: boolean;
}

// Sample comment data
export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  postId: string;
  likes: number;
  user?: User;
  liked?: boolean;
}

// Sample users
export const users: User[] = [
  {
    id: '1',
    name: 'John Doe',
    username: 'johndoe',
    avatar: 'https://i.pravatar.cc/150?img=1',
    bio: 'Digital designer and creator. Passionate about design and technology.',
    following: 234,
    followers: 1453,
    verified: true,
  },
  {
    id: '2',
    name: 'Jane Smith',
    username: 'janesmith',
    avatar: 'https://i.pravatar.cc/150?img=5',
    bio: 'Product Designer • UI/UX Enthusiast • Coffee Lover',
    following: 178,
    followers: 892,
  },
  {
    id: '3',
    name: 'Alex Johnson',
    username: 'alexj',
    avatar: 'https://i.pravatar.cc/150?img=3',
    bio: 'Software engineer. Building things for the web.',
    following: 345,
    followers: 2156,
    verified: true,
  },
  {
    id: '4',
    name: 'Sarah Parker',
    username: 'sarahp',
    avatar: 'https://i.pravatar.cc/150?img=9',
    bio: 'Photographer and visual storyteller.',
    following: 421,
    followers: 3211,
  },
  {
    id: '5',
    name: 'Michael Chen',
    username: 'mikechen',
    avatar: 'https://i.pravatar.cc/150?img=11',
    bio: 'Technology enthusiast and entrepreneur.',
    following: 156,
    followers: 978,
    verified: true,
  }
];

// Sample posts
export const posts: Post[] = [
  {
    id: '1',
    content: 'Just released our new design system! Check it out and let me know what you think.',
    images: ['https://picsum.photos/800/450?random=1'],
    createdAt: '2023-10-12T14:23:00Z',
    likes: 152,
    reposts: 23,
    replies: 16,
    views: 2345,
    userId: '1',
    user: users.find(user => user.id === '1')
  },
  {
    id: '2',
    content: 'Working on something exciting! Can\'t wait to share it with everyone.',
    createdAt: '2023-10-12T12:15:00Z',
    likes: 83,
    reposts: 7,
    replies: 9,
    views: 1203,
    userId: '2',
    user: users.find(user => user.id === '2')
  },
  {
    id: '3',
    content: 'Just published my latest article on modern web development practices and performance optimization techniques. Read it now!',
    images: ['https://picsum.photos/800/450?random=2'],
    createdAt: '2023-10-12T10:05:00Z',
    likes: 214,
    reposts: 42,
    replies: 28,
    views: 3562,
    userId: '3',
    user: users.find(user => user.id === '3')
  },
  {
    id: '4',
    content: 'Captured this stunning sunset during my evening walk. Nature\'s beauty never fails to amaze me.',
    images: ['https://picsum.photos/800/450?random=3'],
    createdAt: '2023-10-11T21:30:00Z',
    likes: 342,
    reposts: 56,
    replies: 19,
    views: 4231,
    userId: '4',
    user: users.find(user => user.id === '4')
  },
  {
    id: '5',
    content: 'Excited to announce that our startup has secured its Series A funding! A big thank you to our amazing team and investors who believed in our vision.',
    createdAt: '2023-10-11T18:45:00Z',
    likes: 523,
    reposts: 128,
    replies: 74,
    views: 8762,
    userId: '5',
    user: users.find(user => user.id === '5')
  },
  {
    id: '6',
    content: 'Just had a great coffee chat with fellow designers. Always inspiring to exchange ideas and perspectives!',
    createdAt: '2023-10-11T16:20:00Z',
    likes: 97,
    reposts: 12,
    replies: 8,
    views: 1523,
    userId: '1',
    user: users.find(user => user.id === '1')
  },
  {
    id: '7',
    content: 'Finished reading "Design for the Real World" by Victor Papanek. Highly recommend for anyone interested in sustainable design and social responsibility.',
    createdAt: '2023-10-11T14:10:00Z',
    likes: 132,
    reposts: 29,
    replies: 15,
    views: 2187,
    userId: '2',
    user: users.find(user => user.id === '2')
  },
  {
    id: '8',
    content: 'Just deployed a major update to our app! New features include dark mode, improved performance, and a redesigned dashboard. Update now!',
    images: ['https://picsum.photos/800/450?random=4'],
    createdAt: '2023-10-11T11:30:00Z',
    likes: 278,
    reposts: 48,
    replies: 32,
    views: 3976,
    userId: '3',
    user: users.find(user => user.id === '3')
  }
];

// Add samplePosts export
export const samplePosts: Post[] = [
  {
    id: '1',
    user: {
      id: '1',
      name: 'Jane Smith',
      username: 'janesmith',
      avatar: 'https://i.pravatar.cc/150?img=5',
      verified: true,
      following: 234,
      followers: 1453
    },
    content: 'Just launched our new AI feature! Check it out and let me know what you think. #AI #Innovation',
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    likes: 89,
    replies: 24,
    reposts: 12,
    views: 1204,
    liked: false,
    reposted: false,
    userId: '1'
  },
  {
    id: '2',
    user: {
      id: '2',
      name: 'Tech Today',
      username: 'techtoday',
      avatar: 'https://i.pravatar.cc/150?img=12',
      verified: true,
      following: 567,
      followers: 8920
    },
    content: 'Breaking: New advancements in quantum computing could revolutionize data processing. Scientists predict commercial applications within 5 years.',
    createdAt: new Date(Date.now() - 18000000).toISOString(), // 5 hours ago
    likes: 541,
    replies: 56,
    reposts: 132,
    views: 12450,
    liked: false,
    reposted: false,
    userId: '2'
  },
  {
    id: '3',
    user: {
      id: '3',
      name: 'Alex Johnson',
      username: 'alexj',
      avatar: 'https://i.pravatar.cc/150?img=3',
      verified: false,
      following: 123,
      followers: 456
    },
    content: 'Just finished reading this amazing article on web development trends for 2023. Highly recommend checking it out! #webdev #coding',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    likes: 32,
    replies: 8,
    reposts: 4,
    views: 421,
    liked: false,
    reposted: false,
    userId: '3'
  }
];

// Sample comments
export const comments: Comment[] = [
  {
    id: '1',
    content: 'Great post! I totally agree with your points.',
    createdAt: '2023-10-12T15:10:00Z',
    userId: '2',
    postId: '1',
    likes: 5,
    user: users.find(user => user.id === '2')
  },
  {
    id: '2',
    content: 'Thanks for sharing this. Very insightful!',
    createdAt: '2023-10-12T15:30:00Z',
    userId: '3',
    postId: '1',
    likes: 3,
    user: users.find(user => user.id === '3')
  },
  {
    id: '3',
    content: 'I have a different perspective on this topic...',
    createdAt: '2023-10-12T16:05:00Z',
    userId: '4',
    postId: '1',
    likes: 2,
    user: users.find(user => user.id === '4')
  },
  {
    id: '4',
    content: 'Looking forward to the next update!',
    createdAt: '2023-10-12T16:45:00Z',
    userId: '5',
    postId: '1',
    likes: 7,
    user: users.find(user => user.id === '5')
  },
  {
    id: '5',
    content: 'Can you elaborate more on this?',
    createdAt: '2023-10-12T13:20:00Z',
    userId: '1',
    postId: '3',
    likes: 4,
    user: users.find(user => user.id === '1')
  },
  {
    id: '6',
    content: 'I completely agree with your approach.',
    createdAt: '2023-10-12T14:15:00Z',
    userId: '2',
    postId: '3',
    likes: 6,
    user: users.find(user => user.id === '2')
  }
];

// Helper function to get user by ID
export const getUserById = (id: string): User | undefined => {
  return users.find(user => user.id === id);
};

// Helper function to get posts by user ID
export const getPostsByUserId = (userId: string): Post[] => {
  return posts.filter(post => post.userId === userId);
};

// Helper function to get comments by post ID
export const getCommentsByPostId = (postId: string): Comment[] => {
  return comments.filter(comment => comment.postId === postId);
};

// Helper function to get post by ID
export const getPostById = (id: string): Post | undefined => {
  return posts.find(post => post.id === id);
};

// Helper function to format date
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d`;
  }
  
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
};
