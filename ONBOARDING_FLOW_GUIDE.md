# Complete Onboarding & Monitoring Flow

## 🎯 **OVERVIEW**

This document explains the complete flow from registration to monitoring in the Super Admin Dashboard.

---

## 📋 **REGISTRATION TO APPROVAL FLOW**

### **1. Business Registration** 🏢

#### **Step 1: User Submits Registration**
- **Route**: `/register` (Business tab)
- **Component**: `RegisterNew.jsx`
- **Fields**:
  - Business name, owner name, email, phone
  - Registration number, KRA PIN
  - Location, business type
  - Monthly revenue
  - Documents (registration cert, KRA cert, ID)

#### **Step 2: Registration Stored**
- **Backend**: `POST /api/users/business-registration/`
- **Model**: `BusinessRegistration`
- **Status**: `pending`
- **Email sent**: Confirmation email to user

#### **Step 3: User Checks Status**
- **Route**: `/registration-status/:email`
- **Component**: `RegistrationStatus.jsx`
- **Backend**: `GET /api/users/business-registration/status/:email/`
- **Shows**: Current status (pending/approved/rejected)

---

### **2. Super Admin Reviews & Approves** ✅

#### **Step 1: View Pending Registrations**
- **Route**: `/super-admin/approvals`
- **Component**: `SuperAdminApprovals.jsx`
- **Backend**: `GET /api/users/admin/pending-registrations/`
- **Shows**:
  - All pending business registrations
  - Business details
  - Owner information
  - Documents

#### **Step 2: Approve Registration**
- **Action**: Click "Approve" button
- **Backend**: `POST /api/users/admin/approve-registration/:id/`
- **What Happens**:
  1. ✅ Creates User account
  2. ✅ Generates temporary password
  3. ✅ Creates Business record
  4. ✅ Creates Membership (owner as business_admin)
  5. ✅ Updates registration status to 'approved'
  6. ✅ **Logs activity** to ActivityLog table
  7. ✅ Returns username & temp password

#### **Step 3: Activity Logged**
- **Table**: `ActivityLog`
- **Action**: "Approved business registration: [Business Name]"
- **Details**: Business ID, User email, timestamp
- **Severity**: info
- **Visible in**: `/super-admin/logs`

---

### **3. Individual Registration** 👤

#### **Step 1: User Submits Registration**
- **Route**: `/register` (Individual tab)
- **Component**: `RegisterNew.jsx`
- **Fields**:
  - Full name, email, phone
  - ID number, date of birth
  - Location (city, country)
  - Preferred business (optional)

#### **Step 2: Registration Stored**
- **Backend**: `POST /api/users/individual-registration/`
- **Model**: `IndividualRegistration`
- **Status**: `pending`

#### **Step 3: Super Admin Assigns to Business**
- **Route**: `/super-admin/approvals` (Individual tab)
- **Action**: Select business & role, click "Approve"
- **Backend**: `POST /api/users/admin/approve-individual-registration/:id/`
- **What Happens**:
  1. ✅ Creates User account
  2. ✅ Generates temporary password
  3. ✅ Creates Membership (assigned business & role)
  4. ✅ Updates registration status
  5. ✅ **Logs activity** to ActivityLog table
  6. ✅ Returns username & temp password

---

## 🔍 **MONITORING FLOW**

### **1. Super Admin Dashboard** 📊

#### **Main Dashboard**
- **Route**: `/super-admin`
- **Component**: `SuperAdminDashboard.jsx`
- **Backend**: `GET /api/users/admin/dashboard/`

**Shows**:
- Total users, businesses, pending registrations
- Quick action cards
- Recent users & businesses
- System overview

---

### **2. Business Monitoring** 🏢

#### **Business List**
- **Route**: `/super-admin/businesses`
- **Component**: `BusinessMonitoring.jsx`
- **Backend**: `GET /api/users/admin/businesses-monitoring/`

**Shows for Each Business**:
- ✅ Legal name & status (active/inactive)
- ✅ Owner email & phone
- ✅ Location & business type
- ✅ Registration date
- ✅ **User count** (how many users assigned)
- ✅ Last activity date
- ✅ Transaction count
- ✅ Document count
- ✅ Monthly revenue

