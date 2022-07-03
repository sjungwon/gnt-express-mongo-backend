import { Types } from "mongoose";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface TokenPayload {
  username: string;
  id: Types.ObjectId;
  admin: boolean;
}

export const jwtTokenGen = (
  payload: TokenPayload,
  type: "refresh" | "access"
): string => {
  const access_secret = process.env.JWT_SECRET_ACCESS || "";
  const refresh_secret = process.env.JWT_SECRET_REFRESH || "";

  const token = jwt.sign(
    payload,
    type === "access" ? access_secret : refresh_secret,
    { expiresIn: type === "access" ? "15m" : "7d" }
  );

  return token;
};

export const jwtTokenVerify = (
  token: string,
  key: string
): TokenPayload | false => {
  try {
    const tokenVerify = jwt.verify(token, key, {
      ignoreExpiration: false,
    }) as JwtPayload & TokenPayload;

    const { username, id, admin } = tokenVerify;

    const payload = { username, id, admin };

    return payload;
  } catch {
    return false;
  }
};
