# CivicProof --- Technical Architecture

**Project:** CivicProof --- Verified Municipal Issue Resolution\
**Stack:** React + Vite + Tailwind CSS, Node.js + Express, MongoDB +
Mongoose, Socket.IO\
**Initial scope:** Mumbai civic issues (potholes, garbage, drainage,
broken streetlights)\
**Important:** CivicProof is an independent project, not an official BMC
system. Unless an authorized integration is available, official
complaint submission and status updates happen on the official channel
and are recorded by the user in CivicProof.

------------------------------------------------------------------------

## 1. Problem and product goal

Citizens can report local civic issues, keep evidence, record the
official complaint reference, follow the issue's history, and prepare a
follow-up when the issue remains unresolved.

CivicProof must distinguish three separate things:

1.  **CivicProof report:** A record created inside this app.
2.  **Official complaint:** A complaint submitted to BMC or another
    responsible authority.
3.  **Resolution verification:** Evidence that a repair was claimed and
    then reviewed. An uploaded after-photo alone does not prove that the
    work is complete.

## 2. High-level architecture

``` mermaid
flowchart TD
    Citizen[Citizen] --> React[React + Vite frontend]
    Admin[Moderator / admin] --> React
    React -->|HTTPS JSON API| Express[Node.js + Express API]
    Express --> Auth[Authentication and role checks]
    Express --> Incident[Incident service]
    Express --> Escalation[Follow-up packet service]
    Express --> Upload[Image upload service]
    Incident --> Mongo[(MongoDB)]
    Escalation --> Mongo
    Upload --> Storage[Cloudinary or S3-compatible storage]
    Express --> Socket[Socket.IO]
    Socket --> React
    Citizen -. external submission .-> Official[BMC official grievance portal / 1916]
    Official -. user records reference and updates .-> React
```

### Components

-   **React frontend:** report form, map, incident page, evidence
    timeline, personal dashboard, escalation wizard.
-   **Express API:** validation, authentication, incident workflow,
    evidence metadata, follow-up packet creation, notifications.
-   **MongoDB:** incidents, users, official complaint references, audit
    events, evidence metadata, feedback.
-   **Object storage:** photo files. Store file URLs and metadata in
    MongoDB, not large image binaries.
-   **Socket.IO:** broadcast changes to subscribed clients; persist all
    important changes in MongoDB first.
-   **Official channels:** link to BMC's current official portal and
    helpline. Do not imply that a CivicProof incident ID is an official
    complaint number.

## 3. Official channels and data access

### BMC (Mumbai)

-   BMC portal: https://portal.mcgm.gov.in/
-   MARG grievance portal:
    https://marg.mcgm.gov.in/MARG/welcomePage.html
-   BMC civic helpline: 1916 (verify current availability and
    applicability before production).

### Maharashtra state grievance portal

-   https://grievances.maharashtra.gov.in/en

### Data/API availability

No public, documented BMC API for submitting complaints or checking each
complaint's live status has been verified for this design. Therefore: -
Start with user-submitted reports and evidence. - Let users manually
enter the official complaint reference, submission date, and status
updates. - Link to official complaint channels. - Integrate directly
only if BMC publishes an appropriate API or grants written
authorization. - Do not scrape authenticated portals, bypass CAPTCHA, or
automate complaint submission without permission.

### Map and geocoding

Use a map library such as Leaflet with OpenStreetMap tiles, following
the tile provider's usage policy. Browser geolocation requires user
permission. Geocoding is a separate service and may have usage limits;
avoid depending on a free public geocoder for high-volume production
use.

------------------------------------------------------------------------

## 4. User roles

  -----------------------------------------------------------------------
  Role                                Permissions
  ----------------------------------- -----------------------------------
  Guest                               Browse public incidents if enabled;
                                      view public aggregate dashboard

  Citizen                             Create reports, upload evidence,
                                      link an official reference, submit
                                      follow-up details, dispute a
                                      claimed resolution

  Moderator                           Review reports, moderate abusive
                                      content, merge duplicates, mark a
                                      report as verified for publication

  Admin                               Manage users, categories,
                                      departments, escalation templates,
                                      audit and system settings

  Municipal officer (future, only if  View assigned incidents and update
  authorized)                         work status within an approved
                                      integration
  -----------------------------------------------------------------------

