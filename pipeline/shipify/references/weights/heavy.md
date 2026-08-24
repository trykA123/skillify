# Heavy execution overlay

Read [Standard](standard.md) first. This overlay adds controls; it never replaces the
baseline, per-step verification, deviation classification or acceptance flow.

## Before mutation

- Use a dedicated branch and worktree when another writer or live delivery lane exists.
  Record the baseline revision and preserve unrelated dirty state.
- Resolve destructive targets read-only and obtain explicit authority immediately
  before mutation. Approval for the outcome is not blanket mutation approval.
- Prove that backup or rollback restores the state that matters; existence alone is not
  a recovery drill.

## During execution

- Keep risky slices independently committable and preserve the recovery point before
  crossing another irreversible boundary.
- Exercise a realistic failure path for each changed safety, data, auth, deployment or
  public-contract boundary. Mocks may isolate the trigger; the consequence must be
  observable.
- Keep writers in separate worktrees. Read-only agents may inspect the same revision;
  only the named integration owner combines results.
- Record mutations, approvals and recovery evidence without copying secrets.

## Completion

Run the packet's rollback or recovery check, not only its happy path. Heavy work always
requires an independent Reviewify pass. If independence is unavailable, report Partial
with the residual risk; never self-approve.
