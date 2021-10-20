FROM node:14
WORKDIR /app

COPY . .
RUN rm -rf node_modules

RUN npm install

CMD ["npm", "start"]