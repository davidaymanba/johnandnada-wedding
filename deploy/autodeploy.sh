#!/usr/bin/env bash
# Cron on the VPS runs this every minute: if GitHub's main moved, deploy it.
# Installed by /etc/cron.d/johnandnada-deploy (see README).
set -euo pipefail

main() {
  cd /docker/johnandnada
  exec 8>.autodeploy.lock
  flock -n 8 || exit 0 # a deploy is already running

  git -C app fetch --quiet origin main
  [ "$(git -C app rev-parse HEAD)" = "$(git -C app rev-parse origin/main)" ] && exit 0

  echo "== $(date -u '+%F %T') UTC"
  /docker/johnandnada/app/deploy/deploy.sh
}
main "$@"
