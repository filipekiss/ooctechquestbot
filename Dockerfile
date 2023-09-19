FROM node:14-alpine
WORKDIR /app

RUN apk add --update --no-cache \
	make \
	g++ \
	jpeg-dev \
	cairo-dev \
	giflib-dev \
	pango-dev

COPY . .
RUN npm install 


RUN npm run build

CMD ["node", "dist/main.js"]
