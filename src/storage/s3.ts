import AWS from "aws-sdk";

AWS.config.update({ region: "ap-northeast-2" });

const S3 = new AWS.S3({ apiVersion: "2006-03-01" });

export default S3;
