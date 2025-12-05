FROM node:16

WORKDIR /opt/roobet

RUN apt-get update -yq \
  && apt-get upgrade -yq \
  && apt-get install -yq \
  apache2-utils \
  curl \
  git \
  g++ \
  libssl-dev \
  make \
  musl-dev \
  nano \
  python \
  && ln -s /usr/lib/x86_64-linux-musl/libc.so /lib/libc.musl-x86_64.so.1

RUN mkdir -p vendors
COPY vendors/ vendors/

COPY . .

RUN chown -R node .
USER node

# clean install node modules
RUN npm ci
