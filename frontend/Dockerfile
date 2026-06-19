FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# NEXT_PUBLIC_* values are inlined into the bundle at BUILD time, so they must
# be present here (supplied via docker-compose build.args), not only at runtime.
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_API_SOCKET_BASE_URL
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_SOCKET_BASE_URL=$NEXT_PUBLIC_API_SOCKET_BASE_URL
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
