import { getAuthToken } from './auth';

const API_BASE = '';

export interface Video {
  id: number;
  user_id: number;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration: string;
  category: string;
  views: number;
  real_views: number;
  channel_name: string;
  channel_avatar: string;
  subscribers: number;
  created_at: string;
}

export const getVideos = async (params?: { user_id?: number; category?: string; search?: string }): Promise<Video[]> => {
  const storedVideos = localStorage.getItem('videos');
  if (storedVideos) {
    let videos = JSON.parse(storedVideos);
    
    if (params?.category && params.category !== 'Все') {
      videos = videos.filter((v: Video) => v.category === params.category);
    }
    
    if (params?.search) {
      const search = params.search.toLowerCase();
      videos = videos.filter((v: Video) => 
        v.title.toLowerCase().includes(search) ||
        v.channel_name.toLowerCase().includes(search) ||
        v.category.toLowerCase().includes(search)
      );
    }
    
    if (params?.user_id) {
      videos = videos.filter((v: Video) => v.user_id === params.user_id);
    }
    
    return videos;
  }
  return [];
};

export const uploadVideo = async (data: {
  user_id: number;
  title: string;
  description: string;
  category: string;
  video_file: File;
  thumbnail_file?: File;
}): Promise<Video> => {
  const videoBase64 = await fileToBase64(data.video_file);
  const thumbnailBase64 = data.thumbnail_file ? await fileToBase64(data.thumbnail_file) : '';
  
  const newVideo: Video = {
    id: Date.now(),
    user_id: data.user_id,
    title: data.title,
    description: data.description,
    video_url: URL.createObjectURL(data.video_file),
    thumbnail_url: data.thumbnail_file ? URL.createObjectURL(data.thumbnail_file) : generateThumbnail(),
    duration: '0:00',
    category: data.category,
    views: 100,
    real_views: 0,
    channel_name: 'Мой канал',
    channel_avatar: '',
    subscribers: 0,
    created_at: new Date().toISOString()
  };
  
  const storedVideos = localStorage.getItem('videos');
  const videos = storedVideos ? JSON.parse(storedVideos) : [];
  videos.unshift(newVideo);
  localStorage.setItem('videos', JSON.stringify(videos));
  
  return newVideo;
};

export const viewVideo = async (video_id: number, user_id?: number): Promise<{ views: number; real_views: number }> => {
  const storedVideos = localStorage.getItem('videos');
  if (storedVideos) {
    const videos = JSON.parse(storedVideos);
    const videoIndex = videos.findIndex((v: Video) => v.id === video_id);
    
    if (videoIndex !== -1) {
      const video = videos[videoIndex];
      const oldViews = video.views;
      
      video.real_views += 1;
      video.views += 10;
      
      if (video.views >= 1000 && oldViews < 1000) {
        video.subscribers += 100;
      } else if (video.views >= 5000 && oldViews < 5000) {
        video.subscribers += 500;
      } else if (video.views >= 10000 && oldViews < 10000) {
        video.subscribers += 1000;
      }
      
      videos[videoIndex] = video;
      localStorage.setItem('videos', JSON.stringify(videos));
      
      return { views: video.views, real_views: video.real_views };
    }
  }
  
  return { views: 0, real_views: 0 };
};

export const updateProfile = async (user_id: number, data: { channel_name: string; avatar_file?: File }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (data.channel_name) {
    user.channel_name = data.channel_name;
  }
  
  if (data.avatar_file) {
    user.avatar_url = URL.createObjectURL(data.avatar_file);
  }
  
  localStorage.setItem('user', JSON.stringify(user));
  return user;
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
};

const generateThumbnail = (): string => {
  const colors = ['#8B5CF6', '#D946EF', '#F97316', '#0EA5E9', '#10B981'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="450" fill="${randomColor}"/>
      <circle cx="400" cy="225" r="60" fill="white" opacity="0.8"/>
      <polygon points="380,205 380,245 420,225" fill="${randomColor}"/>
    </svg>
  `)}`;
};
