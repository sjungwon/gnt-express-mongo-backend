import express, { Request, Response } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import IndexRouter from "./routes/index.js";
import PostRouter from "./routes/posts.js";
import AuthRouter from "./routes/auth.js";
import cookieParser from "cookie-parser";

dotenv.config();

const PORT = process.env.PORT;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());
app.use(cookieParser());

//Routing
app.use("/", IndexRouter);
app.use("/posts", PostRouter);
app.use("/auth", AuthRouter);

//DB Variable
const DB_PATH = process.env.DB_PATH ? process.env.DB_PATH : "";
const DB_ID = process.env.DB_ID;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_AUTH_PATH = `mongodb://${DB_ID}:${DB_PASSWORD}@${DB_PATH}`;

//Connect DB
mongoose
  .connect(DB_AUTH_PATH)
  .then(() => {
    app.listen(
      app.listen(PORT, () => {
        console.log(`Server running with mongodb on port: ${PORT}`);
      })
    );
  })
  .catch((err) => {
    console.log(err.message);
  });
