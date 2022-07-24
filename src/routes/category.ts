import express from "express";
import {
  addCategory,
  getCategory,
  getCategoryByTitle,
  removeCategory,
} from "../controllers/category.js";
import tokenParser from "../middleware/token-parser.js";

const router = express.Router();

router.get("/", getCategory);

router.get("/:title", getCategoryByTitle);

router.post("/", tokenParser, addCategory);

router.delete("/:id", tokenParser, removeCategory);

export default router;
