namespace Express {
  interface Request {
    profileImageObj?: ImageObj;
    parseToken?: {
      username: string;
      id: Types.ObjectId;
      admin: boolean;
    };
    postImageObjArr?: ImageObj[];
  }
}

interface ImageObj {
  URL: string;
  Key: string;
}
