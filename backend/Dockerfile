FROM node:16

ENV TZ=America/Chicago

WORKDIR /opt/roobet

RUN apt-get update -yq \
  && apt-get upgrade -yq \
  && apt-get install -yq chromium ca-certificates \
  && ln -s /usr/lib/x86_64-linux-musl/libc.so /lib/libc.musl-x86_64.so.1

COPY . .

CMD [ "node", "build" ]