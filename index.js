const dotenv = require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const userRoute = require("./routes/userRoute");
const postRoute = require("./routes/postRoute");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const errorHandler = require("./middleWare/errorMiddleware");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());


// cors 
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173",  "https://educentral-community-frontend.onrender.com" ],
    credentials: true,
  })
);

// Routes Middleware
app.use("/api/users", userRoute)
app.use("/api/posts", postRoute)

/////////

// Routes
app.get("/", (req, res) => {
    res.send("Home Page");
  });

//Error Middleware
app.use(errorHandler);  

 



// Connect to DB and start server
const PORT = process.env.PORT || 5000;
mongoose.set('strictQuery', false);
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server Running on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err));
