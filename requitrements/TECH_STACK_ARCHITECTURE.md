# ELDROS Project - Tech Stack & Architecture Recommendations

## Overview
This document outlines the recommended technology stack and architecture flow for the ELDROS project, building on Java/Spring Boot backend foundation.

---

## Recommended Tech Stack

### Backend (Core)
- **Framework**: Spring Boot 3.x (Java 17+)
- **Build Tool**: Maven or Gradle
- **API**: Spring Web (REST APIs)
- **Security**: Spring Security with JWT + MFA support
- **Validation**: Bean Validation (Jakarta Validation)
- **Documentation**: SpringDoc OpenAPI (Swagger)

### Frontend
- **Framework**: React 18+ with TypeScript (or Vue.js 3 / Angular 17+)
- **UI Library**: 
  - Material-UI (MUI) or Ant Design (excellent accessibility support)
  - Or Headless UI + Tailwind CSS for custom design
- **State Management**: Redux Toolkit or Zustand
- **Routing**: React Router (or Vue Router / Angular Router)
- **HTTP Client**: Axios or Fetch API
- **PDF Viewer**: PDF.js (Mozilla) or react-pdf
- **ePub Viewer**: epub.js
- **i18n**: react-i18next (for English/Welsh support)
- **Accessibility**: React A11y, ARIA attributes, focus management

### Database Layer
- **Primary Database**: PostgreSQL 15+ (relational data, metadata, users, workflows)
- **Caching**: Redis 7+ (sessions, concurrency locks, frequently accessed data)
- **Search Engine**: Elasticsearch 8+ or Apache Solr (metadata search + full-text search)
- **Time-Series**: InfluxDB or TimescaleDB (for analytics/metrics)

### File Storage & Processing
- **Object Storage**: 
  - AWS S3 (if UK region available) or
  - MinIO (self-hosted, S3-compatible) or
  - Azure Blob Storage (UK region)
- **File Processing**: 
  - Apache Tika (file type detection, metadata extraction)
  - PDFBox or iText (PDF processing)
  - epub4j or epubcheck (ePub validation)
- **Hash Calculation**: SHA-256 for duplicate detection
- **SFTP Server**: Apache MINA SSHD or JSch library

### Message Queue & Async Processing
- **Message Broker**: RabbitMQ or Apache Kafka (for async workflows)
- **Task Queue**: Spring Batch (for bulk operations, SFTP processing)

### Authentication & Authorization
- **JWT**: jjwt library
- **MFA**: 
  - TOTP (Time-based One-Time Password) - Google Authenticator compatible
  - Spring Security with custom MFA provider
- **OAuth2**: Spring Security OAuth2 (if needed for future integrations)
- **Session Management**: Redis-backed sessions

### Monitoring & Observability
- **Application Monitoring**: 
  - Micrometer + Prometheus + Grafana
  - Or New Relic / Datadog (if budget allows)
- **Logging**: 
  - Logback/SLF4J
  - ELK Stack (Elasticsearch, Logstash, Kibana) or Loki + Grafana
- **Distributed Tracing**: Zipkin or Jaeger
- **Health Checks**: Spring Boot Actuator

### Testing
- **Unit Testing**: JUnit 5, Mockito
- **Integration Testing**: Spring Boot Test, TestContainers
- **E2E Testing**: Playwright or Cypress
- **API Testing**: REST Assured
- **BDD**: Cucumber (Given-When-Then scenarios)

### DevOps & Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes (for scalability) or Docker Compose (for smaller deployments)
- **CI/CD**: Jenkins, GitLab CI, or GitHub Actions
- **Infrastructure as Code**: Terraform or Ansible
- **Load Balancer**: Nginx or HAProxy
- **CDN**: CloudFront or Cloudflare (for static assets, UK edge locations)

### Additional Libraries & Tools
- **Metadata Parsing**:
  - MARC4J (for MARC21)
  - ONIXParser (for ONIX)
- **Email**: Spring Mail (JavaMail) or SendGrid/Mailgun API
- **Scheduling**: Spring Scheduler or Quartz
- **Excel Export**: Apache POI
- **Date/Time**: Java Time API (java.time)

