import express from "express";
import {
  addCategoryWithTokenParser,
  deleteCategoryWithTokenParser,
  getCategory,
  getCategoryByTitle,
} from "../controllers/category.js";

const router = express.Router();

router.get("/", getCategory);

router.get("/:title", getCategoryByTitle);

router.post("/", addCategoryWithTokenParser);

router.delete("/:id", deleteCategoryWithTokenParser);

export default router;
