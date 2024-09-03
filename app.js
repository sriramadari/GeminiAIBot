// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const app = express();
const port = 3000;
app.use(express.static(path.join(__dirname, 'public')));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_AI_API_KEY);
// const generationConfig = {
//   stopSequences: ["red"],
//   maxOutputTokens: 2000,
//   temperature: 0.9,
//   topP: 0.1,
//   topK: 16,
// };
// For text-and-image input (multimodal)
const corsOptions = {
  origin: "*", // Allow all origins
  credentials: true // Enable credentials
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: corsOptions // Apply the same CORS options to Socket.IO
});

let socket;

io.on('connection', (socketConnection) => {
  console.log('client connected');
  socket=socketConnection;
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'client.html'));
})
app.post('/generate', async (req, res) => {
  const { base64Image, prompt } = req.body
  // console.log(base64Image, prompt);
  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: 'image/png'
    },
  };
  try {
    let result
    if(base64Image){
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
      result = await model.generateContentStream([prompt, imagePart]);
    } else {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      result = await model.generateContentStream(prompt);
    }
    
    let text = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      console.log(chunkText);
      text += chunkText;
      if (socket) {
        try {
          socket.emit('content', chunkText);
        } catch (error) {
          console.error('Error emitting content:', error.message);
        }
      }
    }
    if (socket) {
      socket.emit('content', "hope this is useful :)");
      socket.disconnect();
    }
    res.status(200).json({message:"success"});
  } catch (err) {
    console.error('Error generating content:', err.message);
    res.status(500).json({ error: 'Error generating content' });
  }
});


server.listen(port, () => {
  console.log(`Server is running 🚀⚡`);
});
