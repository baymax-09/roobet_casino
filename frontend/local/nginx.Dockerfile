# Dockerfile for nginx container meant strictly for local development
FROM nginx
ARG TARGET

RUN apt-get update -yq \
  && apt-get upgrade -yq \
  && apt-get install -yq \
  jq \
  sed \
  bash

# CMD [ "bash", "-c", "sed -i \"s|<env />|<script>window.__env = $$(jq -ncr env | sed 's/ *$$//g' | sed 's/&/\\\\&/g')</script>|\" src/index.html && npm run dev"]
