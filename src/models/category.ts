import mongoose, { Schema, Types } from "mongoose";

export interface CategoryType {
  _id?: Types.ObjectId;
  user: Types.ObjectId;
  title: string;
  createdAt?: Date;
}

const categorySchema = new mongoose.Schema<CategoryType>({
  user: {
    type: mongoose.SchemaTypes.ObjectId,
    required: true,
    ref: "users",
  },
  title: {
    type: String,
    unique: true,
    required: true,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

//카테고리 저장할 때 현재 date 설정
categorySchema.pre("save", function (next) {
  this.createdAt = new Date();
  next();
});

//find 쿼리 시 user join해서 데이터 반환 - username만 전달
categorySchema.pre(/^find/, function (next) {
  this.populate({ path: "user", select: "username" });
  next();
});

const CategoryModel = mongoose.model("categories", categorySchema);

export default CategoryModel;
