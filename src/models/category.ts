import mongoose, { Schema, Types } from "mongoose";

export interface CategoryType {
  _id?: Types.ObjectId;
  //user is ref for join collections
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

categorySchema.pre("save", function (next) {
  this.createdAt = new Date();
  next();
});

categorySchema.pre(/^find/, function (next) {
  this.populate({ path: "user", select: "username" });
  next();
});

const CategoryModel = mongoose.model("categories", categorySchema);

export default CategoryModel;
