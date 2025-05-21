FROM node:14
WORKDIR /app

RUN apt-get update && apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libtool autoconf automake

COPY package*.json ./
COPY . .
RUN npm install 

RUN npm run build

CMD ["node", "dist/main.js"]
