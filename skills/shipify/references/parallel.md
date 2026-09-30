# Parallel work

## Isolate each writer

Give every editing worker one worktree on its own branch. Use absolute paths in the
brief and in `git worktree add`; never send two writers into one checkout. Read-only
reviewers may inspect a writer's tree. Share installed dependencies by symlink when
the lockfile and platform match; keep databases, caches and generated output isolated.

Before editing and before staging, run `git status --short` in the assigned worktree.
Identify another writer's files and leave them alone. Stage only the named files you
changed, never a blind `git add -A`.

## Allocate ports and own the servers

Assign each worker a distinct port range, including browser control, preview, API and
reload ports. Check `ss -ltnp` before starting; a free app port does not prove its
control port is free. Put the full range and server commands in the brief.

Start test servers detached, with logs in the worker's isolated directory. For example:

```sh
nohup env PORT=5920 npm run dev > /tmp/worker-5920.log 2>&1 < /dev/null &
```

Wait for readiness at the assigned URL and read the logs if it fails. Use the worker's
own data and cache; never run test traffic against persistent production data.

To stop a server, inspect `ss -ltnp 'sport = :5920'`, verify that the listed PID belongs
to this worker, then send that PID `TERM`. Recheck the port. Never use `pkill -f`, which
can stop unrelated workers. Include control ports in cleanup.

## Prove the visual result

Rebuild the production bundle after the final edit and serve that bundle before
taking screenshots. A stale bundle or development-only result is not proof of the
shipped artifact. Wait for fonts, images and the intended UI state to settle.

Check phone (390 px) and desktop widths, in both light and dark themes when supported.
Exercise the changed state at each viewport; a screenshot of an untouched screen
does not verify the change. Record the URL, viewport, theme, state and screenshot path.

Open and inspect every screenshot cited in the report. Check clipping, overlap,
contrast and the changed behavior itself. A file existing is not visual verification.
Report an unavailable viewport or theme as a limitation, never as a passed check.
