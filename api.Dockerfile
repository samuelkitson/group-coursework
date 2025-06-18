FROM node:18-alpine

WORKDIR /app

COPY ./api/package.json ./api/package-lock.json ./
RUN npm install

COPY ./api ./

EXPOSE 3000

CMD ["node", "app.js"]
