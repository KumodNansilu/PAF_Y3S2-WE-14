# Startup Guide - Module E: Authentication & Authorization

## Environment Setup Complete

All environment variables are configured in local files:

### Backend Configuration
**File**: `backend/.env.local`

```
MONGODB_URI=mongodb+srv://admin_db_user:NcFoUyWyGTXZ5SRY@cluster0.r3swvct.mongodb.net/
MONGODB_DATABASE=pafdb
GOOGLE_CLIENT_ID=244293867725-59okt0fcbrqbm4chaj9rg889ab9sqgiq.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
FRONTEND_URL=http://localhost:3000
ADMIN_EMAILS=kumodnansilus@gmail.con
TECHNICIAN_EMAILS=dsandamali47@gmail.com
```

### Frontend Configuration
**File**: `frontend/.env.local`

```
REACT_APP_API_URL=http://localhost:8080
```

---

## How to Run

### Step 1: Start Backend

Open PowerShell in the project root and navigate to backend:

```powershell
cd backend
.\run-local.ps1
```

**What happens:**
1. Script loads all variables from `.env.local`
2. Spring Boot starts with OAuth2 and role-based security enabled
3. MongoDB connection is established
4. API is ready at `http://localhost:8080`

**Expected output:**
```
Tomcat started on port 8080 (http)
Started BackendApplication in X seconds
```

### Step 2: Start Frontend

Open a second PowerShell window:

```powershell
cd frontend
npm start
```

**What happens:**
1. React development server starts
2. Frontend is available at `http://localhost:3000`
3. Redirects unauthenticated users to `/login`

**Expected output:**
```
Compiled successfully!

You can now view frontend in the browser.
```

---

## Testing the Auth Flow

### 1. Login with Admin Email

1. Open `http://localhost:3000` in your browser
2. You'll be redirected to `/login`
3. Click **"Continue with Google"**
4. Sign in with `kumodnansilus@gmail.con`
5. Grant permissions
6. You'll be redirected to `/` (Dashboard)
7. You should see your user info with roles: `ROLE_USER, ROLE_ADMIN`
8. The `/admin` link will be available and clickable

### 2. Login with Technician Email

1. Repeat steps 1-3 above
2. Sign in with `dsandamali47@gmail.com`
3. You'll see roles: `ROLE_USER, ROLE_TECHNICIAN`
4. The `/admin` link will show "Unauthorized" (403) if you try to access it

### 3. Test Admin Endpoint

After logging in as admin, you can test the protected endpoint:

```powershell
$headers = @{
    "Cookie" = "JSESSIONID=<your_session_id>"
}
Invoke-WebRequest -Uri "http://localhost:8080/api/admin/ping" -Headers $headers
```

Or in browser DevTools console:

```javascript
fetch('http://localhost:8080/api/admin/ping', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

---

## Module E Implementation Summary

✅ **OAuth 2.0 Login**: Google OAuth2 integrated
✅ **Role-based Access**: USER, ADMIN, TECHNICIAN roles
✅ **Protected API Endpoints**: `/api/admin/**` and `/api/user/**`
✅ **Protected Frontend Routes**: Dashboard, Admin area with role checks
✅ **Session Management**: HTTP-only cookies, secure session handling

---

## Troubleshooting

### Issue: "Invalid client id" or OAuth error

**Solution:**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`
- Check that the OAuth2 credentials are for the correct Google project
- Ensure redirect URI `http://localhost:8080/oauth2/callback/google` is authorized in Google Console

### Issue: "Unauthorized" appears even after login

**Solution:**
- Check that your email is in one of the `*_EMAILS` configs in `.env.local`
- Your email must match exactly (case-insensitive)
- Restart backend after updating `.env.local`

### Issue: Cannot connect to MongoDB

**Solution:**
- Verify `MONGODB_URI` is correct in `.env.local`
- Check MongoDB Atlas IP whitelist includes your machine
- Confirm network connectivity to the Atlas cluster

### Issue: CORS errors in browser console

**Solution:**
- Ensure `FRONTEND_URL` in backend `.env.local` matches your frontend URL
- Ensure `REACT_APP_API_URL` in frontend `.env.local` matches your backend URL

---

## Next Steps

1. Run both services
2. Test the OAuth flow with your configured email addresses
3. Verify roles are assigned correctly
4. Implement business logic in protected endpoints
5. Add rate limiting and additional security measures before production

Enjoy Module E authentication! 🎉
