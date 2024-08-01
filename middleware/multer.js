const { error } = require('console');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadFilePath = path.resolve(__dirname, '../..', 'node-practical/public/uploads');

const storage = multer.diskStorage({
  destination: uploadFilePath,
  filename: function (req, file, callback) {
    callback(null, `${new Date().getTime().toString()}-${file.fieldname}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, callback) {
    const extension = ['.jpg', '.jpeg', '.png'].indexOf(path.extname(file.originalname).toLowerCase()) >= 0;
    const mimeType = ['image/jpg', 'image/jpeg', 'image/png'].indexOf(file.mimetype) >= 0;

    if (extension && mimeType) {
      return callback(null, true);
    }

    callback(new Error('Invalid file type. Only Image file on type JPG, Jpeg and PNG are allowed!'));
  },
});

upload.customErrorHandler = function (err, req, res, next) {
  if(!req.file){
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success : false,
          message: 'File too large. Max size is 5MB.' });
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        res.status(400).json({
          success : false,
          message: 'This filed can not contains any file!' });
      }
    } else if (err) {
      res.status(500).json({
        success : false,
        message: err.message });
    } else {
      next();
    }
  }else{
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success : false,
          message: 'File too large. Max size is 5MB.' });
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        res.status(400).json({
          success : false,
          message: 'More than 1 image selected' });
      }
    } else if (err) {
      res.status(500).json({
        success : false,
        message: err.message });
    } else {
      next();
    }
  }
}


module.exports = upload;
