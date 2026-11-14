const { Readable } = require("stream");
const { cloudinary } = require("../config/Cloudinary.config");

// `resourceType` lets chat attachments upload audio/video too. Cloudinary
// classifies audio under "video", and "auto" detects the real type, so we only
// force the image pipeline (and the image format) for actual images.
const uploadCloudinary = ({ mimetype, imgBuffer, resourceType = "image" }) => new Promise((resolve, reject) => {
  if (!imgBuffer) return reject(new Error("Image buffer is required"));

  const options = { resource_type: resourceType };
  if (resourceType === "image") options.format = mimetype?.split("/")[1];

  const uploadStream = cloudinary.uploader.upload_stream(
    options,
    (error, result) => {
      if (error) return reject(error);
      return resolve(result.secure_url);
    },
  );

  Readable.from(imgBuffer).pipe(uploadStream);
});

const destroyFromCloudinary = async (imageUrl) => {
  if (!imageUrl) return;
  const uploadPath = imageUrl.split("/upload/")[1];
  if (!uploadPath) throw new Error("Invalid Cloudinary image URL");

  const publicId = uploadPath
    .replace(/^v\d+\//, "")
    .replace(/\.[^/.]+$/, "");
  return cloudinary.uploader.destroy(publicId, { resource_type: "image" });
};

module.exports = { uploadCloudinary, destroyFromCloudinary };