Do not label ordinary users as municipal officers. The officer role is a
future capability, not assumed access.

## 5. Incident lifecycle

``` mermaid
stateDiagram-v2
    [*] --> Submitted
    Submitted --> UnderReview
    UnderReview --> Duplicate
    UnderReview --> ReadyForOfficialSubmission
    ReadyForOfficialSubmission --> OfficialComplaintRecorded
    OfficialComplaintRecorded --> InProgress
    InProgress --> RepairClaimed
    RepairClaimed --> VerifiedResolved
    RepairClaimed --> Disputed
    Disputed --> InProgress
    OfficialComplaintRecorded --> FollowUpNeeded
    FollowUpNeeded --> FollowUpPrepared
    FollowUpPrepared --> OfficialComplaintRecorded
    VerifiedResolved --> Reopened
    Reopened --> FollowUpNeeded
```

This is CivicProof's internal status model. `OfficialComplaintRecorded`
means the user entered an official reference; unless the app has an
authorized integration, the app has not independently verified that
reference with BMC.

## 6. MongoDB collections

### `users`

``` js
{
  name: String,
  email: String,
  passwordHash: String,
  role: "citizen" | "moderator" | "admin",
  createdAt: Date,
  updatedAt: Date
}
```

### `incidents`

``` js
{
  title: String,
  description: String,
  category: "pothole" | "garbage" | "drainage" | "streetlight" | "other",
  location: {
    type: "Point",
    coordinates: [Number, Number] // [longitude, latitude]
  },
  addressLabel: String,
  ward: String,
  status: String,
  reporterId: ObjectId,
  evidenceIds: [ObjectId],
  possibleDuplicateOf: ObjectId,
  officialComplaintId: ObjectId,
  visibility: "public" | "private" | "redacted_public",
  createdAt: Date,
  updatedAt: Date
}
```

Create a `2dsphere` index on `location`. Always store GeoJSON
coordinates as `[longitude, latitude]`, not `[latitude, longitude]`.

### `evidence`

``` js
{
  incidentId: ObjectId,
  uploadedBy: ObjectId,
  kind: "before_photo" | "after_photo" | "other",
  storageKey: String,
  publicUrl: String,
  capturedAt: Date,
  uploadedAt: Date,
  caption: String,
  reviewStatus: "pending" | "accepted" | "rejected",
  contentHash: String
}
```

Store EXIF/capture metadata only where needed and with user consent. A
timestamp or GPS tag can be missing or manipulated; it is not proof by
itself.

### `officialComplaints`

``` js
{
  incidentId: ObjectId,
  authority: "BMC" | "Maharashtra grievance portal" | "other",
  officialReference: String,
  submittedAt: Date,
  officialChannelUrl: String,
  statusReportedByUser: String,
  lastCheckedByUserAt: Date,
  notes: String,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

Treat the official reference as sensitive enough to restrict access to
the reporter and authorized moderators. Do not expose it in public feeds
by default.

### `auditEvents`

``` js
{
  incidentId: ObjectId,
  actorId: ObjectId,
  action: String,
  previousValue: Object,
  newValue: Object,
  note: String,
  createdAt: Date
}
```

Make audit events append-only at the application layer. Record who
changed status, assignment, visibility, or verification.

### `feedback`

``` js
{
  incidentId: ObjectId,
  userId: ObjectId,
  type: "incorrect_location" | "duplicate" | "resolved" | "abuse" | "other",
  message: String,
  createdAt: Date,
  status: "new" | "reviewing" | "closed"
}
```

------------------------------------------------------------------------

## 7. REST API endpoints

Base URL (local): `http://localhost:5000/api`

### Authentication

  Method   Endpoint           Purpose
  -------- ------------------ -----------------------------
  POST     `/auth/register`   Register citizen
  POST     `/auth/login`      Login
  POST     `/auth/logout`     Logout / invalidate session
  GET      `/auth/me`         Current user

