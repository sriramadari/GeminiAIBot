// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const port = 3000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const corsOptions = {
  origin: "*", // Allow all origins
  credentials: true // Enable credentials
};
app.use(cors(corsOptions));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: corsOptions // Apply the same CORS options to Socket.IO
});

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('generate', (prompt) => {
    console.log('Generating content for prompt:', prompt);
    model
      .generateContentStream(prompt)
      .then(async (result) => {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          console.log(chunkText);

          // Send chunkText to the client
          socket.emit('content', chunkText);
        }

        // Indicate the end of the stream
        socket.emit('content', 'End of Content');
      })
      .catch((err) => {
        console.error('Error generating content:', err.message);
      });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server is running 🚀⚡`);
});