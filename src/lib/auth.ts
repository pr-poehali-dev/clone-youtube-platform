export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url: string;
  channel_name: string;
  subscribers: number;
}

const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
const YANDEX_CLIENT_ID = 'YOUR_YANDEX_CLIENT_ID';

export const getStoredUser = (): User | null => {
  const userJson = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  if (userJson && token) {
    return JSON.parse(userJson);
  }
  return null;
};

export const saveUser = (user: User, token: string) => {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
};

export const clearUser = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

export const loginWithGoogle = () => {
  alert('OAuth Google: Добавьте GOOGLE_CLIENT_ID в секреты проекта для полной интеграции. Пока используется демо-режим.');
  
  const demoUser: User = {
    id: 1,
    email: 'demo@google.com',
    name: 'Demo User',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=google',
    channel_name: 'Мой канал',
    subscribers: 0
  };
  
  saveUser(demoUser, 'demo_token_' + Date.now());
  window.location.reload();
};

export const loginWithYandex = () => {
  alert('OAuth Яндекс: Добавьте YANDEX_CLIENT_ID в секреты проекта для полной интеграции. Пока используется демо-режим.');
  
  const demoUser: User = {
    id: 2,
    email: 'demo@yandex.ru',
    name: 'Демо Пользователь',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yandex',
    channel_name: 'Мой канал',
    subscribers: 0
  };
  
  saveUser(demoUser, 'demo_token_' + Date.now());
  window.location.reload();
};

export const logout = () => {
  clearUser();
  window.location.reload();
};
