import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { tokenErrorJson } from "../functions/errorJsonGen.js";

//유저 정보는 accessToken만으로 처리
//client 쪽에서 유저 권한이 필요한 요청인 경우엔 checklogin으로 토큰을 재발급 받은 후에
//요청하도록 구현

export default function tokenParser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const accessToken = req.headers.authorization?.split(" ")[1];

  if (!accessToken) {
    return res.status(403).send(tokenErrorJson());
  }

  const accessKey = process.env.JWT_SECRET_ACCESS || "";

  try {
    const verify = jwt.verify(accessToken, accessKey, {
      ignoreExpiration: false,
    });

    req.body.parseToken = verify;

    next();
  } catch (err) {
    return res.status(403).send(tokenErrorJson());
  }
}
