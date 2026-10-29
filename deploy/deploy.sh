#!/usr/bin/env bash
# Runs on the VPS (GitHub Actions calls it over SSH after every push to main).
# Pulls the latest main into /docker/johnandnada/app and rebuilds the container.
set -euo pipefail

# Wrapped in a function so bash reads the whole file before `git reset` can rewrite it.
main() {
  cd /docker/johnandnada
  exec 9>.deploy.lock
  flock 9 # one deploy at a time

  git -C app fetch --quiet origin main
  git -C app reset --hard --quiet origin/main
  echo "Deploying $(git -C app log -1 --format='%h %s')"

  cp app/deploy/docker-compose.yml docker-compose.yml
  docker compose up -d --build --remove-orphans
  docker image prune -f >/dev/null

  for i in $(seq 1 30); do
    if docker compose exec -T web wget -qO /dev/null http://127.0.0.1:3000/; then
      echo "Live: https://johnandnada.codexai.systems"
      exit 0
    fi
    sleep 2
  done
  echo "Site did not answer after deploy" >&2
  docker compose logs --tail 40 web >&2
  exit 1
}
main "$@"
