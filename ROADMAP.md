# features wip

- Cross server copy (requires changing wings semantics)
- Reorder server + Categorize server (https://blueprint.zip/browse/serverorganizer)
- Reworked file explorer and editor (https://blueprint.zip/browse/betterfilesmanager)

## Pre-flight checklist (before switching DNS/proxy to beta)

### Critical (blocking)
- [ ] Build and push new Docker image (`ghcr.io/langduamc/panel:1.0-develop`) containing all committed fixes
- [ ] Regenerate user API keys (current ones undecryptable — view shows `****`)
- [ ] Update Wings daemon configs with new node tokens on both nodes
- [ ] Verify Wings connectivity: `/resources` endpoint on console page

### Should test
- [ ] Server **Databases** page (create/delete)
- [ ] Server **Schedules** page (create/edit/delete)
- [ ] Server **Backups** page (list/create)
- [ ] Server **Subusers** page (list/create)
- [ ] **File manager** — read, write, rename, delete files via new inline editor
- [ ] **SSH keys** — add/remove in account settings
- [ ] **New user registration** — confirm email flow works
- [ ] **Create new server** via admin panel
- [ ] **Create new API key** (should show correctly since new keys use current APP_KEY)
- [ ] Password reset flow

### After switchover
- [ ] Point domain DNS / reverse proxy to beta panel IP
- [ ] Monitor error logs for first 24h
- [ ] Remove old references to `sed` patching in startup script (no longer needed)
