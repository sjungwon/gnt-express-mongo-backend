import express from "express";
import {
  createProfileWithUploadS3AndTokenParser,
  deleteProfileWithTokenParser,
  getProfileById,
  getProfilesByUserId,
  getProfilesByUsername,
  updateProfileWithUploadS3AndTokenParser,
} from "../controllers/profile.js";

const router = express.Router();

router.get("/:id", getProfileById);

router.get("/id/:id", getProfilesByUserId);

router.get("/username/:username", getProfilesByUsername);

router.post("/", createProfileWithUploadS3AndTokenParser);

router.patch("/:id", updateProfileWithUploadS3AndTokenParser);

router.delete("/:id", deleteProfileWithTokenParser);

export default router;
