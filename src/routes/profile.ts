import express from "express";
import {
  addProfiles,
  deleteProfile,
  formData,
  getProfile,
  getProfilesByUserId,
  getProfilesByUsername,
  updateProfile,
} from "../controllers/profile.js";
import tokenParser from "../middleware/token-parser.js";
import multer from "multer";
const upload = multer();

const router = express.Router();

router.get("/:id", getProfile);

router.get("/id/:id", getProfilesByUserId);

router.get("/username/:username", getProfilesByUsername);

router.post("/", tokenParser, addProfiles);

router.patch("/:id", tokenParser, updateProfile);

router.delete("/:id", tokenParser, deleteProfile);

router.post("/form", upload.fields([]), formData);

export default router;
