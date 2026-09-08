#!/usr/bin/env bash
#
# backup_safar.sh — three-layer backup for the Urdu Safar project
#
#   Layer 1: local copy      -> /mnt/storage/project_backups/safar_backup/
#   Layer 2: Google Drive    -> https://drive.google.com/drive/folders/1UvdAuwv-Gp67cHBCxVf28DahukxJHh3Q
#   Layer 3: GitHub          -> https://github.com/AwaizFatima08/safar
#
# Run it manually:   bash /mnt/storage/projects/Safar/scripts/backup_safar.sh
# Or on a schedule (see the cron note at the bottom of this file).
#
# ---------------------------------------------------------------------------
# ONE-TIME SETUP THIS SCRIPT CANNOT DO FOR YOU
# ---------------------------------------------------------------------------
# Both the Google Drive and GitHub layers need a login/authorization step
# done once, by you, in a browser or terminal on this NAS — nothing remote
# can do this on your behalf, since it requires your own account consent.
#
# A) Google Drive (via rclone — the standard tool for this):
#    1. Install:          sudo apt install rclone      (or see rclone.org/downloads)
#    2. Configure once:   rclone config
#         - "n" for a new remote
#         - name it exactly:  gdrive          (matches GDRIVE_REMOTE below)
#         - choose "Google Drive" from the storage list
#         - leave client_id/client_secret blank (use rclone's defaults) unless
#           you've made your own Google API credentials
#         - when it opens a browser link, sign in as homi55@gmail.com and
#           approve access
#    3. Test it once:     rclone lsd gdrive:
#       You should see your Drive folders listed. If that works, this
#       script's Google Drive layer will work too.
#
# B) GitHub (AwaizFatima08/safar):
#    Pick ONE:
#      - SSH (recommended): make sure this NAS has an SSH key added to the
#        GitHub account that owns/collaborates on the repo, then set
#        GIT_REMOTE_URL below to:  git@github.com:AwaizFatima08/safar.git
#      - HTTPS + token: set GIT_REMOTE_URL to the https:// form, and run
#        `git push` once by hand first so you can enter a username and a
#        Personal Access Token (not your GitHub password) — git will offer
#        to remember it via a credential helper afterwards.
#
# Until both of those are done once, this script's local-backup layer will
# still work every time; the other two will log a clear skip/warning
# instead of silently failing.
# ---------------------------------------------------------------------------

set -uo pipefail

# ---- CONFIG — adjust here if any path/name changes ----
PROJECT_DIR="/mnt/storage/projects/Safar"
LOCAL_BACKUP_ROOT="/mnt/storage/project_backups/safar_backup"
GDRIVE_REMOTE="gdrive"                                   # must match the remote name from `rclone config`
GDRIVE_FOLDER_ID="1UvdAuwv-Gp67cHBCxVf28DahukxJHh3Q"      # from the Drive folder URL you gave
GIT_REMOTE_URL="git@github.com:AwaizFatima08/safar.git"   # switch to the https:// form if you're using a token instead of SSH
KEEP_LOCAL_BACKUPS=10                                     # how many timestamped local copies to keep before pruning the oldest

TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"
LOG_FILE="$PROJECT_DIR/scripts/backup.log"
mkdir -p "$(dirname "$LOG_FILE")"

log(){ echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

log "=== Starting Safar backup: $TIMESTAMP ==="

if [ ! -d "$PROJECT_DIR" ]; then
  log "FATAL: project folder not found at $PROJECT_DIR — aborting."
  exit 1
fi

# ---------------------------------------------------------------------------
# Layer 1: local backup
# ---------------------------------------------------------------------------
log "Layer 1: local backup"
mkdir -p "$LOCAL_BACKUP_ROOT"
DEST="$LOCAL_BACKUP_ROOT/safar_$TIMESTAMP"
if rsync -a --exclude 'scripts/backup.log' "$PROJECT_DIR/" "$DEST/"; then
  log "  OK — copied to $DEST"
else
  log "  ERROR — local rsync backup failed"
fi

# prune old local backups, keep the newest KEEP_LOCAL_BACKUPS
if [ -d "$LOCAL_BACKUP_ROOT" ]; then
  cd "$LOCAL_BACKUP_ROOT" || true
  ls -1dt safar_*/ 2>/dev/null | tail -n +$((KEEP_LOCAL_BACKUPS + 1)) | while read -r old; do
    log "  pruning old local backup: $old"
    rm -rf "${old:?}"
  done
  cd "$PROJECT_DIR" || true
fi

# ---------------------------------------------------------------------------
# Layer 2: Google Drive backup (rclone)
# ---------------------------------------------------------------------------
log "Layer 2: Google Drive backup"
if ! command -v rclone >/dev/null 2>&1; then
  log "  SKIPPED — rclone is not installed. See the setup notes at the top of this script."
elif ! rclone listremotes 2>/dev/null | grep -q "^${GDRIVE_REMOTE}:"; then
  log "  SKIPPED — rclone remote '$GDRIVE_REMOTE' isn't configured yet. See the setup notes at the top of this script."
else
  if rclone copy "$PROJECT_DIR" "${GDRIVE_REMOTE}:" \
      --drive-root-folder-id "$GDRIVE_FOLDER_ID" \
      --exclude "scripts/backup.log" \
      --update --checksum \
      --log-file="$LOG_FILE" --log-level INFO; then
    log "  OK — synced to Google Drive folder ($GDRIVE_FOLDER_ID)"
  else
    log "  ERROR — rclone sync to Google Drive failed (see log above for detail)"
  fi
fi

# ---------------------------------------------------------------------------
# Layer 3: Git backup (GitHub)
# ---------------------------------------------------------------------------
log "Layer 3: Git backup"
cd "$PROJECT_DIR" || exit 1

if [ ! -d .git ]; then
  log "  initializing git repo in $PROJECT_DIR"
  git init -q -b main
  git remote add origin "$GIT_REMOTE_URL"
  { echo "scripts/backup.log"; } > .gitignore
fi

# make sure the remote URL matches config, in case it's changed
git remote set-url origin "$GIT_REMOTE_URL" 2>/dev/null || true

git add -A
if git diff --cached --quiet; then
  log "  no changes to commit"
else
  git commit -q -m "Backup: $TIMESTAMP"
  log "  committed changes"
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
if git push -u origin "$CURRENT_BRANCH" >>"$LOG_FILE" 2>&1; then
  log "  OK — pushed to $GIT_REMOTE_URL ($CURRENT_BRANCH)"
else
  log "  ERROR — git push failed. Check the setup notes at the top of this script (SSH key or token)."
fi

log "=== Backup finished: $TIMESTAMP ==="
echo
echo "Full log: $LOG_FILE"

# ---------------------------------------------------------------------------
# OPTIONAL: run this automatically, e.g. nightly at 2am, via cron:
#   crontab -e
#   then add this line:
#   0 2 * * * /usr/bin/bash /mnt/storage/projects/Safar/scripts/backup_safar.sh >> /mnt/storage/projects/Safar/scripts/backup.log 2>&1
# ---------------------------------------------------------------------------
