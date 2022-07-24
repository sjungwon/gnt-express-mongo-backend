import express from "express";
import {
  addComment,
  blockComment,
  deleteComment,
  getMoreComment,
  updateComment,
} from "../controllers/comments.js";
import tokenParser from "../middleware/token-parser.js";

const router = express.Router();

router.get("/:postId/:lastDate", getMoreComment);

router.post("/", tokenParser, addComment);

router.patch("/block/:id", tokenParser, blockComment);

router.patch("/:id", tokenParser, updateComment);

router.delete("/:id", tokenParser, deleteComment);

export default router;
