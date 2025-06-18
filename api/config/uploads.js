const multer = require("multer");

// https://www.npmjs.com/package/multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/tmp");
  },
});

const fileUpload = multer({ storage: storage });

module.exports = { fileUpload };
