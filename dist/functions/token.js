import jwt from "jsonwebtoken";
//토큰 생성 함수
export const jwtTokenGen = (payload, type) => {
    //jwt 토큰 sercret
    const access_secret = process.env.JWT_SECRET_ACCESS || "";
    const refresh_secret = process.env.JWT_SECRET_REFRESH || "";
    //토큰 생성
    const token = jwt.sign(payload, type === "access" ? access_secret : refresh_secret, { expiresIn: type === "access" ? "15m" : "7d" });
    //반환
    return token;
};
//토큰 검증
export const jwtTokenVerify = (token, key) => {
    try {
        //검증 - 실패시 오류
        const tokenVerify = jwt.verify(token, key, {
            ignoreExpiration: false,
        });
        //토큰 데이터
        const { username, id, admin } = tokenVerify;
        const payload = { username, id, admin };
        return payload;
    }
    catch (_a) {
        //검증 실패
        return false;
    }
};