---

## Architecture Flow

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
├──────────────────────┬──────────────────────────────────────────┤
│ Publisher Portal     │  Content Display Portal                 │
│ (React/TypeScript)   │  (React/TypeScript)                     │
└──────────┬───────────┴──────────────┬───────────────────────────┘
           │                          │
           │ HTTPS/WSS                │ HTTPS/WSS
           │                          │
┌──────────▼──────────────────────────▼───────────────────────────┐
│                    API Gateway / Load Balancer                  │
│                         (Nginx/HAProxy)                         │
└──────────┬──────────────────────────┬───────────────────────────┘
           │                          │
           │                          │
┌──────────▼──────────────────────────▼───────────────────────────┐
│                    Spring Boot Application Layer                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PSP API Services        │    CDP API Services           │  │
│  │  - Auth Service          │    - Content Service          │  │
│  │  - Submission Service    │    - Search Service           │  │
│  │  - Workflow Service      │    - Analytics Service        │  │
│  │  - User Management       │    - Concurrency Service      │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────┬──────────────────────────┬───────────────────────────┘
           │                          │
           │                          │
┌──────────▼──────────────────────────▼───────────────────────────┐
│                    Service Layer                                │
│  ┌──────────────┬──────────────┬──────────────┬─────────────┐  │
│  │ File         │ Metadata     │ Search       │ Analytics   │  │
│  │ Processing   │ Parser       │ Engine       │ Service     │  │
│  │ Service      │ Service      │ Service      │             │  │
│  └──────────────┴──────────────┴──────────────┴─────────────┘  │
└──────────┬──────────────────────────┬───────────────────────────┘
           │                          │
           │                          │
┌──────────▼──────────────────────────▼───────────────────────────┐
│                    Data & Storage Layer                         │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────────┐  │
│  │PostgreSQL│  Redis   │Elastic-  │Object    │  Message     │  │
│  │          │          │search    │Storage   │  Queue       │  │
│  │          │          │          │(S3/MinIO)│  (RabbitMQ)  │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Detailed Flow Diagrams

### 1. Content Submission Flow (Publisher Portal)

```
Publisher → Frontend (React)
    ↓
    [Upload Form: Metadata (MARC21/ONIX) + Files (PDF/ePub)]
    ↓
API Gateway → Spring Boot Controller
    ↓
Authentication Service (JWT + MFA validation)
    ↓
Submission Service
    ├─→ File Processing Service
    │   ├─ Validate file format (PDF/ePub)
    │   ├─ Calculate SHA-256 hash
    │   ├─ Extract metadata (Tika)
    │   └─ Upload to Object Storage (S3/MinIO)
    │
    ├─→ Metadata Parser Service
    │   ├─ Parse MARC21/ONIX
    │   └─ Convert ONIX → MARC21 (if needed)
    │
    ├─→ Duplicate Detection Service
    │   ├─ Check ISBN in PostgreSQL
    │   ├─ Compare hash values (Redis cache)
    │   └─ If duplicate → Create version
    │
    └─→ Workflow Service
        ├─ Check if Trusted Publisher → Auto-approve
        ├─ Else → Create workflow task (RabbitMQ)
        └─ Notify Library Staff (Email)
            ↓
        [Library Staff Reviews]
            ↓
        Approval/Rejection
            ├─ If Approved:
            │   ├─ Index in Elasticsearch
            │   ├─ Make available in CDP
            │   └─ Send to SFTP Archive (async)
            └─ If Rejected:
                └─ Notify Publisher
```

### 2. Content Display Flow (Display Portal)

