const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro"});

const run=async()=>{
    // For text-only input, use the gemini-pro model  
    try{
    const prompt = "What special about google gemini AI?"
  
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log(text);
    }catch(err){
        console.log(err)
    }
  }
  run();