# --- Build Stage for Frontend ---
FROM node:20-alpine AS build-fe
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Build Stage for Backend ---
FROM node:20-alpine AS build-be
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Generate prisma client inside backend stage
RUN npx prisma generate

# --- Final Production Image ---
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --only=production

# Copy build artifacts
COPY --from=build-fe /app/dist ./dist
COPY --from=build-be /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build-be /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build-be /app/prisma ./prisma
COPY --from=build-be /app/server.ts ./
COPY --from=build-be /app/src ./src

# Install tsx globally or locally to execute server.ts in production directly
RUN npm install -g tsx

EXPOSE 3001
CMD ["npm", "start"]
