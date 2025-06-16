
FROM node:21.5
#docker build -t phone-xml .
#docker run -p 10031:10031 -i -t phone-xml

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
COPY prod.env .env

CMD [ "npm", "start" ]