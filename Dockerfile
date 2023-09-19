FROM node:14-alpine
WORKDIR /app

RUN apk add --update --no-cache \
	make \
	g++ \
	jpeg-dev \
	cairo-dev \
	giflib-dev \
	pango-dev

COPY package*.json ./
COPY . .
RUN npm install 

RUN npx prisma generate

RUN npm run build

CMD ["node", "dist/main.js"]
