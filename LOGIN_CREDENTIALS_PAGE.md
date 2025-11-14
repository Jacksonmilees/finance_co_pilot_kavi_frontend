# Login Credentials Page - Quick Reference

## 🎯 Overview

A dedicated page for viewing and copying login credentials during development and demo phases.

**URL:** `/credentials`

**Access:** Available from the login page via "🔑 View Test Credentials" link

---

## ✨ Features

### 1. **Copy-to-Clipboard Functionality**
- Click any 📋 icon to copy username, email, or password
- Green checkmark appears when copied successfully
- Toast notification confirms the copy
- "Copy Both" button for quick username + password copy

### 2. **Password Visibility Toggle**
- "Show Passwords" / "Hide Passwords" button
- Passwords hidden by default (shown as ••••••••)
- Click to reveal all passwords at once

### 3. **Test Account Cards**
- **Super Admin** - Full system access
  - Username: `admin`
  - Email: `admin@financegrowth.com`
  - Password: `admin123`
  - Role: Superadmin

- **Demo User** - Regular user for testing KAVI
  - Username: `jaredahazq_2`
  - Email: `jaredahazq@gmail.com`
  - Password: `user123`
  - Role: Staff

### 4. **Dynamic Database Users**
- Fetches all users from `/api/users/users/` endpoint
- Shows username, email, and role
- Copy buttons for each field
- Color-coded role badges

### 5. **Role Badges**
- 🛡️ **Super Admin** - Purple badge
- 💼 **Business Admin** - Blue badge
- ✅ **Staff** - Green badge
- 👤 **Viewer** - Gray badge

### 6. **Quick Reference Card**
- Shows login URLs for different roles
- Usage instructions
- Quick navigation guide

---

## 📱 UI Components

### Header Section
```
┌─────────────────────────────────────────────┐
│  Login Credentials           [Show Passwords]│
│  Test accounts for development               │
└─────────────────────────────────────────────┘
```

### Warning Banner
```
⚠️ Development/Demo Use Only
These credentials are for testing purposes.
Never share production credentials this way.
```

### Test Account Card
```
┌────────────────────────────────┐
│ 🛡️ admin              SUPERADMIN│
│ Super Admin - Full system access│
│                                 │
│ USERNAME                        │
│ admin                        📋 │
│                                 │
│ EMAIL                           │
│ admin@financegrowth.com      📋 │
│                                 │
│ PASSWORD                        │
│ ••••••••                      📋 │
│                                 │
│ [📋 Copy Both]                  │
└────────────────────────────────┘
```

---

## 🚀 How to Use

### For Developers

1. **Access the page:**
   ```
   Navigate to: http://localhost:5173/credentials
   Or click "🔑 View Test Credentials" on login page
   ```

2. **Copy credentials:**
   - Click individual copy buttons for specific fields
   - Click "Copy Both" to get username + password
   - Use "Show Passwords" to see all passwords

3. **Quick login:**
   - Copy credentials
   - Go back to login page
   - Paste and login

### For Demo/VC Pitch

1. **Before the demo:**
   - Open `/credentials` in a separate tab
   - Keep it handy for quick access

2. **During the demo:**
   - If you need to switch users, quickly reference the credentials page
   - Copy and paste credentials without fumbling
   - Show different user roles (Super Admin vs Regular User)

3. **Demo flow:**
   ```
   1. Login as Super Admin → Show business management
   2. Logout
   3. Login as jaredahazq_2 → Show KAVI and user features
   4. Create transaction → Show KAVI auto-sync
   ```

---

## 🔐 Security Notes

### ⚠️ Important Warnings

1. **Development Only**
   - This page should NEVER be deployed to production
   - Remove or protect this route before going live
   - Add authentication if keeping in staging

2. **Production Safety**
   ```javascript
   // In routes.jsx - Add conditional rendering:
   {
     path: "/credentials",
     element: process.env.NODE_ENV === 'production' 
       ? <Navigate to="/login" /> 
       : <LoginCredentials />,
     errorElement: <ErrorBoundary />
   }
   ```

3. **Environment-based Access**
   ```javascript
   // In LoginCredentials.jsx - Add check:
   useEffect(() => {
     if (process.env.NODE_ENV === 'production') {
       navigate('/login');
     }
   }, []);
   ```