**Summary Stats**:
- Total businesses
- Active businesses
- Total users across all businesses
- Businesses created this month

**Filters**:
- Search by name, email, type
- Filter by status (all/active/inactive)

---

### **3. User Management** 👥

#### **User List**
- **Route**: `/super-admin/users`
- **Component**: `UserManagement.jsx`
- **Backend**: `GET /api/users/admin/users/`

**Shows for Each User**:
- ✅ Name, email, username
- ✅ Role (super_admin/business_admin/staff/viewer)
- ✅ **Business assignment** (which business they belong to)
- ✅ Status (active/inactive)
- ✅ Last login
- ✅ Registration date

**Actions**:
- View user details
- Reset password
- Activate/deactivate
- Change role
- Export to CSV

---

### **4. Activity Logs** 📝

#### **Activity Timeline**
- **Route**: `/super-admin/logs`
- **Component**: `ActivityLogs.jsx`
- **Backend**: `GET /api/users/admin/activity-logs/`

**Tracks All Activities**:
- ✅ Business approvals/rejections
- ✅ Individual approvals/rejections
- ✅ User logins
- ✅ Password resets
- ✅ Account locks
- ✅ Session terminations
- ✅ Module assignments
- ✅ Settings changes

**Each Log Shows**:
- Action performed
- User who performed it
- Timestamp
- IP address
- Details
- Severity (info/warning/critical)

**Filters**:
- By action type (login/user/business/document/settings)
- By user
- By date range (today/week/month/all)
- Search functionality

---

### **5. Security Monitoring** 🔒

#### **Security Dashboard**
- **Route**: `/super-admin/security`
- **Component**: `SecurityModule.jsx`

