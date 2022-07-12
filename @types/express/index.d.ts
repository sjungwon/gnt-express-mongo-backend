namespace Express {
  interface Request {
    profileImageObj?: {
      URL: string;
      Key: string;
    };
    parseToken?: {
      username: string;
      id: Types.ObjectId;
      admin: boolean;
    };
  }
}
