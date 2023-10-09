# Use a minimal Node.js base image
FROM node:14-alpine as build

# Set a working directory
WORKDIR /WED_LAB

# Copy only the package.json and package-lock.json to leverage Docker's cache
COPY package*.json ./

# Install production dependencies and cleanup
RUN npm ci --only=production

# Copy your application code
COPY . .

# Expose the port your application will run on
EXPOSE 3000

# Define the command to start your application
CMD ["node", "submit.js"]

# Create a smaller final image
FROM httpd:2.4

# Copy only the necessary files from the build image
COPY --from=build /WED_LAB /WED_LAB

# Set the working directory
WORKDIR /WED_LAB

# Configure your HTTP server (e.g., Apache) as needed
# ...

# Start your HTTP server
CMD ["httpd-foreground"]