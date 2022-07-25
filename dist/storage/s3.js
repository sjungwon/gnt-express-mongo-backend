import AWS from "aws-sdk";
//AWS 지역 설정
AWS.config.update({ region: "ap-northeast-2" });
//S3 인스턴스 생성
const S3 = new AWS.S3({ apiVersion: "2006-03-01" });
export default S3;
