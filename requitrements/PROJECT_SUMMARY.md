# ELDROS Project - Simple Overview
 
## What is This Project?
 
**ELDROS** stands for **Electronic Legal Deposit Restoration of Services**. This is a project to build a replacement system for the British Library's Publisher Portal and Content Display Portal.
 
### The Big Picture
- **Problem**: After a cyber-attack, the British Library needs a new secure platform
- **Solution**: Build two portals using HighWire platform:
  1. **Publisher Submissions Portal (PSP)** - Where publishers send content
  2. **Content Display Portal (CDP)** - Where users view content at library terminals
 
---
 
## Two Main Portals
 
### 1. Publisher Submissions Portal (PSP)
**Who uses it**: Publishers and Library Staff  
**What it does**: Allows publishers to submit content (books, journals, music, etc.) to the library
 
**Key Features**:
- Publishers register and get approved by library staff
- Publishers upload content files (PDF/ePub) and metadata
- Library staff review, approve, or reject submissions
- Content goes through a workflow before being published
- "Trusted" publishers can skip approval workflow
 
### 2. Content Display Portal (CDP)
**Who uses it**: Library visitors at physical library terminals  
**What it does**: Displays content to users within library buildings
 
**Key Features**:
- Search across all content
- View books, journals, music, etc. in browser
- Personalization (bookmarks, saved searches)
- Only accessible from library terminals (IP-based access)
- One person per location can view each content item at a time (concurrency control)
 
---
 
## Content Types
 
The system handles 4 main content types:
 
1. **Books**
   - Book Series (optional parent)
   - Books
   - Chapters
   - Supplementary materials
 
2. **Journals**
   - Journal
   - Journal Issue
   - Journal Article
   - Supplementary materials
 
3. **Music**
   - Series
   - Scores
   - Parts
   - Supplementary materials
 
4. **Other Material**
   - Loose leaf
   - Other types
   - Supplementary materials
 
---
 
## How Content Gets Into the System
 
There are **3 ways** content can be added:
 
1. **Manual Browser Upload**
   - Publisher fills out form in browser
   - Uploads metadata file (MARC21 or ONIX) and content files
   - Goes through approval workflow
 
2. **Bulk Upload via Browser**
   - Upload up to 50 files at once
   - One metadata file can correspond to multiple content files
   - Same workflow as individual uploads
 
3. **Automated SFTP Feed**
   - Library staff upload content directly via SFTP
   - No approval workflow needed
   - Used for bulk operations
 
---
 
## Key Workflows
 
### Registration Workflow
1. Guest user requests registration
2. Accepts terms & conditions
3. Request goes to library staff queue
4. Library staff approves or rejects
5. If approved, user gets email to set up password
6. User becomes "Standard Publisher" (needs approval) or "Trusted Publisher" (auto-approved)
 
### Content Submission Workflow
1. Publisher selects content type
2. Uploads metadata (MARC21/ONIX) and content files (PDF/ePub)
3. System checks for duplicates
4. Content enters workflow (unless Trusted Publisher)
5. Library staff can edit, approve, or reject
6. If approved, content goes to Display Portal
7. Content also sent to SFTP for archiving
 
### Content Display Workflow
1. User searches in library catalog system (like Primo)
2. Clicks on content → opens in new tab on Display Portal
3. User views content in browser
4. Can bookmark, print, cite, search within content
5. Only one person per library location can view same content at once
 
---
 
## Important Features
 
### Security & Access
- **Publisher Portal**: Requires login + Multi-Factor Authentication (MFA)
- **Display Portal**: IP-based access (only works in library buildings)
- Individual users can log in for personalization features
- All data encrypted in transit and at rest
 
### Duplicate Detection
- System checks if content already exists using ISBN matching
- Compares file sizes or hash values
- If duplicate found, creates new version instead of duplicate entry
 
### Versioning
- Publishers can update content (creates new version)
- Old versions kept for 6 months, then deleted
- Only latest version visible to end users
- Publishers and staff can download any version
 
