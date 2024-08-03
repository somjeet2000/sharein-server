#!/bin/bash

# Define variables
RENDER_SERVICE_ID="your-render-service-id"
RENDER_API_KEY="your-render-api-key"
IMAGE_NAME="your-dockerhub-username/your-repo-name"
IMAGE_TAG="${IMAGE_NAME}:${BUILD_ID}"

# Trigger deploy on Render
curl -X POST \
  -H "Authorization: Bearer ${RENDER_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"serviceId": "'"${RENDER_SERVICE_ID}"'", "image": "'"${IMAGE_TAG}"'"}' \
  https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys
