import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { Readable } from "stream";
import { tokenErrorJson } from "../functions/errorJsonGen.js";
import { TokenPayload } from "../functions/token.js";
import tokenParser from "./token-parser.js";
import sharp from "sharp";
import S3 from "../storage/s3.js";

export interface ProfileImageObj {
  URL: string;
  Key: string;
}

const uploadProfileImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const file: Express.Multer.File | undefined = req.file;
  console.log(file);
  if (!file) {
    return next();
  }

  const userData: TokenPayload | undefined = req.body.parseToken;

  if (!userData) {
    return res.status(403).send(tokenErrorJson());
  }

  if (!process.env.S3_BUCKET_NAME) {
    return res.status(500).send("bucket name missing");
  }

  try {
    const resizedFile = await sharp(file.buffer).resize(50, 50).toBuffer();

    const fileStream = Readable.from(resizedFile);

    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${
        userData.id
      }/profile/${new Date().toString()}/${encodeURIComponent(
        file.originalname
      )}`,
      Body: fileStream,
    };

    const objURL = await S3.upload(uploadParams).promise();
    const profileImageObj: ProfileImageObj = {
      URL: objURL.Location,
      Key: objURL.Key,
    };
    req.profileImageObj = profileImageObj;
    next();
  } catch (err) {
    return res.status(500).send(err);
  }
};

const formParser = multer();

export const uploadProfileImageFile = [
  formParser.single("profileImage"),
  tokenParser,
  uploadProfileImage,
];
