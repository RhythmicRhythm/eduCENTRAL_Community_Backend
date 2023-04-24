const express = require("express");
const {
  createPost,
  getPosts,
  getPostUser,
  addComment,
  addReply,
  likePost,
  getPostById,
  dislikePost,
} = require("../controllers/postController");
const protect = require("../middleWare/authMiddleware");
const router = express.Router();
const { upload } = require("../utils/fileUpload");

router.post("/", protect, upload.single("image"), createPost);
router.get("/getposts", protect, getPosts);
router.get("/getpost/:id", protect, getPostById);
router.get("/getpostuser", protect, getPostUser);
router.post("/addcomment/:id", protect, addComment);
router.post("/addreply/:id/:commentId", protect, addReply);
router.post("/likepost/:id", protect, likePost);
router.post("/dislikepost/:id", protect, dislikePost);

module.exports = router;
