FROM node:20.15-alpine

# We use nodemon to restart the server every time there's a change
RUN npm install -g nodemon

WORKDIR /server

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY . .

EXPOSE 5000

# Use script specified in package.json
CMD ["npm", "run", "start"]