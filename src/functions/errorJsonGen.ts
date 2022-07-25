interface ErrorResponseType {
  error: string | Error;
  type: string;
}

interface ServerErrorType {
  error: "serverError" | Error;
  type: "server error";
}

//서버 오류 데이터 생성
const serverErrorJson = (err?: any): ServerErrorType => ({
  error: err ? err.message : "serverError",
  type: "server error",
});

interface DefaultErrorType extends ErrorResponseType {
  type:
    | "server error"
    | "missing data"
    | "not signin"
    | "not found"
    | "unauthorized request"
    | "data conflict";
}

interface AuthErrorType extends ErrorResponseType {
  type: "Login fail" | "exist email" | "exist username" | "server error";
}

//기본적인 오류 데이터 생성
export const defaultErrorJson = (
  type: DefaultErrorType["type"],
  err?: any
): DefaultErrorType => {
  switch (type) {
    case "missing data":
      return {
        type,
        error: "some data missing",
      };
    case "not signin":
      return {
        type,
        error: "user does not signin",
      };
    case "not found":
      return {
        type,
        error: "requested data not found",
      };
    case "unauthorized request":
      return {
        type,
        error: "user's request is unauthorized request",
      };
    case "data conflict":
      return {
        type,
        error: "requested data conflict with server data",
      };
    default:
      return serverErrorJson(err);
  }
};

//기본 오류 코드
export const defaultErrorCode = {
  "missing data": 400,
  "not signin": 401,
  "not found": 404,
  "unauthorized request": 403,
  "data conflict": 409,
  "server error": 500,
};

//로그인 오류 데이터 생성
export const authErrorJson = (type: AuthErrorType["type"]): AuthErrorType => {
  switch (type) {
    case "Login fail":
      return {
        type,
        error: "Login fail",
      };

    case "exist email":
      return {
        type,
        error: "email already exist",
      };
    case "exist username":
      return {
        type,
        error: "username already exist",
      };

    default:
      return serverErrorJson();
  }
};

interface TokenErrorType extends ErrorResponseType {
  type: "token expired";
}

//토큰 오류 데이터 생성
export const tokenErrorJson = (
  type: TokenErrorType["type"] = "token expired"
): TokenErrorType => ({
  type,
  error: "token expired",
});
