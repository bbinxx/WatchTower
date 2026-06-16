#!/bin/bash
# Create GitHub releases for all tags with auto-generated changelogs
# Usage: GITHUB_TOKEN=ghp_xxx ./scripts/create-releases.sh

set -e

if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN environment variable is required"
  echo "Usage: GITHUB_TOKEN=ghp_xxx ./scripts/create-releases.sh"
  exit 1
fi

REPO="bbinxx/WatchTower"
API="https://api.github.com/repos/$REPO"

echo "Fetching existing releases..."
EXISTING=$(curl -s -H "Authorization: token $GITHUB_TOKEN" "$API/releases" | grep -o '"tag_name": "[^"]*"' | cut -d'"' -f4)

for tag in $(git tag --sort=version:refname); do
  if echo "$EXISTING" | grep -q "^${tag}$"; then
    echo "  $tag - already exists, skipping"
    continue
  fi

  echo "  $tag - creating release..."

  PREV_TAG=$(git tag --sort=version:refname | grep -B1 "^${tag}$" | head -1)

  if [ -z "$PREV_TAG" ] || [ "$PREV_TAG" = "$tag" ]; then
    CHANGES=$(git log --pretty=format:"- %s" "${tag}")
  else
    ADDED=$(git log --pretty=format:"- %s" "${PREV_TAG}..${tag}" --grep="^feat")
    FIXED=$(git log --pretty=format:"- %s" "${PREV_TAG}..${tag}" --grep="^fix")
    CHANGED=$(git log --pretty=format:"- %s" "${PREV_TAG}..${tag}" --grep="^refactor\|^perf\|^ci\|^docs")

    BODY="## What's Changed\n\n"
    [ -n "$ADDED" ] && BODY="${BODY}### Added\n${ADDED}\n\n"
    [ -n "$FIXED" ] && BODY="${BODY}### Fixed\n${FIXED}\n\n"
    [ -n "$CHANGED" ] && BODY="${BODY}### Changed\n${CHANGED}\n\n"

    if [ -z "$ADDED" ] && [ -z "$FIXED" ] && [ -z "$CHANGED" ]; then
      BODY="${BODY}$(git log --pretty=format:"- %s" "${PREV_TAG}..${tag}")"
    fi
    CHANGES="$BODY"
  fi

  PAYLOAD=$(cat <<EOF
{
  "tag_name": "$tag",
  "name": "$tag",
  "body": "${CHANGES}",
  "draft": false,
  "prerelease": false
}
EOF
)

  curl -s -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    "$API/releases" > /dev/null

  echo "  $tag - created"
  sleep 1
done

echo "Done!"
