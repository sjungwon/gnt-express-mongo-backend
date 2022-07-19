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

  const userData: TokenPayload | undefined = req.parseToken;

  if (!userData) {
    return res.status(403).send(tokenErrorJson());
  }

  if (!process.env.S3_BUCKET_NAME) {
    return res.status(500).send("bucket name missing");
  }

  try {
    const resizedFile = await sharp(file.buffer)
      .jpeg({ quality: 90 })
      .resize(50, 50)
      .toBuffer();

    const fileStream = Readable.from(resizedFile);

    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${
        userData.id
      }/profile/${new Date().toISOString()}/${encodeURIComponent(
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

const uploadPostImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const files: Express.Multer.File[] | undefined = req.files as
    | Express.Multer.File[]
    | undefined;

  //새 이미지가 없는 경우
  if (!files || !files.length) {
    return next();
  }

  const userData: TokenPayload | undefined = req.parseToken;

  if (!userData) {
    return res.status(403).send(tokenErrorJson());
  }

  if (!process.env.S3_BUCKET_NAME) {
    return res.status(500).send("bucket name missing");
  }

  try {
    const date = new Date().toISOString();
    const resizedFiles = await Promise.all(
      files.map(async (file) => {
        const resizedFile = await sharp(file.buffer)
          .jpeg({ quality: 90 })
          .resize(600, 350)
          .toBuffer();
        const fileStream = Readable.from(resizedFile);

        const uploadParams: AWS.S3.PutObjectRequest = {
          Bucket: process.env.S3_BUCKET_NAME as string,
          Key: `${userData.id}/posts/${date}/${encodeURIComponent(
            file.originalname
          )}`,
          Body: fileStream,
        };

        const objURL = await S3.upload(uploadParams).promise();
        const postImageObj: ProfileImageObj = {
          URL: objURL.Location,
          Key: objURL.Key,
        };
        return postImageObj;
      })
    );

    req.postImageObjArr = resizedFiles;
    next();
  } catch (err) {
    return res.status(500).send(err);
  }
};

export const uploadPostImageFiles = [
  formParser.array("newImages"),
  tokenParser,
  uploadPostImages,
];
