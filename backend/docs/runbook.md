# Runbook (Essential Operational Commands)

This runbook contains command examples and procedures for common operational
tasks for NexusLMS in a managed deployment.

Environment prerequisite

- Ensure `python` and `docker` are available on the host (or use provided
  Docker images).
- Set environment variables from `.env` or secret manager.

Common tasks

1. Apply database migrations

```bash
# activate virtualenv or use container
python backend/manage.py migrate
```

2. Create groups and sync existing users

```bash
python backend/manage.py init_groups --sync-users
```

3. Collect static files

```bash
python backend/manage.py collectstatic --noinput
```

4. Backup database (Postgres example)

```bash
pg_dump --dbname="$DATABASE_URL" -Fc -f /backups/nexuslms-$(date +%F).dump
```

5. Restore database (example)

```bash
pg_restore --clean --no-owner --dbname="$DATABASE_URL" /backups/nexuslms-2026-03-01.dump
```

6. Rolling deploy (Docker example)

- Build image locally and push to registry

```bash
docker build -t registry.example.com/nexuslms/backend:latest ./backend
docker push registry.example.com/nexuslms/backend:latest
```

- Update service (ECS/K8s/compose) to use new image and verify health checks.

7. Troubleshooting

- Check web logs: `docker logs <container>` or cloud provider logs
- Check Celery: `systemctl status celery` or container logs
- Database connectivity: `python -c "import django; django.setup(); from django.db import connections; print(connections['default'].introspection.table_names())"`

8. Emergency rollback

- Re-deploy previous image tag and re-run migrations if needed.

9. Contact & escalation

- Support lead: ops@example.com
- On-call: +1-555-OPS (Gold SLA only)

Automation & CI

- Include DB migration and smoke test in CI before deployment
- Run integration tests in staging environment

Recovery drills

- Schedule monthly restore tests from backups to validate procedures

---

Add provider-specific commands (EKS, ECS, Azure) as part of final handover.
