/**
 * GY: Extract environment configuration away from logic
 */
module.exports = {
  s3access: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  },
  s3bucketConfig: {
    Bucket: process.env.AWS_BUCKET_NAME,
  }
};
