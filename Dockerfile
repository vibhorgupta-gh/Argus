FROM node:25.6.0-bookworm

WORKDIR /app
COPY package.json .
COPY yarn.lock .

RUN yarn install
RUN yarn global add typescript tsc

COPY . .
ENTRYPOINT [ "yarn", "start" ]
