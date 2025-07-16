// import AWS from "aws-sdk";
// import multer from "multer";

// export const s3 = new AWS.S3({
//   endpoint: "https://s3.maaozofficialstore.shop",
//   accessKeyId: "wp5tO93cdLcdM0qiT2ex",
//   secretAccessKey: "wZd8NESMHOeBaojeFELP30eHAmCsVUbb4pDvzOp2",
//   s3ForcePathStyle: true,
//   signatureVersion: "v4",
// });

// export const upload = multer({
//   storage: multer.memoryStorage(),
//   fileFilter: (req, file, cb) => {
//     const allowedMimeTypes = [
//       "image/jpeg",
//       "image/png",
//       "image/jpg",
//       "image/webp",
//     ];
//     if (allowedMimeTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only .png, .jpg, and .jpeg formats are allowed!"));
//     }
//   },
// });
