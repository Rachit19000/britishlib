# Display branch — Content Display Portal (CDP)

This folder is the **CDP slice** of the overall ELDROS requirements: **where users view content at library terminals**.

## Source documents

- `requitrements/PROJECT_SUMMARY.md`
- `requitrements/TECH_STACK_ARCHITECTURE.md`
- `requitrements/British-Library-BDD-Submissions-ContentDisplay_V1_2.docx`
- (Change requests) `requitrements/ELDROS HighWire change requests (1) (1).xlsx`

## CDP scope (from the summary)

- **Access control**
  - CDP is **IP-based** (only accessible from library terminals / building network)
- **Search**
  - Search across metadata (and later, full-text within items)
  - Filters by content type, publisher, language, date, etc.
- **Content viewing**
  - View PDFs/ePubs in-browser
  - Personalization (optional, for logged-in users): bookmarks, saved searches
- **Concurrency control (turnaway)**
  - “Only one person per library location can view each content item at a time”
  - Staff/certain roles may be exempt (full role model out-of-scope for this split doc)
- **Analytics**
  - Capture views, turnaways, searches; provide reports back to PSP

## Architecture mapping (from tech stack doc)

Key CDP services to expect:

- IP validation service / network gate
- Search service (Elasticsearch/Solr)
- Concurrency service (Redis locks with TTL)
- Content retrieval (signed URLs; streaming)
- Analytics event pipeline (async)

## Related prototype code

- CDP prototype lives in `display/` (3 files):
  - `display/frontend.html`
  - `display/backend.js`
  - `display/requirements.md`