### Incidents

  -------------------------------------------------------------------------------------------------------------
  Method            Endpoint                                              Purpose             Access
  ----------------- ----------------------------------------------------- ------------------- -----------------
  POST              `/incidents`                                          Create incident     Citizen

  GET               `/incidents`                                          Search/filter       Public
                                                                          public incidents    

  GET               `/incidents/nearby?lng=72.87&lat=19.07&radius=1000`   Nearby incidents    Public

  GET               `/incidents/:id`                                      Incident detail and Public, with
                                                                          public timeline     private fields
                                                                                              excluded

  PATCH             `/incidents/:id`                                      Edit own report     Owner
                                                                          before review,      
                                                                          within policy       

  POST              `/incidents/:id/evidence`                             Add evidence        Owner or
                                                                          metadata/upload     authorized
                                                                                              reviewer

  POST              `/incidents/:id/duplicate-suggestion`                 Suggest duplicate   Signed-in user

  POST              `/incidents/:id/reopen`                               Dispute             Reporter or
                                                                          resolution/reopen   moderator
                                                                          report              
  -------------------------------------------------------------------------------------------------------------

### Official complaint tracking

  ---------------------------------------------------------------------------------------------
  Method                  Endpoint                                      Purpose
  ----------------------- --------------------------------------------- -----------------------
  POST                    `/incidents/:id/official-complaints`          Record official
                                                                        channel, reference and
                                                                        submission date

  GET                     `/incidents/:id/official-complaints`          View references
                                                                        belonging to authorized
                                                                        user

  PATCH                   `/official-complaints/:id/status-note`        Add user-reported
                                                                        status update

  POST                    `/incidents/:id/follow-up-packet`             Generate a follow-up
                                                                        draft and evidence list

  GET                     `/incidents/:id/follow-up-packet/:packetId`   Retrieve generated
                                                                        packet
  ---------------------------------------------------------------------------------------------

These endpoints store citizen-entered information. They do not submit to
BMC or retrieve live BMC status.

### Moderation and workflow

  ------------------------------------------------------------------------------------------
  Method            Endpoint                            Purpose           Access
  ----------------- ----------------------------------- ----------------- ------------------
  PATCH             `/admin/incidents/:id/assign`       Assign internal   Admin/moderator
                                                        moderator/queue   

  PATCH             `/admin/incidents/:id/status`       Change CivicProof Admin/moderator
                                                        status            

  POST              `/admin/incidents/:id/merge`        Merge duplicate   Admin/moderator
                                                        incidents         

  POST              `/incidents/:id/claim-resolution`   Upload evidence   Owner/authorized
                                                        of claimed repair actor

  POST              `/incidents/:id/verification`       Verify or dispute Authorized
                                                        claimed repair    reviewer; reporter
                                                                          can dispute
  ------------------------------------------------------------------------------------------

### Dashboard and feedback

  ---------------------------------------------------------------------------------
  Method                  Endpoint                          Purpose
  ----------------------- --------------------------------- -----------------------
  GET                     `/dashboard/summary`              Counts by
                                                            category/status and
                                                            time period

  GET                     `/dashboard/recurring-hotspots`   Locations with repeated
                                                            reports

  POST                    `/incidents/:id/feedback`         Report abuse or
                                                            incorrect information
  ---------------------------------------------------------------------------------

Protect private records using authorization checks on every request. Do
not accept a `reporterId` from the request body as proof of ownership;
derive it from the authenticated user.

------------------------------------------------------------------------

## 8. Duplicate detection and geospatial search

1.  When a report is created, validate coordinates and category.
2.  Query nearby reports with MongoDB `$near` or `$geoNear` using the
    `2dsphere` index.
3.  Consider configurable radius (e.g., 50--100 metres for a prototype),
    same/related category, and a time window.
4.  Return likely matches to the user or moderator; do not auto-merge
    based only on distance.
5.  Preserve all reporter evidence and IDs if a moderator merges
    records.

Example query:

``` js
const nearby = await Incident.find({
  category: incident.category,
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [longitude, latitude]
      },
      $maxDistance: 100
    }
  },
  createdAt: { $gte: sinceDate }
}).limit(10);
```

The 100-metre threshold is a prototype setting, not a universal rule.
Different issue categories may need different thresholds.

## 9. Follow-up packet generation