---

## 📝 Customization

### Adding More Test Accounts

Edit `src/pages/LoginCredentials.jsx`:

```javascript
const testCredentials = [
  {
    id: 'super',
    username: 'admin',
    email: 'admin@financegrowth.com',
    password: 'admin123',
    role: 'superadmin',
    description: 'Super Admin - Full system access',
  },
  {
    id: 'demo',
    username: 'jaredahazq_2',
    email: 'jaredahazq@gmail.com',
    password: 'user123',
    role: 'staff',
    description: 'Demo User - For testing KAVI and regular features',
  },
  // Add more accounts here:
  {
    id: 'business_admin',
    username: 'biz_admin',
    email: 'business@example.com',
    password: 'biz123',
    role: 'business_admin',
    description: 'Business Admin - Manage business operations',
  },
];
```

### Changing Styles

The page uses Tailwind CSS and Shadcn UI components:

- **Card Colors:** Modify `className` props
- **Role Badge Colors:** Edit `getRoleBadge()` function
- **Icons:** Change Lucide React icons in imports

---

## 🧪 Testing

### Test Checklist

- [ ] Can access page at `/credentials`
- [ ] "Show Passwords" toggle works
- [ ] Copy buttons work for all fields
- [ ] "Copy Both" button copies username + password
- [ ] Toast notifications appear on copy
- [ ] Green checkmark appears after copy
- [ ] Role badges display correct colors
- [ ] Database users load dynamically
- [ ] Responsive on mobile devices
- [ ] Link from login page works

---

## 📊 Technical Details

### Files Created/Modified

1. **`src/pages/LoginCredentials.jsx`** (NEW)
   - Main credentials display page
   - React Query for dynamic user fetching
   - Copy-to-clipboard functionality

2. **`src/routes.jsx`** (MODIFIED)
   - Added route: `/credentials`
   - Imported `LoginCredentials` component

3. **`src/pages/Login.jsx`** (MODIFIED)
   - Added "🔑 View Test Credentials" link
   - Bottom of card, above footer

### Dependencies Used

- `@tanstack/react-query` - Fetching users
- `lucide-react` - Icons
- `react-hot-toast` - Copy notifications
- `shadcn/ui` - Card, Button, Input components

### API Endpoint

**GET** `/api/users/users/`
- Fetches all users from database
- Displays username, email, role
- No authentication required (for now - secure in production!)

---

## 🎬 Demo Script

### For VC Pitch

**Slide: "Easy Multi-User Testing"**

1. Show login page
2. Click "🔑 View Test Credentials"
3. Show the credentials page:
   - "This is how we make testing easy for our team"
   - "We have different user roles"
   - "One-click copy makes demos smooth"
4. Copy Super Admin credentials
5. Go back and login
6. Show Super Admin dashboard
7. Logout, repeat with regular user

**Key Message:** "We've built a developer-friendly system that's easy to test, demo, and scale."

---

## ✅ Checklist Before VC Pitch

- [ ] Test `/credentials` page loads
- [ ] All copy buttons work
- [ ] Credentials are correct and up-to-date
- [ ] Test both Super Admin and regular user logins
- [ ] Verify KAVI works with `jaredahazq_2` account
- [ ] Create sample data for demo user
- [ ] Bookmark `/credentials` for quick access
- [ ] Practice smooth user switching

---

## 🚀 Future Enhancements

1. **QR Code Generation**
   - Generate QR codes for quick mobile testing
   - Scan to auto-fill login credentials

2. **One-Click Login**
   - "Login as this user" button
   - Auto-navigates and logs in

3. **Credential Export**
   - Export as JSON/CSV
   - Share with team members

4. **Auto-Generated Passwords**
   - Generate secure random passwords
   - Save to database

5. **Session Persistence**
   - Remember last used account
   - Quick switch between accounts

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify backend is running
3. Ensure `/api/users/users/` endpoint is accessible
4. Clear browser cache and retry

---

**Created:** November 14, 2025  
**Status:** ✅ Fully Functional  
**URL:** `/credentials`  
**Purpose:** Development & Demo testing


