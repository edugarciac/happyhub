## 1. Implementation

- [x] 1.1 `.github/workflows/db-backup.yml`
- [x] 1.2 `docs/project_notes/db-restore.md`
- [x] 1.3 ADR-011 in `docs/project_notes/decisions.md`

## 2. Setup (owner)

- [ ] 2.1 IAM user with `s3:PutObject` on `arn:aws:s3:::<bucket>/backups/*`
- [ ] 2.2 GitHub secrets `DATABASE_URL_BACKUP`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and variables `AWS_REGION`, `BACKUP_S3_BUCKET`
- [ ] 2.3 S3 lifecycle rule: expire `backups/` after 90 days
- [ ] 2.4 Run the workflow manually and check the file in S3
- [ ] 2.5 Test a restore into a Neon branch (see `db-restore.md`)
