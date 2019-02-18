FROM node:8.15.0-alpine

WORKDIR /usr/app

COPY package.json .
COPY node_modules node_modules
COPY config config
COPY server.js .

EXPOSE 4000

RUN pwd
RUN ls -lah

RUN node --version

CMD node server.js