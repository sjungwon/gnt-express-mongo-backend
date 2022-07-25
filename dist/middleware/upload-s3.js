var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import multer from "multer";
import { Readable } from "stream";
import tokenParser from "./token-parser.js";
import sharp from "sharp";
import S3 from "../storage/s3.js";
//multer 사용 - form data + file data
const formParser = multer();
//프로필 이미지 업로드
const uploadProfileImage = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    //form으로 들어온 파일 데이터 multer에서 parse 후 전달
    const file = req.file;
    //파일이 없는 경우
    if (!file) {
        return next();
    }
    const userData = req.parseToken;
    //S3 설정 안된 경우
    if (!process.env.S3_BUCKET_NAME) {
        return res.status(500).send("bucket name missing");
    }
    try {
        //파일 사이즈 조절
        const resizedFile = yield sharp(file.buffer)
            .jpeg({ quality: 90 })
            .resize(50, 50)
            .toBuffer();
        //파일 스트림 생성
        const fileStream = Readable.from(resizedFile);
        //S3 요청 데이터
        const uploadParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `${userData.id}/profile/${new Date().toISOString()}/${encodeURIComponent(file.originalname)}`,
            Body: fileStream,
        };
        //업로드
        const objURL = yield S3.upload(uploadParams).promise();
        const profileImageObj = {
            URL: objURL.Location,
            Key: objURL.Key,
        };
        //req에 S3 데이터 설정
        req.profileImageObj = profileImageObj;
        next();
    }
    catch (err) {
        return res.status(500).send(err);
    }
});
//middleware 묶어서 export
export const uploadProfileImageFileWithTokenParser = [
    formParser.single("profileImage"),
    tokenParser,
    uploadProfileImage,
];
//포스트 이미지 업로드
const uploadPostImages = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    //multer에서 처리한 파일 데이터
    const files = req.files;
    //새 이미지가 없는 경우
    if (!files || !files.length) {
        return next();
    }
    const userData = req.parseToken;
    //S3 설정이 안된 경우
    if (!process.env.S3_BUCKET_NAME) {
        return res.status(500).send("bucket name missing");
    }
    try {
        const date = new Date().toISOString();
        //이미지 업로드 - 이미지 리사이즈 후 업로드
        const resizedFiles = yield Promise.all(files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
            const resizedFile = yield sharp(file.buffer)
                .jpeg({ quality: 90 })
                .resize(600, 350)
                .toBuffer();
            const fileStream = Readable.from(resizedFile);
            const uploadParams = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: `${userData.id}/posts/${date}/${encodeURIComponent(file.originalname)}`,
                Body: fileStream,
            };
            const objURL = yield S3.upload(uploadParams).promise();
            const postImageObj = {
                URL: objURL.Location,
                Key: objURL.Key,
            };
            return postImageObj;
        })));
        //req 요청에 이미지 업로드 데이터 삽입
        req.postImageObjArr = resizedFiles;
        next();
    }
    catch (err) {
        return res.status(500).send(err);
    }
});
//middleware 묶어서 export
export const uploadPostImageFilesWithTokenParser = [
    formParser.array("newImages"),
    tokenParser,
    uploadPostImages,
];
