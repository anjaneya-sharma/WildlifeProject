FROM node:14

WORKDIR /app

COPY package.json .
COPY .env.local .env.local

RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "start"]