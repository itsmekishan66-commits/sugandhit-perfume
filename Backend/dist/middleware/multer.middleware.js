import multer from 'multer';
const storage = multer.diskStorage({
    filename: function (_req, file, callback) {
        callback(null, Date.now() + '-' + file.originalname);
    },
});
const upload = multer({ storage });
export default upload;
