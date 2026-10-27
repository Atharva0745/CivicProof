# CivicProof Backend API

Verified Municipal Issue Resolution for Mumbai Civic Issues (Potholes, Garbage, Drainage, Broken Streetlights).

> **Important Disclaimer:** CivicProof is an independent civic verification project and is **not an official BMC system**. Official complaints and status updates occur through official channels (BMC portal, MARG, 1916 helpline) and are recorded by citizens in CivicProof.

---

## Technical Stack

- **Runtime:** Node.js (v20+) + Express.js
- **Database:** MongoDB + Mongoose (GeoJSON 2dsphere indexing)
- **Real-time:** Socket.IO
- **Security:** JWT authentication, bcrypt password hashing, Helmet, CORS, Rate Limiting
- **Integrity:** SHA-256 cryptographic hashing for evidence photos and append-only audit trail

---

## Directory Structure

```text
server/
├── .env.example
├── .env
├── package.json
├── uploads/                        # Static evidence photo storage
└── src/
    ├── app.js                      # Express application setup & middleware
    ├── server.js                   # HTTP server & Socket.IO initialization
    ├── config/
    │   └── db.js                   # MongoDB connection management
    ├── models/
    │   ├── User.js                 # Citizen, Moderator, Admin models
    │   ├── Incident.js             # Incidents with GeoJSON 2dsphere index
    │   ├── Evidence.js             # Evidence with SHA-256 content hashes
    │   ├── OfficialComplaint.js    # User-recorded BMC/Grievance references
    │   ├── AuditEvent.js           # Append-only timeline audit log
    │   ├── Feedback.js             # Abuse and incorrect location reports
    │   └── FollowUpPacket.js       # Escalation dossier snapshots
    ├── routes/
    │   ├── auth.routes.js          # /api/auth
    │   ├── incident.routes.js      # /api/incidents
    │   ├── evidence.routes.js      # /api/incidents/:id/evidence
    │   ├── complaint.routes.js     # /api/incidents/:id/official-complaints
    │   ├── admin.routes.js         # /api/admin
    │   └── dashboard.routes.js     # /api/dashboard
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── incident.controller.js
    │   ├── evidence.controller.js
    │   ├── complaint.controller.js
    │   ├── admin.controller.js
    │   └── dashboard.controller.js
    ├── services/
    │   ├── duplicateDetection.js   # Geospatial proximity and category match
    │   ├── storage.js              # Safe upload persistence and SHA-256 hash
    │   ├── followUpPacket.js       # Neutral escalation draft and BMC links
    │   ├── notification.js         # Socket.IO room broadcast with redaction
    │   └── auditService.js         # Append-only audit logger
    ├── middleware/
    │   ├── auth.js                 # JWT verification (protect, optionalAuth)
    │   ├── authorize.js            # Role check (citizen, moderator, admin)
    │   ├── validate.js             # GeoJSON coordinates and field validation
    │   ├── rateLimit.js            # Rate limiters (general, auth, upload)
    │   ├── upload.js               # Multer image upload filter
    │   └── errorHandler.js         # Centralized error handler
    └── utils/
        └── seed.js                 # Demo seeder for Mumbai wards and incidents
```

---

## Getting Started

### 1. Environment Configuration

Copy `.env.example` to `.env`:

```bash
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/civicproof
JWT_SECRET=civicproof_super_secret_jwt_key_mumbai_2026_change_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=10
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Seed Sample Mumbai Civic Incidents

```bash
npm run seed
```

This provisions realistic incidents in Bandra West (Ward H/West), Dadar West (Ward G/North), Andheri East (Ward K/East), and Colaba (Ward A), along with test accounts:
- **Citizen:** `rohan@example.com` / `password123`
- **Moderator:** `pooja.mod@civicproof.org` / `modpass123`
- **Admin:** `admin@civicproof.org` / `adminpass123`

### 4. Run Automated Test Suite

```bash
npm test
```

Executes 14 end-to-end integration tests covering auth, lifecycle transitions, duplicate detection, geospatial `$near` queries, privacy redaction, repair dispute, and follow-up generation.

### 5. Start Development Server

```bash
npm run dev
# or
npm start
```

API runs at `http://localhost:5000/api` with live Socket.IO connection.

---

## API Endpoints Reference

Base URL: `http://localhost:5000/api`

### 1. Authentication
- `POST /api/auth/register` - Register a citizen or moderator
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/logout` - Logout / clear session
- `GET /api/auth/me` - Get current authenticated user profile

### 2. Incidents
- `POST /api/incidents` - Create new report (includes auto duplicate detection within 100m)
- `GET /api/incidents` - Search/filter public incidents (`category`, `status`, `ward`, `search`)
- `GET /api/incidents/nearby?lng=72.84&lat=19.01&radius=1000` - Geospatial `$near` proximity query
- `GET /api/incidents/:id` - Full report detail and audit timeline (redacts private BMC reference for public)
- `PATCH /api/incidents/:id` - Edit report before moderator review (owner only)
- `POST /api/incidents/:id/duplicate-suggestion` - Suggest duplicate report link
- `POST /api/incidents/:id/claim-resolution` - Upload after-photo and claim repair (`RepairClaimed`)
- `POST /api/incidents/:id/verification` - Accept repair (`VerifiedResolved`) or dispute (`Disputed`)
- `POST /api/incidents/:id/reopen` - Reopen unresolved or resurfaced issue
- `POST /api/incidents/:id/feedback` - Report abuse or incorrect coordinates

### 3. Evidence
- `POST /api/incidents/:id/evidence` - Attach image file or publicUrl (computes SHA-256 hash)
- `GET /api/incidents/:id/evidence` - List all evidence records for an incident

### 4. Official Complaint Tracking & Escalation
- `POST /api/incidents/:id/official-complaints` - Record official reference (e.g. `BMC-2026-HW-99824`)
- `GET /api/incidents/:id/official-complaints` - View references (owner and moderators only)
- `PATCH /api/official-complaints/:id/status-note` - Add user-reported status update
- `POST /api/incidents/:id/follow-up-packet` - Generate neutral escalation draft & evidence packet
- `GET /api/incidents/:id/follow-up-packet/:packetId` - Retrieve generated escalation packet

### 5. Administration & Moderation
- `GET /api/admin/incidents` - Moderation queue (unassigned, disputed, repair claimed)
- `PATCH /api/admin/incidents/:id/assign` - Assign internal moderator
- `PATCH /api/admin/incidents/:id/status` - Transition CivicProof lifecycle status
- `POST /api/admin/incidents/:id/merge` - Merge duplicate incident into target while preserving evidence
- `GET /api/admin/feedback` - Moderation abuse and review queue
- `PATCH /api/admin/feedback/:id` - Update feedback status

### 6. Dashboard
- `GET /api/dashboard/summary?days=30` - Municipal counts by category, status, and top wards
- `GET /api/dashboard/recurring-hotspots` - Clusters of repeated complaints across Mumbai

---

## Real-time Events (Socket.IO)

Clients connect to `ws://localhost:5000`:
- `join:public` - Subscribe to public updates
- `join:incident` - Subscribe to updates for a specific incident ID
- `join:moderators` - Subscribe to moderator event stream

### Emitted Events:
- `incident:created` - New report filed
- `incident:updated` - Incident details edited
- `incident:status-changed` - Status transitioned
- `incident:resolution-claimed` - After-photo and repair claim filed
- `incident:verification-updated` - Community or moderator verified or disputed
- `incident:assigned` - Moderator assigned
