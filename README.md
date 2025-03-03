# VidTube-backend-project
"Building the Backend of a YouTube-Like Video Streaming Platform"

## VidTube

VidTube is a YouTube-like video streaming platform built with Node.js, Express, and MongoDB. It allows users to upload, view, and interact with video content. The platform includes features such as user authentication, video uploading, commenting, liking, and subscribing to channels.

## Features

- **User Authentication**: Secure user registration, login, and logout functionality.
- **Video Uploading**: Users can upload videos with thumbnails, which are stored on Cloudinary.
- **Video Streaming**: Stream videos directly from the platform.
- **Commenting**: Users can comment on videos.
- **Liking**: Users can like videos and comments.
- **Subscribing**: Users can subscribe to channels and get updates on new videos.
- **Playlists**: Users can create and manage playlists of their favorite videos.
- **Dashboard**: Channel owners can view statistics such as total views, subscribers, and likes.

## Technologies Used

- **Node.js**: JavaScript runtime for building the backend.
- **Express**: Web framework for Node.js.
- **MongoDB**: NoSQL database for storing user and video data.
- **Mongoose**: ODM for MongoDB.
- **JWT**: JSON Web Tokens for secure authentication.
- **Cloudinary**: Cloud storage for video and image files.
- **Multer**: Middleware for handling file uploads.
- **Prettier**: Code formatter for maintaining code style.

## Getting Started

1. Clone the repository:
   ```sh
   git clone https://github.com/codeAryan21/VidTube-backend-project.git
   cd VidTube-backend-project
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Set up environment variables:
    > Create a .env file in the root directory and add the necessary environment variables as shown in .env.sample.

4. Start the development server:
   ```sh
   npm run dev
   ```

5. Open your browser and navigate to http://localhost:8000
