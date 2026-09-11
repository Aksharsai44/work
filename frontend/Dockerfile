# Frontend Dockerfile for React + Node Express Server
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

CMD ["npm", "start"]