```
Library Visitor → Frontend (React)
    ↓
IP Validation Service (Check if IP is from library network)
    ↓
API Gateway → Spring Boot Controller
    ↓
Content Display Service
    ├─→ Search Service (Elasticsearch)
    │   ├─ Metadata search
    │   └─ Return results
    │
    ├─→ Concurrency Control Service (Redis)
    │   ├─ Check if content is locked for this location
    │   ├─ If available → Create lock (TTL = session timeout)
    │   └─ If locked → Return "turnaway" message
    │
    └─→ Content Retrieval
        ├─ Get file URL from Object Storage
        ├─ Generate signed URL (time-limited)
        └─ Stream to browser
            ↓
        Frontend displays content
        ├─ PDF.js for PDFs
        └─ epub.js for ePubs
            ↓
        [User Actions]
        ├─ Bookmark → Save to PostgreSQL (if logged in)
        ├─ Search within → Full-text search (Elasticsearch)
        ├─ Print → Apply restrictions (if configured)
        └─ Cite → Generate citation
            ↓
        Analytics Event → RabbitMQ → Analytics Service
```

### 3. Authentication & Authorization Flow

```
User Login Request
    ↓
Spring Security Filter Chain
    ├─→ Username/Password Validation
    │   └─ Check against PostgreSQL
    │
    ├─→ MFA Challenge (if enabled)
    │   ├─ Generate TOTP code
    │   ├─ Send to user (Email/SMS)
    │   └─ Validate TOTP
    │
    └─→ Generate JWT Token
        ├─ Include: userId, roles, permissions
        ├─ Store refresh token in Redis
        └─ Return to client
            ↓
Client stores JWT (HttpOnly cookie or localStorage)
    ↓
Subsequent Requests
    ├─→ JWT Validation (Spring Security)
    ├─→ Role-based Authorization Check
    └─→ Allow/Deny access
```

### 4. SFTP Upload Flow

```
Library Staff → SFTP Server (Apache MINA SSHD)
    ↓
SFTP Listener Service (Spring Boot)
    ├─→ Monitor SFTP directory (scheduled job)
    ├─→ Process new files
    │
    ├─→ File Processing Service
    │   ├─ Validate format
    │   ├─ Extract metadata
    │   └─ Upload to Object Storage
    │
    ├─→ Metadata Parser Service
    │   └─ Parse MARC21/ONIX
    │
    └─→ Auto-approve (skip workflow)
        ├─ Index in Elasticsearch
        ├─ Make available in CDP
        └─ Log audit trail
```

### 5. Analytics & Reporting Flow

```
User Actions (CDP)
    ↓
Event Collection (Frontend)
    ├─ Content views
    ├─ Turnaways
    ├─ Search queries
    └─ Downloads
    ↓
Analytics API → RabbitMQ (async)
    ↓
Analytics Service (Spring Boot)
    ├─→ Aggregate events
    ├─→ Store in TimescaleDB/InfluxDB
    └─→ Update Redis cache (real-time stats)
    ↓
Daily Batch Job (Spring Batch)
    ├─→ Generate reports
    ├─→ Send to PSP (via API)
    └─→ Export to Excel/CSV
```

---

## Microservices vs Monolithic Architecture

### Recommended: **Modular Monolith** (with option to split later)

**Why:**
- Easier to develop and deploy initially
- Simpler debugging and testing
- Lower operational overhead
- Can split into microservices later if needed

**Structure:**
```
eldros-platform/
├── eldros-common/          (shared utilities, DTOs)
├── eldros-auth/            (authentication, authorization)
├── eldros-submission/       (PSP services)
├── eldros-display/         (CDP services)
├── eldros-file-processing/ (file handling)
├── eldros-search/          (search services)
├── eldros-analytics/       (analytics, reporting)
└── eldros-gateway/         (API gateway, routing)
```

**Alternative:** If team is large and needs independent scaling:
- Split into separate microservices
- Use Spring Cloud Gateway for routing
- Service discovery with Consul or Eureka

---

## Database Schema Design (High-Level)

### PostgreSQL Tables (Core)

