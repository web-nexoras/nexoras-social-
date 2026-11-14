# Nexora Social

**Nexora Social** is a full-stack social networking application with a React and Vite frontend and a Node.js/Express API. It brings together social posts and stories, friendships, group communities, real-time chat, notifications, and subscription payments in one product.

> This repository contains two separately installed applications: the frontend in `Nexora_Social_Frontend/` and the backend in `Nexoras_social_backend-/`.

## Highlights

- **Accounts and profiles:** email sign-up with OTP verification, sign-in, password recovery, profile updates, and optional Auth0 social sign-in.
- **Social feed:** create and browse posts, comment, react, save, share, and explore posts by hashtag; publish stories and view, like, or comment on them.
- **Friends and follows:** find people, manage friend requests, see friend suggestions, and follow users.
- **Groups and subscriptions:** create and manage groups, add members, and manage subscriptions with SSLCommerz payment flows.
- **Real-time communication:** direct and group conversations, message reactions, read status, media uploads, notifications, and Socket.IO events. The interface also includes voice/video call features.
- **Administration:** manage users, approvals, groups, and subscriptions through admin-facing screens and API actions.
- **Supporting services:** MongoDB persistence, optional Redis-backed features, Cloudinary media storage, and interactive Swagger API documentation.

## Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, Vite 5, React Router, Tailwind CSS, Axios, Socket.IO Client |
| Backend | Node.js, Express 4, Socket.IO, Mongoose |
| Data and services | MongoDB, optional Redis, Cloudinary, Brevo email, SSLCommerz |
| Authentication | JWT-based API sessions; optional Auth0 social sign-in |

## Repository layout

```text
.
├── Nexora_Social_Frontend/   # React application (Vite)
├── Nexoras_social_backend-/  # Express API and Socket.IO server
└── README.md
```

The frontend source is grouped by product area under `Nexora_Social_Frontend/src/features/` (auth, feed, chat, friends, groups, admin, notifications, and more). Shared API setup, layout components, contexts, and utilities live under `src/shared/`. The backend separates routes, controllers, models, services, middleware, and configuration into their own directories.

## Prerequisites

- Node.js 18 or newer and npm
- MongoDB, local or hosted
- Optional service accounts for Redis, Cloudinary, Brevo, Auth0, and SSLCommerz, depending on which features you want to enable

## Run locally

Open **two terminals** from the repository root. Configure and start the backend first, then the frontend.

### 1. Configure the backend

```powershell
cd Nexoras_social_backend-
Copy-Item .env.example .env
npm install
```

Edit `Nexoras_social_backend-/.env`. At minimum, set a reachable `DB_URL` and unique, long random values for `JWT_SEC` and `JWT_REFRESH_SEC`. Set `PORT=5000` and `CLIENT_URL=http://localhost:3000` for the local defaults. Add the credentials for the integrations you plan to use.

Start the API:

```powershell
npm run dev
```

The backend listens on `http://localhost:5000` by default. Its API base path is `/api/v1`.

### 2. Configure the frontend

In the second terminal, from the repository root:

```powershell
cd Nexora_Social_Frontend
Copy-Item .env.example .env
npm install
npm run dev
```

The frontend is served at **http://localhost:3000**. Its `.env.example` points `VITE_API_URL` at the local backend (`http://localhost:5000/api/v1`). Vite also proxies API and Socket.IO traffic to the backend in local development.

### 3. Open the API docs

With the backend running, visit **http://localhost:5000/api-docs** for the Swagger UI. The API root is **http://localhost:5000/** and the health endpoint is **http://localhost:5000/health**.

## Environment variables

Environment files are kept separately for each app. Start from the supplied examples; never commit real credentials.

### Backend (`Nexoras_social_backend-/.env`)

| Variable | Purpose |
| --- | --- |
| `PORT` | API and Socket.IO port; defaults to `8000` in code. The example uses `5000`. |
| `BASE_URL` | API route prefix; defaults to `/api/v1`. |
| `DB_URL` | MongoDB connection string. Required to start the server. |
| `JWT_SEC`, `JWT_REFRESH_SEC` | Access and refresh token signing secrets. Use different, strong values. |
| `CLIENT_URL` | Allowed frontend origin for CORS, such as `http://localhost:3000`. |
| `CLOUD_NAME`, `API_KEY`, `API_SECRET` | Cloudinary media credentials. |
| `REDIS_ENABLED`, `REDIS_URL` | Enable and configure optional Redis features. |
| `BREVO_API_KEY`, `MAIL_FROM` | Email delivery for verification and password recovery. |
| `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_AUDIENCE` | Auth0 integration settings where needed. |
| `SSL_STORE_ID`, `SSL_STORE_PASSWORD`, `SSL_IS_LIVE`, `SSL_SUCCESS_URL`, `SSL_FAIL_URL`, `SSL_CANCEL_URL` | SSLCommerz subscription payment configuration. |

The backend `.env.example` documents additional options, including token lifetimes and SMTP settings. Redis is optional; set `REDIS_ENABLED=true` only when Redis is configured and available.

### Frontend (`Nexora_Social_Frontend/.env`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API base URL, e.g. `http://localhost:5000/api/v1`. |
| `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID` | Optional Auth0 social login. Register the frontend origin with the Auth0 application. |
| `VITE_TURN_URL`, `VITE_TURN_USERNAME`, `VITE_TURN_PASSWORD` | Optional TURN server credentials for calls across restrictive networks. |

Vite exposes `VITE_*` values in the browser bundle. Do not put private keys or server secrets in frontend environment variables.

## Available commands

Run these from the corresponding app directory:

| App | Command | Description |
| --- | --- | --- |
| Backend | `npm run dev` | Start the API with Node's watch mode. |
| Backend | `npm start` | Start the API normally. |
| Frontend | `npm run dev` | Start the Vite development server on port 3000. |
| Frontend | `npm run build` | Build the frontend into `dist/`. |
| Frontend | `npm run preview` | Preview the production build locally. |

## API route groups

Routes are mounted below `/api/v1` by default:

| Prefix | Area |
| --- | --- |
| `/api/v1` | Authentication |
| `/api/v1/friends` | Friends and friend requests |
| `/api/v1/chat` | Conversations and messaging |
| `/api/v1/groups` | Groups and memberships |
| `/api/v1/payments` | Subscriptions and payments |
| `/api/v1/users` | User and admin management |
| `/api/v1/posts` | Posts, comments, reactions, and feed |
| `/api/v1/stories` | Stories |
| `/api/v1/follows` | Follows |
| `/api/v1/notifications` | Notifications |

See the Swagger UI at `/api-docs` for the available operations and request schemas.

## Deployment notes

- Deploy the frontend and backend as separate services and set `VITE_API_URL` to the deployed API base URL.
- Set `CLIENT_URL` to the exact frontend origin accepted by the backend CORS configuration.
- Configure the same Auth0 callback/origin settings in the Auth0 dashboard when enabling social sign-in.
- Configure payment return URLs, email delivery, media storage, and Redis as needed for your deployment.
- Keep secrets in your hosting provider's environment configuration. Do not commit `.env` files or production credentials.

## License

No license has been specified in this repository. All rights are reserved unless the project owners state otherwise.
