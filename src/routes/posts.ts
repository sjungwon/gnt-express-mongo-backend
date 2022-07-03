import express, { Response } from "express";
import {
  createPost,
  deletePost,
  getPosts,
  updatePost,
} from "../controllers/posts.js";
import tokenParser from "../middleware/token-parser.js";

const router = express.Router();

router.get("/", tokenParser, getPosts);

router.post("/", createPost);

router.patch("/:id", updatePost);

router.delete("/:id", deletePost);

// router.delete("/:id", removePost);

export default router;
