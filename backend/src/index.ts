import express ,{ Request, Response } from "express";
import "dotenv/config";

const server = express();
const port = process.env.PORT || 5000;

// Middleware parse JSON
server.use(express.json()); 

// Test the router
server.get("/",(req : Request,res : Response)=>{
    res.send("Hello world");
});

// Start Server
server.listen(port,()=>{
    console.log(`🚀 Server running at http://localhost:${port}`);
});