### Embargoes
- Library staff can set embargoes (delay when content becomes visible)
- Can be set at publisher level or content level
- Content not visible until embargo period ends
 
### Concurrency Control
- Each content item can only be viewed by ONE person per library location at a time
- If someone else is viewing it, you see a "turnaway" message
- Library staff and catalog staff are exempt from this restriction
 
---
 
## Technical Details
 
### File Formats
- **Content**: PDF (PDF/A, PDF/X, PDF/E, PDF/VT, PDF/UA) or ePub (2.0-3.3)
- **Metadata**: MARC21 or ONIX (ONIX converted to MARC21 automatically)
- **Storage**: Up to 6.5 TB total content
 
### Search Features
- **Global Search**: Search across all metadata (not full text)
- **Search Within Content**: Full-text search within individual items
- **Filters**: By content type, publisher, language, date, author, publication
 
### Personalization (for logged-in users)
- Bookmarks
- Labels/Folders
- Saved searches
- Email alerts for saved searches
 
### Analytics & Reporting
- Usage statistics sent daily from Display Portal to Submissions Portal
- Shows accesses per content item, per library location
- Turnaway analytics (how many people couldn't access content)
- Exportable reports
 
---
 
## User Types
 
### Publisher Submissions Portal:
1. **Guests** - Can view homepage, register
2. **Publisher Staff** - Can submit content, view their submissions
3. **Library Staff** - Can approve/reject content, manage users
4. **Catalog Staff** - Can manage cataloging
 
### Content Display Portal:
1. **Guest Users** - Can view content (IP-based access)
2. **Logged-in Users** - Can use personalization features
3. **Library Staff** - Can view content without concurrency limits
4. **Catalog Staff** - Can view content without concurrency limits
 
---
 
## Non-Functional Requirements
 
### Performance
- 99.931% uptime per month
- Optimized page load times
- Lazy loading for images
 
### Accessibility
- WCAG 2.2 AA compliant
- Works with browser accessibility tools
- Supports screen readers, keyboard navigation
 
### Languages
- Interface available in English and Welsh
- Content itself not translated (displays in original language)
 
### Data Storage
- All data stored in UK
- Encrypted at rest and in transit
- Regular backups (HighWire has never lost publisher content)
 
---
 
## Change Requests (Additional Requirements)
 
The Excel file shows 9 change requests that weren't in original scope:
 
1. **Content volume increase** (1TB → 6.5TB) - 40 hours
2. **Configurable link back to library system** - 59 hours
3. **Print restrictions** - 78 hours (on hold)
4. **Versioning on Other Material** - 280 hours (REJECTED)
5. **Paragraph-based citations** - 100 hours
6. **Turnaway analytics** - 75 hours
7. **Audit trail in downstream deposit** - 70 hours
8. **Use hashing in duplicate detection** - 49 hours
9. **Receive content via SFTP** - 44 hours
 
**Total**: ~24 weeks of additional work
 
---
 
## Key Dates & Status
 
- **Document Version**: 1.2
- **Date**: 12th January 2026
- **Status**: Build specification document (not yet implemented)
 
---
 
## Important Notes
 
1. **No Migration**: When launched, there will be no existing content, users, or publishers migrated
2. **UK-Based**: All servers and data storage in UK
3. **Modern Standards**: Built to modern security, accessibility, and performance standards
4. **Scalable**: Designed to handle growth beyond initial 6.5TB estimate
 
---
 
## What is BDD?
 
**BDD (Behavior-Driven Development)** is a software development approach that focuses on describing how the system should behave from a user's perspective. While this document doesn't contain formal BDD scenarios (Given-When-Then format), it describes:
 
- **User stories** (what users need to do)
- **Workflows** (step-by-step processes)
- **Acceptance criteria** (what success looks like)
- **Functional requirements** (what the system must do)
 
The document serves as the **requirements specification** that would 
 
