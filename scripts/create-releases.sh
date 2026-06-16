#!/bin/bash
# Create GitHub releases for all tags
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
  if [ "$PREV_TAG" = "$tag" ] || [ -z "$PREV_TAG" ]; then
    BODY=$(git log --pretty=format:"- %s (\`%h\`)" "${tag}")
  else
    BODY=$(git log --pretty=format:"- %s (\`%h\`)" "${PREV_TAG}..${tag}")
  fi

  PAYLOAD=$(cat <<EOF
{
  "tag_name": "$tag",
  "name": "$tag",
  "body": "## Changes\n\n${BODY}",
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
