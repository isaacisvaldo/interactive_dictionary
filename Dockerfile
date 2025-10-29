# Dockerfile
FROM node:20

ARG NODE_ENV=development
ENV NODE_ENV=$NODE_ENV

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 9696

CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"development\" ]; then npm run start:dev; else npm run start:prod; fi"]
