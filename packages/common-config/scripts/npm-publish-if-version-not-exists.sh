#!/usr/bin/env bash

PWD="${1}"
if [ -z "${1}" ]; then
  echo -e "${0}: ERROR: No pwd"
  exit 1
fi

# Change to package root
cd "$PWD" || exit 2

# Extract package name and version from package.json
PACKAGE_NAME=$(node -p "require('./package.json').name")
PACKAGE_VERSION=$(node -p "require('./package.json').version")

echo "${PWD}"
echo "${PACKAGE_NAME}"
echo "${PACKAGE_VERSION}"

# Only publish the package if the version is not already available
if pnpm view "${PACKAGE_NAME}@${PACKAGE_VERSION}" > /dev/null 2>&1; then
  echo "Version ${PACKAGE_NAME}@${PACKAGE_VERSION} already exists. Skipping publish."
else
  pnpm publish --access public
fi
