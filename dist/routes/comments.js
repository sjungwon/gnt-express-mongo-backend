import express from "express";
import { blockCommentWithTokenParser, createCommentWithTokenParser, deleteCommentWithTokenParser, getMoreComment, updateCommentWithTokenParser, } from "../controllers/comments.js";
const router = express.Router();
router.get("/:postId/:lastDate", getMoreComment);
router.post("/", createCommentWithTokenParser);
router.patch("/block/:id", blockCommentWithTokenParser);
router.patch("/:id", updateCommentWithTokenParser);
router.delete("/:id", deleteCommentWithTokenParser);
export default router;
