# PAF - Ticket Management System

## Project Structure

```
PAF12345/
├── backend/           # Spring Boot + MongoDB + OAuth2
├── frontend/          # React + Google OAuth
└── README.md
```

## Prerequisites

- Java 17+
- Node.js 18+
- MongoDB Atlas cluster (configured)
- Google OAuth2 credentials (configured)

## Quick Start

### 1. Backend

```powershell
cd backend
# Run with environment variables auto-loaded from .env.local
.\run-local.ps1
```

Backend runs on `http://localhost:8080`

### 2. Frontend

```powershell
cd frontend
npm install  # if not already done
npm start
```

Frontend runs on `http://localhost:3000`

## Configuration

### Backend (.env.local)

- `MONGODB_URI`: MongoDB Atlas connection string
- `MONGODB_DATABASE`: Database name (default: `pafdb`)
- `GOOGLE_CLIENT_ID`: Google OAuth2 client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth2 client secret
- `FRONTEND_URL`: Frontend URL for OAuth2 redirect (default: `http://localhost:3000`)
- `ADMIN_EMAILS`: Comma-separated list of admin email addresses
- `TECHNICIAN_EMAILS`: Comma-separated list of technician email addresses

### Frontend (.env.local)

- `REACT_APP_API_URL`: Backend API URL (default: `http://localhost:8080`)

## Module E: Authentication & Authorization

### Roles

- **USER**: All authenticated users
- **ADMIN**: Configured via `ADMIN_EMAILS`
- **TECHNICIAN**: Configured via `TECHNICIAN_EMAILS` (optional)

### Backend Endpoints

- `GET /api/auth/me` - Get current user info (public, requires OAuth session)
- `GET /api/user/ping` - Test USER access
- `GET /api/admin/ping` - Test ADMIN access
- `POST /logout` - Logout (clears session)

### Frontend Routes

- `/login` - OAuth2 login page
- `/` - Dashboard (protected, USER role)
- `/admin` - Admin area (protected, ADMIN role only)
- `/unauthorized` - 403 error page

## Development

### Backend Security Configuration

- OAuth2 flow with Google as provider
- Session-based authentication (JWT not used in this version)
- CORS enabled for frontend
- Role mapping by email address

### Frontend Auth Flow

1. Unauthenticated user → redirected to `/login`
2. Click "Continue with Google" → OAuth2 consent screen
3. Backend receives token, validates, assigns roles
4. Session stored as HTTP-only cookie
5. Redirect to `/` (dashboard)

## Testing

### Test Admin Access

1. Login with an admin email (from `ADMIN_EMAILS`)
2. Navigate to `/admin`
3. Should see "ADMIN access granted" message

### Test User Access

1. Login with any Google account
2. Navigate to `/`
3. Should see user info (name, email, roles)

## Security Notes

⚠️ **Important**: Before production deployment:

1. Rotate MongoDB password in Atlas
2. Create a new Google OAuth2 credential with proper redirect URIs
3. Use environment variables from secure configuration management (not hardcoded)
4. Enable HTTPS
5. Set strong session timeout values
6. Add rate limiting and request validation

## Troubleshooting

### Backend won't start

- Confirm `MONGODB_URI` is reachable
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set correctly
- Ensure port 8080 is available

### Frontend won't authenticate

- Confirm backend is running on the URL in `REACT_APP_API_URL`
- Check browser console for CORS errors
- Verify Google OAuth2 redirect URI includes `http://localhost:8080/oauth2/callback/google`

### "Unauthorized" page appears

- You are logged in but your role is not authorized for that page
- Ask your admin to add your email to the appropriate `*_EMAILS` config