```
users
├── id, email, password_hash, mfa_enabled, mfa_secret
├── publisher_id (FK), role, status
└── created_at, updated_at

publishers
├── id, name, registration_number
├── status (pending/approved/rejected/trusted)
└── embargo_settings

content_items
├── id, isbn, title, content_type (book/journal/music/other)
├── publisher_id (FK), status (draft/submitted/approved/rejected)
├── file_hash (SHA-256), file_size, file_url
├── metadata_json (MARC21 data)
├── version_number, parent_version_id
├── embargo_until, created_at, approved_at
└── workflow_status

content_files
├── id, content_item_id (FK)
├── file_type (pdf/epub), file_url, file_hash
├── version_number
└── uploaded_at

workflow_tasks
├── id, content_item_id (FK)
├── assigned_to (FK to users), status
├── action_required, comments
└── created_at, completed_at

concurrency_locks
├── content_item_id, library_location_id
├── user_id, session_id
├── locked_at, expires_at
└── (Redis: key = "lock:{content_id}:{location_id}")

bookmarks
├── id, user_id (FK), content_item_id (FK)
├── folder_id, labels
└── created_at

analytics_events
├── id, event_type (view/turnaway/search/download)
├── content_item_id, user_id, library_location_id
├── timestamp, metadata_json
└── (TimescaleDB for time-series queries)
```

### Elasticsearch Indices

```
content_index
├── _id (content_item_id)
├── title, author, publisher, isbn
├── content_type, language, publication_date
├── metadata (full MARC21 fields)
└── full_text (extracted from PDF/ePub)

search_suggestions_index
└── autocomplete suggestions
```

### Redis Keys (Examples)

```
sessions:{session_id} → User session data
locks:{content_id}:{location_id} → Concurrency lock
mfa:{user_id} → MFA challenge data
cache:content:{content_id} → Cached content metadata
cache:stats:{content_id} → Real-time view statistics
```

---

## Security Considerations

### 1. Authentication & Authorization
- **JWT Tokens**: Short-lived access tokens (15-30 min) + refresh tokens
- **MFA**: TOTP-based, required for all publisher accounts
- **Password Policy**: Strong passwords, password history, account lockout
- **Session Management**: Redis-backed, secure HttpOnly cookies

### 2. API Security
- **HTTPS Only**: TLS 1.3, enforce HTTPS redirects
- **Rate Limiting**: Spring Cloud Gateway or Redis-based rate limiting
- **CORS**: Strict CORS policy, whitelist library IPs for CDP
- **Input Validation**: All inputs validated, sanitized
- **SQL Injection Prevention**: Use parameterized queries (JPA/Hibernate)

### 3. File Security
- **Virus Scanning**: ClamAV or commercial solution
- **File Validation**: Strict format validation, size limits
- **Signed URLs**: Time-limited signed URLs for file access
- **Encryption**: Files encrypted at rest (S3 server-side encryption)

### 4. Data Protection
- **Encryption**: AES-256 at rest, TLS in transit
- **Audit Trail**: Log all sensitive operations (who, what, when)
- **Data Retention**: Automatic cleanup of old versions (6 months)
- **Backup**: Regular encrypted backups, tested restore procedures

### 5. Network Security
- **IP Whitelisting**: CDP only accessible from library IPs
- **Firewall**: Restrict database access, only allow necessary ports
- **VPN**: Secure access for admin operations
- **DDoS Protection**: CloudFlare or AWS Shield

---

## Performance Optimization

### 1. Caching Strategy
- **Redis**: 
  - Frequently accessed content metadata
  - User sessions
  - Concurrency locks
  - Search results (short TTL)
- **CDN**: Static assets (JS, CSS, images)
- **Browser Cache**: Aggressive caching for static content

### 2. Database Optimization
- **Indexing**: Proper indexes on frequently queried columns
- **Connection Pooling**: HikariCP (Spring Boot default)
- **Read Replicas**: For read-heavy operations (CDP)
- **Partitioning**: Partition analytics tables by date

### 3. Search Optimization
- **Elasticsearch**: 
  - Proper mapping and analyzers
  - Index aliases for zero-downtime updates
  - Sharding strategy for large datasets
- **Search Caching**: Cache popular searches

### 4. File Handling
- **Streaming**: Stream large files, don't load into memory
- **Chunked Uploads**: Support resumable uploads for large files
- **Thumbnails**: Generate and cache thumbnails/previews
- **Lazy Loading**: Load content on-demand in frontend

