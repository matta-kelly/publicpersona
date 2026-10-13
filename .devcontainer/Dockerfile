FROM mcr.microsoft.com/devcontainers/javascript-node:22
# Chromium needs system libraries that the base image lacks. The version is the one of @playwright/test in package.json.
RUN npx --yes playwright@1.64.0 install-deps chromium
