# Deposit branch — Publisher Submissions Portal (PSP)

This folder is the **PSP slice** of the overall ELDROS requirements: **where publishers send content** and staff manage workflows.

## Source documents

- `requitrements/PROJECT_SUMMARY.md`
- `requitrements/TECH_STACK_ARCHITECTURE.md`
- `requitrements/British-Library-BDD-Submissions-ContentDisplay_V1_2.docx`
- (Change requests) `requitrements/ELDROS HighWire change requests (1) (1).xlsx`

## PSP scope (from the summary)

- **Publisher registration**
  - Guest requests registration + accepts T&Cs
  - Library staff approve/reject
  - Publisher becomes **Standard** (needs approval workflow) or **Trusted** (auto-approved submissions)
- **Content submission**
  - Upload metadata (MARC21 / ONIX) + content files (PDF/ePub)
  - Duplicate detection (ISBN + file hash/size)
  - Versioning (new version on update; retention for old versions)
- **Workflow**
  - Staff review: edit / approve / reject
  - On approval: content becomes available to CDP + sent to archive (SFTP async)
- **Security**
  - Auth required + **MFA**

## Architecture mapping (from tech stack doc)

Key PSP services to expect:

- Auth Service (JWT + MFA)
- Submission Service (file validation + hashing + storage)
- Metadata Parser (ONIX→MARC if needed)
- Duplicate Detection Service (hashing)
- Workflow Service (trusted auto-approve vs staff queue)

## Related prototype code

- PSP prototype lives in `deposit/` (3 files):
  - `deposit/frontend.html`
  - `deposit/backend.js`
  - `deposit/requirements.md`

