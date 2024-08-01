const express = require("express");
const { logIn, createPostCard, listPostCard, getPostcard, getPostcardById } = require("../controllers/authControllers");
const verifyToken = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = require("../middleware/multer");

const router = express.Router();

router.post("/login", multer().none(), logIn);

router.post("/create-postcard", verifyToken, upload.single('file'), createPostCard);

router.get("/all-postcard", verifyToken, listPostCard);

router.get("/unique-postcard/:link", getPostcard);

router.put("/postcard/:id", getPostcardById);

module.exports = router;
