# Super Admin Dashboard

A centralized web dashboard for managing the Taskforce system with complete oversight of all data and operations.

## 🔐 Super Admin Credentials

- **Email**: `rootadmin`
- **Password**: `qwerty`

## 🚀 Features

### 📊 Dashboard Overview
- Real-time statistics of all system components
- User counts, complaints, inspections, teams, etc.
- Recent activity feed
- System health monitoring
- Quick action buttons

### 👥 User Management
- View all registered users
- Filter by role, status, organization
- Search functionality
- User details and actions
- Export capabilities

### 📝 Access Request Management
- Review pending access requests
- Approve/reject requests
- Bulk operations
- Status tracking
- Request history

### 🛡️ IP Security Monitoring
- View all IP records
- Device tracking
- Security violations
- IP change requests
- Location monitoring

### 📋 Complaints Management
- All complaint records
- Priority and status tracking
- Assignment management
- Resolution tracking

### 📈 Activity Logging
- System-wide activity feed
- User actions tracking
- Audit trail
- Export logs

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Access to the same Firebase project as the mobile app

### Installation

1. **Navigate to the dashboard directory**:
   ```bash
   cd SuperAdminDashboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup** (Optional):
   Create a `.env.local` file if you want to override Firebase config:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to `http://localhost:3000`

6. **Login with super admin credentials**:
   - Email: `rootadmin`
   - Password: `qwerty`

### Production Build

```bash
npm run build
npm start
```

## 📱 Data Sources

The dashboard connects to the same Firebase project as the mobile Taskforce app and displays data from these collections:

- `approvedUsers` - All registered users
- `accessRequests` - User access requests
- `complaints` - Complaint records
- `inspections` - Inspection data
- `teams` - Team information
- `feederPoints` - Feeder point data
- `ipRecords` - IP security records

## 🔒 Security Features

- **Super Admin Authentication**: Separate login system
- **Session Management**: Secure session handling
- **Read-Only Access**: Dashboard is primarily for viewing data
- **Firebase Security Rules**: Respects existing Firestore security rules

## 🎨 UI Components

Built with:
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Recharts** - Charts and graphs

## 📊 Dashboard Sections

### 1. **Main Dashboard** (`/`)
- Overview statistics
- Recent activity
- System health
- Quick actions

### 2. **Users** (`/users`)
- Complete user list
- Search and filtering
- User details
- Role management

### 3. **Access Requests** (`/access-requests`)
- Pending requests
- Approval workflow
- Request history
- Bulk operations

### 4. **Complaints** (`/complaints`)
- All complaints
- Status tracking
- Priority management
- Assignment details

### 5. **IP Security** (`/ip-security`)
- IP records
- Device tracking
- Security monitoring
- Change requests

### 6. **Activity Log** (`/activity`)
- System activity
- User actions
- Audit trail
- Export functionality

## 🔧 Customization

### Adding New Pages
1. Create a new file in `pages/` directory
2. Add navigation link in `components/Layout.tsx`
3. Create corresponding data service functions in `lib/dataService.ts`

### Styling
- Modify `tailwind.config.js` for theme changes
- Update `styles/globals.css` for custom components
- Component styles are in individual files

### Data Sources
- Add new Firebase collections in `lib/dataService.ts`
- Create corresponding TypeScript interfaces
- Update dashboard statistics

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect to Vercel
3. Deploy automatically

### Other Platforms
- Build with `npm run build`
- Deploy the `.next` folder
- Set environment variables

## 📞 Support

For issues or questions:
- Check Firebase connection
- Verify credentials
- Review browser console for errors
- Ensure mobile app data exists in Firebase

## 🔄 Updates

The dashboard automatically reflects changes from the mobile app since it connects to the same Firebase database in real-time.
