import { Types } from "mongoose";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface TokenPayload {
  username: string;
  id: Types.ObjectId;
  admin: boolean;
}

//토큰 생성 함수
export const jwtTokenGen = (
  payload: TokenPayload,
  type: "refresh" | "access"
): string => {
  //jwt 토큰 sercret
  const access_secret = process.env.JWT_SECRET_ACCESS || "";
  const refresh_secret = process.env.JWT_SECRET_REFRESH || "";

  //토큰 생성
  const token = jwt.sign(
    payload,
    type === "access" ? access_secret : refresh_secret,
    { expiresIn: type === "access" ? "15m" : "7d" }
  );

  //반환
  return token;
};

//토큰 검증
export const jwtTokenVerify = (
  token: string,
  key: string
): TokenPayload | false => {
  try {
    //검증 - 실패시 오류
    const tokenVerify = jwt.verify(token, key, {
      ignoreExpiration: false,
    }) as JwtPayload & TokenPayload;

    //토큰 데이터
    const { username, id, admin } = tokenVerify;

    const payload = { username, id, admin };

    return payload;
  } catch {
    //검증 실패
    return false;
  }
};
