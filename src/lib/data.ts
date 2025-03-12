
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

// Helper function to get user by ID
export const getUserById = (id: string): User | undefined => {
  return users.find(user => user.id === id);
};

// Helper function to get posts by user ID
export const getPostsByUserId = (userId: string): Post[] => {
  return posts.filter(post => post.userId === userId);
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
