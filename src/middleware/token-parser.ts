import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ErrorResponseType } from "../types/error.type";

//유저 정보는 accessToken만으로 처리
//client 쪽에서 유저 권한이 필요한 요청인 경우엔 checklogin으로 토큰을 재발급 받은 후에
//요청하도록 구현
interface TokenErrorType extends ErrorResponseType {
  type: "token expired";
}

export default function tokenParser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const accessToken = req.headers.authorization?.split(" ")[1];

  if (!accessToken) {
    const errJson: TokenErrorType = {
      error: "token expired",
      type: "token expired",
    };
    return res.status(403).send(errJson);
  }

  const accessKey = process.env.JWT_SECRET_ACCESS || "";

  try {
    const verify = jwt.verify(accessToken, accessKey, {
      ignoreExpiration: false,
    });

    req.body.parseToken = verify;

    next();
  } catch (err) {
    const errJson: TokenErrorType = {
      error: "token expired",
      type: "token expired",
    };
    return res.status(403).send(errJson);
  }
}
