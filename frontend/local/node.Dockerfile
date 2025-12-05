FROM node:16

WORKDIR /opt/roobet

RUN apt-get update -yq \
  && apt-get upgrade -yq \
  && apt-get install -yq \
  jq \
  apache2-utils \
  curl \
  git \
  g++ \
  libssl-dev \
  make \
  musl-dev \
  nano \
  python \
  gettext-base \
  && ln -s /usr/lib/x86_64-linux-musl/libc.so /lib/libc.musl-x86_64.so.1

# use changes to package.json to force Docker not to use the cache
# when we change our application's nodejs dependencies:
COPY package.json ./
COPY package-lock.json ./
COPY .npmrc ./

RUN chown -R node .
USER node

# clean install node modules
RUN npm ci

CMD [ "bash", "-c", "sed -i \"s|<env />|<script>window.__env = $$(jq -ncr env | sed 's/ *$$//g' | sed 's/&/\\\\&/g')</script>|\" src/index.html && npm run dev"]
