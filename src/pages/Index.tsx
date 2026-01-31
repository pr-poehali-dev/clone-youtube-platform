import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';

const mockVideos = [
  {
    id: 1,
    title: 'Как создать современный веб-сайт за 10 минут',
    channel: 'WebDev Pro',
    views: '1.2M',
    uploaded: '2 дня назад',
    duration: '15:23',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop',
    category: 'Технологии'
  },
  {
    id: 2,
    title: 'Топ 10 трендов дизайна 2024',
    channel: 'Design Masters',
    views: '856K',
    uploaded: '1 неделю назад',
    duration: '22:45',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450&fit=crop',
    category: 'Дизайн'
  },
  {
    id: 3,
    title: 'Программирование для начинающих',
    channel: 'CodeAcademy',
    views: '2.3M',
    uploaded: '3 недели назад',
    duration: '45:12',
    thumbnail: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&h=450&fit=crop',
    category: 'Обучение'
  },
  {
    id: 4,
    title: 'React vs Vue: что выбрать в 2024?',
    channel: 'Tech Talk',
    views: '534K',
    uploaded: '5 дней назад',
    duration: '18:30',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop',
    category: 'Технологии'
  },
  {
    id: 5,
    title: 'UI/UX дизайн: полное руководство',
    channel: 'Design School',
    views: '678K',
    uploaded: '1 месяц назад',
    duration: '32:15',
    thumbnail: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800&h=450&fit=crop',
    category: 'Дизайн'
  },
  {
    id: 6,
    title: 'Как монетизировать свой канал',
    channel: 'Creator Tips',
    views: '423K',
    uploaded: '2 недели назад',
    duration: '12:08',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=450&fit=crop',
    category: 'Бизнес'
  }
];

const mockChannels = [
  { name: 'WebDev Pro', subscribers: '2.5M', avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=webdev' },
  { name: 'Design Masters', subscribers: '1.8M', avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=design' },
  { name: 'CodeAcademy', subscribers: '3.2M', avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=code' },
];

const categories = ['Все', 'Технологии', 'Дизайн', 'Обучение', 'Бизнес', 'Развлечения'];

export default function Index() {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Все');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      setIsSearching(true);
      const videoResults = mockVideos.filter(v => 
        v.title.toLowerCase().includes(query.toLowerCase()) ||
        v.channel.toLowerCase().includes(query.toLowerCase()) ||
        v.category.toLowerCase().includes(query.toLowerCase())
      );
      const channelResults = mockChannels.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults([...videoResults, ...channelResults]);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  const filteredVideos = activeCategory === 'Все' 
    ? mockVideos 
    : mockVideos.filter(v => v.category === activeCategory);

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
                      {result.thumbnail ? (
                        <>
                          <img src={result.thumbnail} alt="" className="w-32 h-20 object-cover rounded" />
                          <div>
                            <p className="font-medium text-sm">{result.title}</p>
                            <p className="text-xs text-muted-foreground">{result.channel} • {result.views} просмотров</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={result.avatar} />
                            <AvatarFallback>{result.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{result.name}</p>
                            <p className="text-xs text-muted-foreground">{result.subscribers} подписчиков</p>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <Button variant="ghost" size="icon">
            <Icon name="Upload" size={22} />
          </Button>
          <Button variant="ghost" size="icon">
            <Icon name="Bell" size={22} />
          </Button>
          <Avatar className="w-9 h-9 cursor-pointer border-2 border-primary">
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">Я</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 border-r border-border sticky top-16 h-[calc(100vh-4rem)] hidden lg:block">
          <nav className="p-3 space-y-1">
            {[
              { id: 'home', icon: 'Home', label: 'Главная' },
              { id: 'videos', icon: 'Video', label: 'Видео' },
              { id: 'channels', icon: 'Users', label: 'Каналы' },
              { id: 'history', icon: 'History', label: 'История' },
              { id: 'upload', icon: 'Upload', label: 'Загрузка' },
              { id: 'profile', icon: 'User', label: 'Профиль' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
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

          <div className="p-3 mt-6 border-t border-border">
            <h3 className="text-sm font-semibold text-muted-foreground px-4 mb-2">ПОДПИСКИ</h3>
            {mockChannels.map((channel, idx) => (
              <div key={idx} className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={channel.avatar} />
                  <AvatarFallback>{channel.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{channel.name}</span>
              </div>
            ))}
          </div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVideos.map((video, idx) => (
                  <Card key={video.id} className="group overflow-hidden hover-scale cursor-pointer animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="relative overflow-hidden">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-full aspect-video object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                        {video.duration}
                      </div>
                      <Badge className="absolute top-2 left-2 bg-primary">{video.category}</Badge>
                    </div>
                    <div className="p-4">
                      <div className="flex gap-3">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage src={`https://api.dicebear.com/7.x/shapes/svg?seed=${video.channel}`} />
                          <AvatarFallback>{video.channel[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                            {video.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">{video.channel}</p>
                          <p className="text-xs text-muted-foreground">
                            {video.views} просмотров • {video.uploaded}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'channels' && (
            <div className="p-6 space-y-6">
              <h2 className="text-3xl font-bold gradient-text">Рекомендуемые каналы</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockChannels.map((channel, idx) => (
                  <Card key={idx} className="p-6 text-center hover-scale animate-scale-in" style={{ animationDelay: `${idx * 100}ms` }}>
                    <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary">
                      <AvatarImage src={channel.avatar} />
                      <AvatarFallback className="text-2xl">{channel.name[0]}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-xl mb-1">{channel.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{channel.subscribers} подписчиков</p>
                    <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                      Подписаться
                    </Button>
                  </Card>
                ))}
              </div>
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
                <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                  Выбрать файл
                </Button>
              </Card>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="p-6 space-y-6">
              <h2 className="text-3xl font-bold gradient-text">История просмотров</h2>
              <div className="space-y-4">
                {mockVideos.slice(0, 4).map((video, idx) => (
                  <Card key={video.id} className="p-4 flex gap-4 hover-scale animate-fade-in cursor-pointer" style={{ animationDelay: `${idx * 50}ms` }}>
                    <img src={video.thumbnail} alt={video.title} className="w-48 aspect-video object-cover rounded" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors">{video.title}</h3>
                      <p className="text-sm text-muted-foreground mb-1">{video.channel}</p>
                      <p className="text-xs text-muted-foreground">{video.views} просмотров • {video.uploaded}</p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Icon name="X" size={18} />
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="p-6 space-y-6">
              <Card className="p-8 animate-scale-in">
                <div className="flex items-start gap-6 mb-6">
                  <Avatar className="w-24 h-24 border-4 border-primary">
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-secondary text-white">Я</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">Мой канал</h2>
                    <p className="text-muted-foreground mb-4">@myusername • 0 подписчиков</p>
                    <div className="flex gap-3">
                      <Button className="bg-gradient-to-r from-primary to-secondary">
                        Настроить канал
                      </Button>
                      <Button variant="outline">
                        Управление видео
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border">
                  <div className="text-center">
                    <p className="text-3xl font-bold gradient-text mb-1">0</p>
                    <p className="text-sm text-muted-foreground">Видео</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold gradient-text mb-1">0</p>
                    <p className="text-sm text-muted-foreground">Просмотры</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold gradient-text mb-1">0</p>
                    <p className="text-sm text-muted-foreground">Подписчики</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
