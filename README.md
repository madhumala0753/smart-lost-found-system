# CampusVault — Smart Lost and Found System

CampusVault is a full-stack lost-and-found management platform architected for college and university campuses. Built with React 19, TypeScript, Tailwind CSS, Firebase Authentication, and Cloud Firestore, it provides real-time reporting, relevance-based search matching, confidential ownership claim verification, and centralized campus administration.

---

## 1. Features

- **Public Campus Portal**: Live statistics bar, search bar, and campus feed.
- **Real-Time Authentication**: Firebase Email/Password & Google Sign-In with campus profile binding (Student / Staff ID, Department).
- **User Dashboard**: Summary counters (My Reports, Active Lost, Active Found, Pending Claims) and recent reports table.
- **Report Lost & Found Modules**: Complete forms with category taxonomy, campus building selection, photo upload preview, distinguishing features, and contact preference.
- **Smart Search & Relevance Matching**: Deterministic multi-factor scoring (token matching, category match, location proximity, date proximity) with approximate relevance percentage breakdowns.
- **Confidential Ownership Claims**: Claimants submit private verification proofs (serial numbers, engravings, lock screen wallpapers, pouch contents) kept hidden from the public.
- **In-App Notification Center**: Real-time alerts for claim creation, approvals, rejections, and match alerts with mark-all-read support.
- **Administrator Console**:
  - High-level metrics (Total Reports, Pending Claims, Verified Users, Resolved Items)
  - Report status arbitration (Active, Matched, Claim Pending, Returned/Resolved, Closed)
  - Claim review workflow with admin notes
  - User directory oversight
  - Immutable audit trail (`auditLogs`)
- **System Workflow Page**: Interactive visual flowchart illustrating the full lost-to-reunited lifecycle.

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons, Motion
- **Backend / Database**: Google Cloud Firestore (provisioned enterprise edition)
- **Authentication**: Firebase Auth (Email/Password, Google OAuth)
- **Storage**: Firebase Cloud Storage / Data URL fallback
- **Security**: Attribute-Based Access Control (ABAC) in `firestore.rules` and `storage.rules`

---

## 3. Project File Structure

```
├── firebase-applet-config.json    # Provisioned Firebase credentials
├── firebase-blueprint.json        # Data model Intermediate Representation (IR)
├── firestore.rules                # Hardened Firestore security rules
├── firestore.indexes.json         # Firestore index configuration
├── storage.rules                  # Firebase Cloud Storage security rules
├── security_spec.md               # Security invariants & test payload specifications
├── src/
│   ├── components/
│   │   ├── AuthModal.tsx          # Login & registration modal with quick demo shortcuts
│   │   ├── ClaimModal.tsx         # Confidential ownership claim submission
│   │   ├── Footer.tsx             # Campus footer
│   │   ├── Header.tsx             # Top bar with quick buttons & profile dropdown
│   │   ├── ItemCard.tsx           # Listing card with relevance badge & category icon
│   │   ├── ItemDetailsModal.tsx   # Item view modal with owner claim management
│   │   ├── Logo.tsx               # CampusVault emblem & wordmark
│   │   └── Sidebar.tsx            # Navy blue responsive collapsible navigation drawer
│   ├── contexts/
│   │   └── AuthContext.tsx        # React context for auth state and profile
│   ├── pages/
│   │   ├── AdminPage.tsx          # Administrator control center & audit logs
│   │   ├── DashboardPage.tsx      # User dashboard matching reference design
│   │   ├── LandingPage.tsx        # Public landing with search and statistics
│   │   ├── MyClaimsPage.tsx       # Claim tracking page
│   │   ├── MyItemsPage.tsx        # User reports management
│   │   ├── NotificationsPage.tsx  # In-app notifications
│   │   ├── ProfilePage.tsx        # Credentials & student profile
│   │   ├── ReportFormPage.tsx     # Report Lost / Found forms
│   │   ├── SearchMatchPage.tsx    # Search & Smart Matching engine
│   │   └── WorkflowPage.tsx       # System lifecycle visual flowchart
│   ├── services/
│   │   ├── adminService.ts        # Admin utilities
│   │   ├── auditService.ts        # Audit logging service
│   │   ├── authService.ts         # User registration, login, and sync
│   │   ├── claimService.ts        # Claim submission and review workflows
│   │   ├── firebase.ts            # Firebase initialization and error handling
│   │   ├── itemService.ts         # Items CRUD and matching algorithm
│   │   ├── notificationService.ts # Notifications pub/sub
│   │   └── seedService.ts         # Sample campus demo data seeding
│   ├── types/
│   │   └── index.ts               # TypeScript data interfaces
│   ├── App.tsx                    # Main app state and tab router
│   ├── index.css                  # Global Tailwind CSS
│   └── main.tsx                   # React root entry point
```

---

## 4. Local Setup Instructions

1. **Clone the repository and install dependencies**:
   ```bash
   npm install
   ```

2. **Verify Firebase Configuration**:
   Ensure `firebase-applet-config.json` is present in the project root with valid Firebase keys (`projectId`, `apiKey`, `firestoreDatabaseId`, etc.).

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

4. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 5. Security Rules & Deployment

Security rules are defined in `firestore.rules` and enforce:
- Unauthenticated users cannot read private user profiles or submit reports.
- Non-admin users cannot escalate their role to `admin` or modify records owned by other users.
- Claimants cannot approve their own claims; only item owners and administrators have review authority.
- Audit logs in `/auditLogs` are append-only and restricted to administrators.

To deploy rules manually with Firebase CLI:
```bash
firebase deploy --only firestore:rules,storage
```

---

## 6. Acceptance Testing Checklist

- [x] Register new user account with student ID and department.
- [x] Login with Email/Password and persist session across refreshes.
- [x] Submit a "Report Lost Item" with image preview and location.
- [x] Submit a "Report Found Item" with category and event date.
- [x] Search items by keywords and verify deterministic relevance score calculation.
- [x] Submit an ownership claim with confidential identifying details.
- [x] Item owner / administrator reviews and approves the claim.
- [x] Mark item as "Returned / Resolved" and verify status updates across catalog.
- [x] View audit logs recording administrative actions.
- [x] Responsive layout tested on desktop, tablet, and mobile drawers.
