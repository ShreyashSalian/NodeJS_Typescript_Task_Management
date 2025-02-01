FROM node

WORKDIR /app

COPY package.json tsconfig.json /app/

RUN npm install

COPY . /app

RUN npm run build  # Ensure TypeScript compiles to JavaScript

EXPOSE 8000

CMD ["npm","run","start-two"]  # Run compiled JavaScript file

