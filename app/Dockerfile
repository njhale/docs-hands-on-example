# Use the official Node.js image as the base image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Copy the entire application code to the working directory
COPY . .

# Expose the application port (e.g. 3000)
EXPOSE 3000

# Define the command to run the application
CMD ["npm", "start"]
