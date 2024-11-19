# Stage 1: Build the React app
FROM node:18-alpine as build

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY package.json ./
COPY package-lock.json ./
RUN npm install

COPY . ./
RUN npm run build

# Stage 2: Serve the app with a static server
FROM nginx:stable-alpine

COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]