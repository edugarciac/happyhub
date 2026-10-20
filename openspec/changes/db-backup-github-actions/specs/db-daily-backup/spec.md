## MODIFIED Requirements

### Requirement: Daily verified database backup
The system SHALL create a daily backup of the Neon database with `pg_dump --format=custom`, verify it can be read by `pg_restore --list`, and upload it to `s3://<bucket>/backups/YYYY-MM/happyhub_YYYY-MM-DD_HHmm.dump`.

#### Scenario: Scheduled run
- **WHEN** the daily schedule fires
- **THEN** a new verified dump SHALL be uploaded to S3 under the current month's folder

#### Scenario: Backup fails
- **WHEN** the dump, the verification or the upload fails
- **THEN** the workflow SHALL fail and GitHub SHALL notify the repository owner by email

#### Scenario: Manual run
- **WHEN** the owner runs the workflow manually from GitHub → Actions
- **THEN** it SHALL produce a backup immediately
