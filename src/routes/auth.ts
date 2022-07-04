import express from "express";
import {
  userSignin,
  userSigninCheck,
  userSignout,
  userSignup,
} from "../controllers/auth.js";

const router = express.Router();

router.post("/signin", userSignin);

router.post("/signup", userSignup);

router.post("/signout", userSignout);

router.post("/signcheck", userSigninCheck);

export default router;
