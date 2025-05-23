// Development URLs
const DEV_API_URL = 'http://localhost:3000/api';
const DEV_WS_URL = 'ws://localhost:3000';

// Production URLs
const PROD_API_URL = 'https://api.curiotube.com/api';
const PROD_WS_URL = 'wss://api.curiotube.com';

// Determine if we're in development or production
const isDevelopment = __DEV__;

export const API_URL = isDevelopment ? DEV_API_URL : PROD_API_URL;
export const WS_URL = isDevelopment ? DEV_WS_URL : PROD_WS_URL;

// API Endpoints
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY: '/auth/verify',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  USER: {
    PROFILE: '/user/profile',
    UPDATE: '/user/update',
    INTERESTS: '/user/interests',
  },
  CONTENT: {
    FEED: '/content/feed',
    UPLOAD: '/content/upload',
    LIKE: '/content/like',
    COMMENT: '/content/comment',
  },
}; 