**Monitors**:
- ✅ Active sessions (who's logged in)
- ✅ Failed login attempts (last 24 hours)
- ✅ Security events
- ✅ Suspicious activities

**Actions**:
- Terminate sessions
- Lock accounts
- Reset passwords
- View session details (IP, user agent)

---

### **6. Module Assignment** 📦

#### **Feature Control**
- **Route**: `/super-admin/settings`
- **Component**: `ModuleAssignment.jsx`

**Controls**:
- Which modules each business can access
- Enable/disable features per business
- Track module usage

**Available Modules**:
- Transactions
- Invoices
- Reports & Analytics
- Team Management
- Settings

---

## 🔄 **COMPLETE WORKFLOW**

### **Business Onboarding Flow**:

```
1. User Registers
   ↓
2. Registration Stored (status: pending)
   ↓
3. Super Admin Views in /super-admin/approvals
   ↓
4. Super Admin Approves
   ↓
5. System Creates:
   - User Account
   - Business Record
   - Membership (owner as business_admin)
   - Activity Log Entry
   ↓
6. Business Appears in /super-admin/businesses
   ↓
7. Owner Can Login with temp password
   ↓
8. Owner Changes Password on First Login
   ↓
9. Owner Can Invite Team Members
   ↓
10. Super Admin Monitors:
    - Business activity in /super-admin/businesses
    - User logins in /super-admin/logs
    - Active sessions in /super-admin/security
```

### **Individual Onboarding Flow**:

```
1. Individual Registers
   ↓
2. Registration Stored (status: pending)
   ↓
3. Super Admin Views in /super-admin/approvals
   ↓
4. Super Admin Assigns to Business & Role
   ↓
5. Super Admin Approves
   ↓
6. System Creates:
   - User Account
   - Membership (assigned business & role)
   - Activity Log Entry
   ↓
7. User Appears in:
   - /super-admin/users (all users list)
   - /super-admin/businesses (under assigned business)
   ↓
8. User Can Login with temp password
   ↓
9. User Changes Password on First Login
   ↓
10. Super Admin Monitors:
    - User activity in /super-admin/logs
    - Login sessions in /super-admin/security
```

---

## 📊 **MONITORING CAPABILITIES**

### **What Super Admin Can See**:

#### **1. Business Level**:
- ✅ All businesses registered
- ✅ Business status (active/inactive)
- ✅ Number of users per business
- ✅ Last activity per business
- ✅ Business owner information
- ✅ Registration date

#### **2. User Level**:
- ✅ All users in the system
- ✅ Which business each user belongs to
- ✅ User roles (business_admin/staff/viewer)
- ✅ User status (active/inactive)
- ✅ Last login time
- ✅ Registration date

#### **3. Activity Level**:
- ✅ Every action performed in the system
- ✅ Who performed each action
- ✅ When it was performed
- ✅ IP address and user agent
- ✅ Details of the action

#### **4. Security Level**:
- ✅ Active login sessions
- ✅ Failed login attempts
- ✅ Suspicious activities
- ✅ Account locks
- ✅ Password resets

---

## ✅ **STATUS UPDATES**

### **Registration Status Flow**:

1. **Pending** → User submitted, waiting for review
2. **Approved** → Super admin approved, accounts created
3. **Rejected** → Super admin rejected with reason

### **User Status Flow**:

1. **Active** → Can login and use system
2. **Inactive** → Cannot login (locked/deactivated)

### **Business Status Flow**:

1. **Active** → Business is operational
2. **Inactive** → Business is suspended/closed

---

## 🎯 **KEY FEATURES**

### **✅ Real-Time Monitoring**:
- Activity logs refresh every 5 seconds
- Security logs refresh every 10 seconds
- Active sessions refresh every 15 seconds
- Business stats refresh every 30 seconds

### **✅ Complete Audit Trail**:
- Every approval/rejection logged
- Every login tracked
- Every action recorded
- IP addresses captured

### **✅ Business Assignment**:
- Users assigned to specific businesses
- Visible in user management
- Tracked in memberships table
- Monitored in business view

### **✅ Role-Based Access**:
- Super Admin: Full system access
- Business Admin: Business-level access
- Staff: Limited access
- Viewer: Read-only access

---

## 🚀 **TESTING THE FLOW**

### **1. Test Business Registration**:
```
1. Go to /register
2. Fill business registration form
3. Submit
4. Check status at /registration-status/:email
5. Login as super admin
6. Go to /super-admin/approvals
7. Approve the registration
8. Check /super-admin/businesses (should appear)
9. Check /super-admin/logs (approval logged)
10. Try logging in with provided credentials
```

### **2. Test Individual Registration**:
```
1. Go to /register (Individual tab)
2. Fill individual registration form
3. Submit
4. Login as super admin
5. Go to /super-admin/approvals (Individual tab)
6. Select a business and role
7. Approve the registration
8. Check /super-admin/users (should appear)
9. Check /super-admin/businesses (under assigned business)
10. Check /super-admin/logs (approval logged)
```

### **3. Test Monitoring**:
```
1. Go to /super-admin/businesses
2. See all businesses with user counts
3. Go to /super-admin/users
4. See all users with business assignments
5. Go to /super-admin/logs
6. See all activities including approvals
7. Filter by type, user, date
8. Export logs to CSV
```

---

## 📝 **SUMMARY**

### **✅ What's Working**:
1. ✅ Business registration & approval
2. ✅ Individual registration & approval
3. ✅ User account creation on approval
4. ✅ Business creation on approval
5. ✅ Membership assignment
6. ✅ Activity logging for all approvals
7. ✅ Business monitoring with user counts
8. ✅ User management with business assignment
9. ✅ Activity logs with filtering
10. ✅ Security monitoring
11. ✅ Real-time updates
12. ✅ Status tracking

### **✅ What Super Admin Can Do**:
1. ✅ View all pending registrations
2. ✅ Approve/reject registrations
3. ✅ Assign individuals to businesses
4. ✅ Monitor all businesses
5. ✅ See user counts per business
6. ✅ Track all activities
7. ✅ Monitor logins and sessions
8. ✅ Reset passwords
9. ✅ Lock accounts
10. ✅ Assign modules to businesses

---

**The complete onboarding and monitoring system is now fully functional! 🎉**
