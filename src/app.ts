import express, { Request, Response } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import IndexRouter from "./routes/index.js";
import PostRouter from "./routes/posts.js";
import AuthRouter from "./routes/auth.js";
import CategoryRouter from "./routes/category.js";
import ProfileRouter from "./routes/profile.js";
import cookieParser from "cookie-parser";
import CommentRouter from "./routes/comments.js";
import SubcommentRouter from "./routes/subcomments.js";

dotenv.config();

const PORT = process.env.PORT;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ limit: "30mb", extended: true }));
//cors -> origin: true -> 요청 보낸 ip를 access-control-allow-origin으로 설정됨
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());

//Routing
app.use("/", IndexRouter);
app.use("/posts", PostRouter);
app.use("/auth", AuthRouter);
app.use("/categories", CategoryRouter);
app.use("/profiles", ProfileRouter);
app.use("/comments", CommentRouter);
app.use("/subcomments", SubcommentRouter);

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
