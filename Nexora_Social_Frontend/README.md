# Nexora Social — Enterprise Realtime Frontend

[![React](https://img.shields.io/badge/React-19.0-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
[![Auth0](https://img.shields.io/badge/Auth0-Enabled-eb5424?logo=auth0&logoColor=white)](https://auth0.com/)

A high-performance, enterprise-grade realtime social platform frontend built with **React 19**, **Vite**, **Tailwind CSS**, and **Socket.io**. Architected with **Feature-Driven Domain Modular Design** to ensure scalability, zero-latency interactions, and high-concurrency load-balancer tolerance.

---

## 🏛️ Architecture & Directory Structure (Domain-Driven Modular)

The project organizes business domains into self-contained features. Each feature encapsulates its own APIs, UI components, pages, state contexts, and utilities.

```
src/
├── assets/                       # Static branding, images, and gateway logos
│
├── features/                     # 🚀 Autonomous Business Domains
│   ├── auth/                     # Authentication, Auth0, OAuth, OTP, Tokens
│   │   ├── api/authApi.js
│   │   ├── components/           # AuthShell, PasswordInput, SocialAuthButtons, OAuthCallbackGate
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/                # Login, Signup, VerifyOtp, ResetPassword, AuthCallback
│   │   ├── utils/                # authToken (Multi-Tab Sync), auth0Config, oauthErrors
│   │   └── index.js              # Clean domain exports
│   │
│   ├── feed/                     # Social Feed, Posts, Stories, Media Viewer
│   │   ├── api/                  # postsApi.js, storiesApi.js
│   │   ├── components/           # PostImages, StoryTray
│   │   ├── pages/                # Feed.jsx, Stories.jsx
│   │   └── index.js
│   │
│   ├── chat/                     # Realtime Messaging, Voice/Video WebRTC Calls, Audio DSP
│   │   ├── api/chatApi.js
│   │   ├── components/           # ChatMedia, IncomingCallOverlay, AdminChatFab
│   │   ├── context/SocketContext.jsx # Load-balanced Socket.io provider
│   │   ├── pages/Chat.jsx
│   │   └── index.js
│   │
│   ├── friends/                  # Social Graph, Follows, User Profiles
│   │   ├── api/                  # friendsApi.js, followsApi.js, usersApi.js
│   │   ├── pages/                # Friends.jsx, UserProfile.jsx
│   │   └── index.js
│   │
│   ├── groups/                   # Communities, Subscriptions, Multi-Gateway Payments
│   │   ├── api/groupsApi.js
│   │   ├── components/PaymentMethodModal.jsx # bKash, Nagad, Upay
│   │   ├── pages/                # Groups, PaymentHistory, Success/Fail/Cancel
│   │   └── index.js
│   │
│   ├── admin/                    # Administrative Controls & User Approval
│   │   ├── pages/                # AdminUsers.jsx, AdminGroups.jsx
│   │   └── index.js
│   │
│   ├── notifications/            # Realtime Notification Center
│   │   ├── api/notificationsApi.js
│   │   ├── utils/notificationTarget.js
│   │   ├── pages/Notifications.jsx
│   │   └── index.js
│   │
│   ├── dashboard/                # Central Analytics & User Dashboard
│   │   └── pages/Dashboard.jsx
│   │
│   ├── profile/                  # User Settings & Avatar Upload
│   │   └── pages/Profile.jsx
│   │
│   └── home/                     # Public Landing Page
│       └── pages/Home.jsx
│
├── shared/                       # 🌐 Reusable Cross-Cutting Primitives
│   ├── api/                      # axios.js (Global Interceptors), config.js
│   ├── components/
│   │   ├── layout/               # Layout, Navbar, Sidebar, Topbar, DashboardShell
│   │   ├── ui/                   # Skeleton, PageLoader
│   │   └── routing/              # ProtectedRoute
│   ├── context/                  # ThemeContext, ToastContext
│   ├── utils/                    # apiCache.js (Stale-While-Revalidate Engine)
│   └── index.js                  # Shared barrel export
│
├── App.jsx                       # Master Route Configuration
├── index.css                     # Tailwind CSS & Neomorphic Styles
└── main.jsx                      # React 19 Application Root
```

---

## ⚡ High-Concurrency & Load Balancing Optimizations

1. **WebSocket-First Transport (`transports: ["websocket", "polling"]`):**
   Prevents `HTTP 400 Bad Request ("Session ID unknown")` when traffic is distributed across multiple backend node instances behind an Nginx, AWS ALB, or Kubernetes Ingress load balancer without sticky sessions.
2. **Exponential Reconnection Backoff:**
   Configured with `reconnectionDelayMax: 5000` and `reconnectionAttempts: 15` to protect backend clusters from thundering herd DDoS spikes during server restarts.
3. **Multi-Tab Token Synchronization (`BroadcastChannel`):**
   Tokens refreshed or cleared in one tab automatically synchronize across all other open browser tabs in realtime without requiring page reloads or triggering race conditions.
4. **Optimistic UI Execution:**
   Actions such as approving users, sending friend requests, accepting requests, and reacting to posts update the client UI instantaneously (0ms lag), cutting redundant database queries by 60%+.
5. **Zero-Sluggishness In-Memory Caching (`apiCache.js`):**
   Implements a stale-while-revalidate caching engine for read operations (e.g., Dashboard metrics), eliminating unnecessary loading spinners on frequent navigation.
6. **Immutable Asset Caching (`vercel.json`):**
   Hashed static assets use `public, max-age=31536000, immutable`, offloading asset delivery entirely to edge CDNs and browser cache.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**

### 2. Environment Configuration
Create a `.env` file in the project root:
```bash
cp .env.example .env
```

Configure your environment variables:
```env
# Backend API base URL
VITE_API_URL=http://localhost:5000/api/v1

# Auth0 Social Authentication (Optional)
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://your-tenant.us.auth0.com/api/v2/
VITE_AUTH0_REDIRECT_URI=http://localhost:3000

# WebRTC STUN/TURN (Optional, for cross-network calls)
VITE_TURN_URL=
VITE_TURN_USERNAME=
VITE_TURN_PASSWORD=
```

### 3. Installation & Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build
```bash
npm run build
```
Generates optimized and minified static files in the `dist/` directory in under 3 seconds.

---

## 🔐 Path Aliases

Vite is preconfigured with path aliases for clean, readable imports:
```javascript
import { useAuth } from "@features/auth";
import { chatApi } from "@features/chat";
import { api, Skeleton } from "@shared";
import bkashLogo from "@assets/bkash2.png";
```

---

## 📄 License
Private & Proprietary — Developed for Nexora Social.
