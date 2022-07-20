import express from "express";
import {
  createSubcommentWithParsedToken,
  deleteSubcommentWithParsedToken,
  getMoreSubcomments,
  updateSubcommentWithParsedToken,
} from "../controllers/subcomments.js";

const router = express.Router();

router.get("/:commentId/:lastDate", getMoreSubcomments);

router.post("/", createSubcommentWithParsedToken);

router.patch("/", updateSubcommentWithParsedToken);

router.delete("/:id", deleteSubcommentWithParsedToken);

export default router;
