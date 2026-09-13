import multer from 'multer';
import fs from 'fs';
import path from 'path';

const storage = multer.diskStorage({
  filename: function (_req, file, callback) {
    callback(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

const avatarDir = 'uploads/avatars';

const avatarStorage = multer.diskStorage({
  destination: function (_req, _file, callback) {
    fs.mkdirSync(path.resolve(avatarDir), { recursive: true });
    callback(null, avatarDir);
  },
  filename: function (_req, file, callback) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    callback(null, 'avatar-' + Date.now() + ext);
  },
});

const uploadAvatarImage = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (_req, file, callback) {
    if (file.mimetype.startsWith('image/')) {
      callback(null, true);
    } else {
      callback(new Error('Please upload an image file.'));
    }
  },
});

export default upload;
export { uploadAvatarImage };