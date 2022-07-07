interface ErrorResponseType {
  error: string | any;
  type: string;
}

export const serverErrorJson = (err: Error): ErrorResponseType => ({
  error: err,
  type: "server error",
});

interface AuthErrorType extends ErrorResponseType {
  type:
    | "Login fail"
    | "server error"
    | "missing data"
    | "exist email"
    | "exist username"
    | "not signin"
    | "not found";
}

export const auhtErrorJson = (type: AuthErrorType["type"]): AuthErrorType => {
  switch (type) {
    case "Login fail":
      return {
        type,
        error: "Login fail",
      };
    case "missing data":
      return {
        type,
        error: "some data missing",
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
    case "not signin":
      return {
        type,
        error: "user does not signin",
      };
    case "not found":
      return {
        type,
        error: "username & email not found",
      };
    default:
      return {
        type: "server error",
        error: "server error",
      };
  }
};

interface TokenErrorType extends ErrorResponseType {
  type: "token expired";
}

export const tokenErrorJson = (
  type: TokenErrorType["type"] = "token expired"
): TokenErrorType => ({
  type,
  error: "token expired",
});
