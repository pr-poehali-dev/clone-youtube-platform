import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { getStoredUser, loginWithGoogle, loginWithYandex, logout, User } from '@/lib/auth';
import { getVideos, uploadVideo, viewVideo, updateProfile, Video } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const categories = ['Все', 'Технологии', 'Дизайн', 'Обучение', 'Бизнес', 'Развлечения'];

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Все');
  const [videos, setVideos] = useState<Video[]>([]);
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    loadVideos();
  }, []);

  const loadVideos = async () => {
    const allVideos = await getVideos();
    setVideos(allVideos);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      setIsSearching(true);
      const results = await getVideos({ search: query });
      setSearchResults(results);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const videoFile = formData.get('video') as File;
    const thumbnailFile = formData.get('thumbnail') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;

    if (!videoFile || !title) {
      toast({ title: 'Ошибка', description: 'Заполните обязательные поля', variant: 'destructive' });
      return;
    }

    try {
      await uploadVideo({
        user_id: user.id,
        title,
        description,
        category,
        video_file: videoFile,
        thumbnail_file: thumbnailFile
      });

      toast({ title: 'Успешно!', description: 'Видео загружено и начнёт набирать просмотры!' });
      setShowUploadDialog(false);
      loadVideos();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить видео', variant: 'destructive' });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);
    const channelName = formData.get('channel_name') as string;
    const avatarFile = formData.get('avatar') as File;

    try {
      const updatedUser = await updateProfile(user.id, {
        channel_name: channelName,
        avatar_file: avatarFile?.size > 0 ? avatarFile : undefined
      });

      setUser(updatedUser);
      toast({ title: 'Успешно!', description: 'Профиль обновлён' });
      setShowProfileDialog(false);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить профиль', variant: 'destructive' });
    }
  };

  const filteredVideos = activeCategory === 'Все' 
    ? videos 
    : videos.filter(v => v.category === activeCategory);

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary via-secondary to-accent rounded-lg flex items-center justify-center">
                <Icon name="Play" size={24} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold gradient-text hidden sm:block">VideoHub</h1>
            </div>
          </div>

          <div className="flex-1 max-w-2xl relative">
            <Input
              type="text"
              placeholder="Поиск видео, каналов, плейлистов..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 bg-muted/50 border-border focus:border-primary transition-colors"
            />
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            
            {isSearching && searchResults.length > 0 && (
              <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto animate-fade-in">
                <div className="p-2">
                  {searchResults.map((result, idx) => (
                    <div key={idx} className="p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors flex items-center gap-3">
                      <img src={result.thumbnail_url} alt="" className="w-32 h-20 object-cover rounded" />
                      <div>
                        <p className="font-medium text-sm">{result.title}</p>
                        <p className="text-xs text-muted-foreground">{result.channel_name} • {formatViews(result.views)} просмотров</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {user ? (
            <>
              <Button variant="ghost" size="icon" onClick={() => setShowUploadDialog(true)}>
                <Icon name="Upload" size={22} />
              </Button>
              <Button variant="ghost" size="icon">
                <Icon name="Bell" size={22} />
              </Button>
              <Avatar className="w-9 h-9 cursor-pointer border-2 border-primary" onClick={() => setActiveTab('profile')}>
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                  {user.name[0]}
                </AvatarFallback>
              </Avatar>
            </>
          ) : (
            <Button onClick={() => setShowAuthDialog(true)} className="bg-gradient-to-r from-primary to-secondary">
              Войти
            </Button>
          )}
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 border-r border-border sticky top-16 h-[calc(100vh-4rem)] hidden lg:block">
          <nav className="p-3 space-y-1">
            {[
              { id: 'home', icon: 'Home', label: 'Главная' },
              { id: 'videos', icon: 'Video', label: 'Видео' },
              { id: 'history', icon: 'History', label: 'История' },
              { id: 'upload', icon: 'Upload', label: 'Загрузка' },
              { id: 'profile', icon: 'User', label: 'Профиль' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  if (!user && (item.id === 'upload' || item.id === 'profile' || item.id === 'history')) {
                    setShowAuthDialog(true);
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === item.id
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'hover:bg-muted/50 text-foreground'
                }`}
              >
                <Icon name={item.icon as any} size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {user && (
            <div className="p-3 mt-6 border-t border-border">
              <Button variant="ghost" onClick={logout} className="w-full justify-start text-muted-foreground">
                <Icon name="LogOut" size={20} className="mr-3" />
                Выйти
              </Button>
            </div>
          )}
        </aside>

        <main className="flex-1">
          {activeTab === 'home' && (
            <div className="p-6 space-y-6">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={activeCategory === cat ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setActiveCategory(cat)}
                    className="whitespace-nowrap"
                  >
                    {cat}
                  </Button>
                ))}
              </div>

              {filteredVideos.length === 0 ? (
                <Card className="p-12 text-center">
                  <Icon name="Video" size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Видео пока нет</h3>
                  <p className="text-muted-foreground mb-4">Станьте первым, кто загрузит видео!</p>
                  <Button onClick={() => user ? setShowUploadDialog(true) : setShowAuthDialog(true)} className="bg-gradient-to-r from-primary to-secondary">
                    Загрузить видео
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVideos.map((video, idx) => (
                    <Card key={video.id} className="group overflow-hidden hover-scale cursor-pointer animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}
                      onClick={() => viewVideo(video.id, user?.id).then(loadVideos)}>
                      <div className="relative overflow-hidden">
                        <img 
                          src={video.thumbnail_url} 
                          alt={video.title}
                          className="w-full aspect-video object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {video.duration || '0:00'}
                        </div>
                        <Badge className="absolute top-2 left-2 bg-primary">{video.category}</Badge>
                      </div>
                      <div className="p-4">
                        <div className="flex gap-3">
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarImage src={video.channel_avatar} />
                            <AvatarFallback>{video.channel_name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                              {video.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">{video.channel_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatViews(video.views)} просмотров
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="p-6 flex items-center justify-center min-h-[60vh]">
              <Card className="p-12 max-w-lg text-center animate-scale-in">
                <div className="w-24 h-24 bg-gradient-to-br from-primary via-secondary to-accent rounded-full flex items-center justify-center mx-auto mb-6">
                  <Icon name="Upload" size={40} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-3">Загрузить видео</h2>
                <p className="text-muted-foreground mb-6">
                  Поделитесь своим контентом с миллионами зрителей по всему миру
                </p>
                <Button size="lg" onClick={() => user ? setShowUploadDialog(true) : setShowAuthDialog(true)} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                  Выбрать файл
                </Button>
              </Card>
            </div>
          )}

          {activeTab === 'profile' && user && (
            <div className="p-6 space-y-6">
              <Card className="p-8 animate-scale-in">
                <div className="flex items-start gap-6 mb-6">
                  <Avatar className="w-24 h-24 border-4 border-primary">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-secondary text-white">
                      {user.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{user.channel_name}</h2>
                    <p className="text-muted-foreground mb-4">@{user.email.split('@')[0]} • {user.subscribers} подписчиков</p>
                    <div className="flex gap-3">
                      <Button onClick={() => setShowProfileDialog(true)} className="bg-gradient-to-r from-primary to-secondary">
                        Настроить канал
                      </Button>
                      <Button variant="outline" onClick={() => setActiveTab('videos')}>
                        Управление видео
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border">
                  <div className="text-center">
                    <p className="text-3xl font-bold gradient-text mb-1">{videos.filter(v => v.user_id === user.id).length}</p>
                    <p className="text-sm text-muted-foreground">Видео</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold gradient-text mb-1">
                      {formatViews(videos.filter(v => v.user_id === user.id).reduce((sum, v) => sum + v.views, 0))}
                    </p>
                    <p className="text-sm text-muted-foreground">Просмотры</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold gradient-text mb-1">{user.subscribers}</p>
                    <p className="text-sm text-muted-foreground">Подписчики</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Войти в VideoHub</DialogTitle>
            <DialogDescription>Выберите способ авторизации</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button onClick={loginWithGoogle} className="w-full" variant="outline">
              <Icon name="Globe" size={20} className="mr-2" />
              Войти через Google
            </Button>
            <Button onClick={loginWithYandex} className="w-full" variant="outline">
              <Icon name="Globe" size={20} className="mr-2" />
              Войти через Яндекс
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Загрузить видео</DialogTitle>
            <DialogDescription>Заполните информацию о видео</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label htmlFor="video">Видео файл *</Label>
              <Input id="video" name="video" type="file" accept="video/*" required />
            </div>
            <div>
              <Label htmlFor="thumbnail">Обложка (опционально)</Label>
              <Input id="thumbnail" name="thumbnail" type="file" accept="image/*" />
            </div>
            <div>
              <Label htmlFor="title">Название *</Label>
              <Input id="title" name="title" placeholder="Введите название видео" required />
            </div>
            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea id="description" name="description" placeholder="Расскажите о видео..." rows={3} />
            </div>
            <div>
              <Label htmlFor="category">Категория</Label>
              <select id="category" name="category" className="w-full p-2 rounded-lg bg-muted border border-border">
                {categories.filter(c => c !== 'Все').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary">
              Загрузить
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Настроить канал</DialogTitle>
            <DialogDescription>Измените название канала и аватар</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <Label htmlFor="channel_name">Название канала</Label>
              <Input id="channel_name" name="channel_name" defaultValue={user?.channel_name} required />
            </div>
            <div>
              <Label htmlFor="avatar">Аватар канала</Label>
              <Input id="avatar" name="avatar" type="file" accept="image/*" />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary">
              Сохранить
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
