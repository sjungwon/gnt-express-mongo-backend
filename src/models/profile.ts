import mongoose, { Types } from "mongoose";

export interface ProfileType {
  //user & category are refs for join collections
  user: Types.ObjectId;
  category: Types.ObjectId;
  nickname: string;
  profileImage: {
    URL?: string;
    Key?: string;
  };
  credentialImage: {
    URL?: string;
    Key?: string;
  };
  createdAt?: Date;
}

const profileSchema = new mongoose.Schema<ProfileType>({
  user: {
    type: mongoose.SchemaTypes.ObjectId,
    required: true,
    ref: "users",
  },
  category: {
    type: mongoose.SchemaTypes.ObjectId,
    required: true,
    ref: "categories",
  },
  nickname: {
    type: String,
    required: true,
  },
  profileImage: {
    URL: {
      type: String,
      default: "",
    },
    Key: {
      type: String,
      default: "",
    },
  },
  credentialImage: {
    URL: {
      type: String,
      default: "",
    },
    Key: {
      type: String,
      default: "",
    },
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

//find시 category, user join 해서 반환
profileSchema.pre(/^find/, function (next) {
  this.populate({
    path: "category",
    select: "title",
  });
  this.populate({ path: "user", select: "username" });
  next();
});

//저장시 현재 날짜로 저장
profileSchema.pre("save", function (next) {
  this.createdAt = new Date();
  next();
});

const ProfileModel = mongoose.model("profiles", profileSchema);

export default ProfileModel;