When the user selects **"Issue not fixed? Prepare escalation"**,
compile: - CivicProof incident ID and category; - incident location and
dates; - original description; - original and recent evidence links; -
official authority and reference entered by the user; - previous status
updates and follow-up attempts; - a neutral draft requesting
review/action; - the official channel link.

The user must review the draft and submit it through the official
channel. Do not send email or submit complaints automatically without a
verified official address/API and explicit user consent. Avoid public
exposure of personal contact details, exact home location, or official
reference numbers.

## 10. Security, privacy and abuse prevention

-   Hash passwords with a modern password hashing algorithm; prefer
    secure HTTP-only session cookies or correctly configured tokens.
-   Apply rate limits, schema validation, secure headers, CSRF
    protections where applicable, and file size/type limits.
-   Use signed upload URLs or server-validated image uploads; reject
    executable files and untrusted MIME types.
-   Keep official complaint references and reporter contact details
    private.
-   Allow public display of a redacted location rather than an exact
    residential coordinate.
-   Provide report moderation and abuse-reporting tools.
-   Do not publish photos showing faces, vehicle plates, phone numbers,
    or private property details without careful review.
-   Make a clear retention and deletion policy.
-   Store audit events for sensitive workflow changes.
-   Treat citizen reports as allegations/observations, not official
    findings of fault.

## 11. Real-time updates with Socket.IO

After the API validates and persists a change: 1. Save the
incident/status event to MongoDB. 2. Emit `incident:updated` to the
relevant room. 3. Send only fields the connected user is authorized to
see. 4. The React client refreshes the timeline or updates its view.

Example events: - `incident:created` - `incident:assigned` -
`incident:status-changed` - `incident:resolution-claimed` -
`incident:verification-updated`

Socket.IO is for application updates only; it does not connect
CivicProof to BMC's internal system.

## 12. Suggested project structure

``` text
civicproof/
  client/
    src/
      components/
        IncidentCard.jsx
        IncidentMap.jsx
        EvidenceUploader.jsx
        StatusTimeline.jsx
        EscalationWizard.jsx
      pages/
        Home.jsx
        ReportIssue.jsx
        IncidentDetails.jsx
        MyReports.jsx
        Dashboard.jsx
        AdminQueue.jsx
      services/
        api.js
        socket.js
  server/
    src/
      config/db.js
      models/
        User.js
        Incident.js
        Evidence.js
        OfficialComplaint.js
        AuditEvent.js
        Feedback.js
      routes/
        auth.routes.js
        incident.routes.js
        evidence.routes.js
        complaint.routes.js
        dashboard.routes.js
        admin.routes.js
      controllers/
      services/
        duplicateDetection.js
        storage.js
        followUpPacket.js
        notification.js
      middleware/
        auth.js
        authorize.js
        validate.js
        rateLimit.js
        errorHandler.js
      app.js
      server.js
```

## 13. Implementation plan

### Phase 1 --- Core reporting

-   Register/login.
-   Create incident with category, description and location.
-   Upload before-photo.
-   List and map incidents.
-   Add geospatial index and nearby search.

### Phase 2 --- Accountability workflow

-   Status timeline and audit events.
-   Possible duplicate suggestions.
-   Admin/moderator queue.
-   Repair-claimed and verification/dispute flow.

### Phase 3 --- Official complaint tracking

-   Link to official BMC complaint channel.
-   Let users save the official complaint reference and submission date.
-   Add manual status updates.
-   Generate follow-up packet with evidence and official links.

### Phase 4 --- Quality and deployment

-   Access-control and file-upload tests.
-   Mobile and accessibility checks.
-   Rate limiting, privacy review, and moderation.
-   Deploy frontend, API, database and image storage.
-   Clearly disclose that official status is user-reported unless an
    authorized integration verifies it.

## 14. Official links to investigate

-   BMC main portal: https://portal.mcgm.gov.in/
-   BMC MARG grievance portal:
    https://marg.mcgm.gov.in/MARG/welcomePage.html
-   Maharashtra grievance portal:
    https://grievances.maharashtra.gov.in/en
-   Open Government Data Platform: https://data.gov.in/

**Data integration status:** No public, documented BMC API for complaint
submission or live individual complaint status is assumed in this
design. Verify with BMC or an official API catalog before promising
integration.
