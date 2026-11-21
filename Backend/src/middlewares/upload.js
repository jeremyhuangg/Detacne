import multer from 'multer';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
    },
    fileFilter: (req, file, callback) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

        if (!allowedTypes.includes(file.mimetype)) {
            const error = new Error('Format foto harus JPEG, PNG, atau WebP');
            error.status = 400;
            return callback(error);
        }

        callback(null, true);
    },
});

export default upload;
