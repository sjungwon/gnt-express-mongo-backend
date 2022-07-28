import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { Readable } from "stream";
import { tokenErrorJson } from "../functions/errorJsonGen.js";
import { TokenPayload } from "../functions/token.js";
import tokenParser from "./token-parser.js";
import sharp from "sharp";
import S3 from "../storage/s3.js";

//multer 사용 - form data + file data
const formParser = multer();

//s3 데이터
export interface ImageObj {
  URL: string;
  Key: string;
}

//프로필 이미지 업로드
const uploadProfileImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //form으로 들어온 파일 데이터 multer에서 parse 후 전달
  const files =
    (req.files as {
      profileImage?: Express.Multer.File[];
      credentialImage?: Express.Multer.File[];
    }) || undefined;
  //파일이 없는 경우
  if (
    !files ||
    (!files.profileImage?.length && !files.credentialImage?.length)
  ) {
    return next();
  }

  const userData = req.parseToken as TokenPayload;

  //S3 설정 안된 경우
  if (!process.env.S3_BUCKET_NAME) {
    return res.status(500).send("bucket name missing");
  }

  const profileImage = files.profileImage ? files.profileImage[0] : null;
  const credentialImage = files.credentialImage
    ? files.credentialImage[0]
    : null;

  try {
    //파일 사이즈 조절
    if (profileImage) {
      const resizedFile = await sharp(profileImage.buffer)
        .jpeg({ quality: 90 })
        .resize(50, 50)
        .toBuffer();

      const fileStream = Readable.from(resizedFile);

      //S3 요청 데이터
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${
          userData.id
        }/profile/${new Date().toISOString()}/${encodeURIComponent(
          profileImage.originalname
        )}`,
        Body: fileStream,
      };

      //업로드
      const objURL = await S3.upload(uploadParams).promise();
      const profileImageObj: ImageObj = {
        URL: objURL.Location,
        Key: objURL.Key,
      };

      //req에 S3 데이터 설정
      req.profileImageObj = profileImageObj;
    }

    if (credentialImage) {
      const resizedFile = await sharp(credentialImage.buffer)
        .jpeg({ quality: 90 })
        .resize(600, 350)
        .toBuffer();

      const fileStream = Readable.from(resizedFile);

      //S3 요청 데이터
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${
          userData.id
        }/profile/${new Date().toISOString()}/${encodeURIComponent(
          credentialImage.originalname
        )}`,
        Body: fileStream,
      };

      //업로드
      const objURL = await S3.upload(uploadParams).promise();
      const credentialImageObj: ImageObj = {
        URL: objURL.Location,
        Key: objURL.Key,
      };

      //req에 S3 데이터 설정
      req.credentialImageObj = credentialImageObj;
    }
    next();
  } catch (err) {
    return res.status(500).send(err);
  }
};

//middleware 묶어서 export
export const uploadProfileImageFileWithTokenParser = [
  formParser.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "credentialImage", maxCount: 1 },
  ]),
  tokenParser,
  uploadProfileImage,
];

//포스트 이미지 업로드
const uploadPostImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //multer에서 처리한 파일 데이터
  const files: Express.Multer.File[] | undefined = req.files as
    | Express.Multer.File[]
    | undefined;

  //새 이미지가 없는 경우
  if (!files || !files.length) {
    return next();
  }

  const userData = req.parseToken as TokenPayload;

  //S3 설정이 안된 경우
  if (!process.env.S3_BUCKET_NAME) {
    return res.status(500).send("bucket name missing");
  }

  try {
    const date = new Date().toISOString();
    //이미지 업로드 - 이미지 리사이즈 후 업로드
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
        const postImageObj: ImageObj = {
          URL: objURL.Location,
          Key: objURL.Key,
        };
        return postImageObj;
      })
    );

    //req 요청에 이미지 업로드 데이터 삽입
    req.postImageObjArr = resizedFiles;
    next();
  } catch (err) {
    return res.status(500).send(err);
  }
};

//middleware 묶어서 export
export const uploadPostImageFilesWithTokenParser = [
  formParser.array("newImages"),
  tokenParser,
  uploadPostImages,
];
