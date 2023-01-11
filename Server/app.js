const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server, { cors: { origin: "*" } });

//---------------connecting mangoDB for Data--------------------
const MongoClient = require("mongodb").MongoClient;

const uri =
  "mongodb+srv://Elad:12345@cluster0.k9d9arl.mongodb.net/<dbname>?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });
const codeBlocks = []; 

client
  .connect()
  .then(async (client) => {
    const db = client.db("Drills-DataBase");
    const collection = db.collection("CodeBlocks");
    const cursor = collection.find();

    while (await cursor.hasNext()) {
      codeBlocks.push(await cursor.next());
      console.log("mongo connected , codeBlocks data recieved");
    }
  })
  .catch((err) => {
    console.error(err);
  });

//---------------displaying the server --------------------
  app.get("/", (req, res) => {
    res.send("<h1>server is on air</h1>");
    
  });

  
//---------------writing funcs for socket--------------------

let Teacher = false;

io.on("connection", (socket) => {
  console.log("A client has connected:", socket.id);


  //which block you enter? need to add block id and counter
  socket.on("IsFirstClient", (blockId) => {
    // chosenBlock= codeBlocks[blockId];
    if (!Teacher) {
      Teacher = true;
      socket.emit("DisableTeacher", "true");
    }
  });

  socket.on("RestartTeacher", () => {
    Teacher = false;
  });

  //debugg method
  socket.on("message", (data) => {
    console.log("Received message from client:", data);
    io.emit("response", { server });
  });

  //sent 1 specific block
  socket.on("getBlocks", (blockId) => {
    const block = codeBlocks[blockId];
    if (block) {
      console.log("data recievd block: "+block.name);
      socket.emit("getBlocks", block);
    } else {
      socket.emit("error", {
        message:
          "Problem in get blocks request... go to the app.js file please",
      });
    }
  });

  //send all block from list
  socket.on("getAllBlocks", () => {
    if (codeBlocks) {
      console.log("data recieved");
      socket.emit("getAllBlocks", codeBlocks);
    } else {
      socket.emit("error", {
        message:
          "Problem in get all blocks request... go to the app.js file please",
      });
    }
  });
  
  //broadcast the new code to every client
  socket.on("onChange", (code) => {
    io.emit("getCode", code);
  });
});

server.listen(3000, () => {
  console.log("Socket.io server listening on port 3000");
});