### 5. Async Processing
- **Message Queue**: Use RabbitMQ for:
  - File processing
  - Email notifications
  - Analytics events
  - SFTP processing
- **Background Jobs**: Spring Batch for:
  - Daily analytics aggregation
  - Old version cleanup
  - Report generation

---

## Deployment Architecture

### Recommended: Kubernetes (Production)

```
┌─────────────────────────────────────────┐
│         Load Balancer (Nginx)           │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Kubernetes Cluster (UK Region)    │
│  ┌──────────────────────────────────┐  │
│  │  PSP Frontend (React)            │  │
│  │  CDP Frontend (React)            │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  Spring Boot API (Multiple Pods) │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  Redis Cluster                   │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  PostgreSQL (Primary + Replicas) │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  Elasticsearch Cluster           │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  RabbitMQ                        │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Object Storage (S3/MinIO)          │
│      (UK Region, Encrypted)             │
└─────────────────────────────────────────┘
```

### Alternative: Docker Compose (Development/Staging)

```yaml
services:
  - postgresql
  - redis
  - elasticsearch
  - rabbitmq
  - spring-boot-api
  - react-frontend-psp
  - react-frontend-cdp
  - nginx (reverse proxy)
```

---

## Development Workflow

### 1. Local Development Setup
```bash
# Backend
cd eldros-backend
./mvnw spring-boot:run

# Frontend
cd eldros-frontend-psp
npm install
npm start

cd eldros-frontend-cdp
npm install
npm start
```

### 2. Testing Strategy
- **Unit Tests**: >80% code coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user journeys
- **Performance Tests**: Load testing with JMeter or Gatling

### 3. CI/CD Pipeline
```
Git Push → GitHub/GitLab
    ↓
Automated Tests (Unit + Integration)
    ↓
Build Docker Images
    ↓
Security Scan (Snyk/OWASP)
    ↓
Deploy to Staging
    ↓
E2E Tests
    ↓
Manual Approval
    ↓
Deploy to Production (Blue-Green Deployment)
```

---

## Monitoring & Alerting

### Key Metrics to Monitor
- **Application**: Response times, error rates, throughput
- **Infrastructure**: CPU, memory, disk, network
- **Database**: Query performance, connection pool usage
- **Cache**: Hit rates, memory usage
- **Search**: Query latency, index size
- **File Storage**: Storage usage, upload/download speeds

### Alerts
- **Critical**: Service down, database connection failures
- **Warning**: High error rates, slow response times
- **Info**: Storage thresholds, cache hit rate drops

---

## Migration & Rollout Strategy

### Phase 1: MVP (Months 1-3)
- Basic PSP (registration, upload, approval workflow)
- Basic CDP (search, view content)
- Core authentication
- PostgreSQL + Redis

### Phase 2: Enhanced Features (Months 4-6)
- MFA implementation
- Full-text search (Elasticsearch)
- Concurrency control
- Analytics

### Phase 3: Advanced Features (Months 7-9)
- SFTP integration
- Advanced analytics
- Personalization features
- Performance optimization

### Phase 4: Production Hardening (Months 10-12)
- Security audit
- Load testing
- Disaster recovery testing
- Documentation

---

## Cost Considerations (UK-Based)

### Infrastructure Costs (Estimated Monthly)
- **Compute**: £500-2000 (depending on instance sizes)
- **Database**: £300-800 (PostgreSQL managed service)
- **Storage**: £200-500 (6.5TB object storage)
- **Search**: £400-1000 (Elasticsearch managed service)
- **CDN**: £100-300
- **Monitoring**: £100-300

**Total**: ~£1,600-4,900/month (scales with usage)

---

## Conclusion

This architecture provides:
- ✅ Scalability (can handle growth beyond 6.5TB)
- ✅ High Availability (99.931% uptime target)
- ✅ Security (encryption, MFA, audit trails)
- ✅ Performance (caching, async processing)
- ✅ Maintainability (modular structure, clear separation)
- ✅ UK Compliance (all data in UK)

The modular monolith approach allows for rapid development while maintaining the option to split into microservices later if needed.
