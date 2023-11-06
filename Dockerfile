# Use a base image that contains the necessary dependencies for Puppeteer
FROM node:14-buster-slim

# Set the working directory
WORKDIR /usr/src/app

# Install system dependencies required by Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxshmfence1 \
    libgbm1 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libatspi2.0-0 \
    libnspr4 \
    libnss3 \
    libxss1 \
    libxtst6 \
    fonts-liberation \
    libappindicator1 \
    libappindicator3-1 \
    libindicator7 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install Node.js dependencies (including Puppeteer)
RUN npm install

# Copy the rest of your application's code
COPY . .

# Add a non-root user and give them ownership of the app files
RUN groupadd -r nonroot && useradd -r -g nonroot -G audio,video nonroot \
    && mkdir -p /home/nonroot/Downloads \
    && chown -R nonroot:nonroot /home/nonroot \
    && chown -R nonroot:nonroot /usr/src/app

# Switch to the non-root user
USER nonroot

# Start the bot
CMD ["node", "app.js"]
