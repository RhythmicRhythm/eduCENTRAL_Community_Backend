const asyncHandler = require("express-async-handler");
const { fileSizeFormatter } = require("../utils/fileUpload");
const Post = require("../models/postModel");
const cloudinary = require("cloudinary").v2;
const User = require("../models/userModel");

const createPost = asyncHandler(async (req, res) => {
  try {
    const { desc, userimage } = req.body;

    // Validation
    if (!desc) {
      res.status(400);
      throw new Error("Please fill in all fields");
    }

    // Handle Image upload
    let fileData = {};

    if (req.file) {
      // Fetch user from the database
      const user = await User.findById(req.user.id);

      // Create Post with user's name
      const post = await Post.create({
        author: req.user.id,
        name: user.firstname,
        desc: desc.replace(/\n/g, "<br/>"), // Replace newline characters with <br/> tags

        userimage,
        image: req.file.path,
      });

      res.status(201).json(post);
    } else {
      // Create Post without image
      const user = await User.findById(req.user.id);

      const post = await Post.create({
        author: req.user.id,
        name: user.firstname,
        desc,
        userimage,
      });

      res.status(201).json(post);
    }
  } catch (err) {
    console.error(err);
    const error = new Error(err.message);
    res.status(500).send(error);
  }
});

// Get all Posts
const getPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({ author: req.user.id }).sort("-createdAt");
  res.status(200).json(posts);
});

// Get posts under an admin
const getPostUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  // Log the ID of the user who added the current user
  const posts = await Post.find({ author: user.addedBy }).sort("-createdAt");

  res.status(200).json(posts);
});

// Get single post
const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate({
      path: "author comments.user comments.replies.user",
      model: "User",
      select: "firstname lastname image",
      strictPopulate: false, // add this line to fix the error
    })
    .exec();

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  res.status(200).json(post);
});

// Add comment to post
const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text) {
    res.status(400);
    throw new Error("Please enter a comment");
  }

  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error("Post not found");
    }

    const comment = {
      text,
      user: req.user.id,
    };

    post.comments.push(comment);

    await post.save();

    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

// Add reply to comment
const addReply = asyncHandler(async (req, res) => {
  const { replyText } = req.body;

  if (!replyText) {
    res.status(400);
    throw new Error("Please enter a reply");
  }

  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error("Post not found");
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      res.status(404);
      throw new Error("Comment not found");
    }

    const commentreply = {
      replyText,
      user: req.user.id,
    };

    comment.replies.push(commentreply);

    await post.save();

    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

// Like Post
const likePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  // Check if user has already liked the post
  const alreadyLiked = post.likes.find(
    (like) => like.user.toString() === req.user.id
  );

  // Check if user has already disliked the post
  const alreadyDisliked = post.dislikes.find(
    (dislike) => dislike.user.toString() === req.user.id
  );

  if (alreadyLiked) {
    // User has already liked the post, so remove the like
    post.likes = post.likes.filter(
      (like) => like.user.toString() !== req.user.id
    );
    post.likesCount--;
  } else {
    // User has not liked the post, so add the like
    post.likes.push({ user: req.user.id });
    post.likesCount++;
  }

  if (alreadyDisliked) {
    // User has already disliked the post, so remove the dislike
    post.dislikes = post.dislikes.filter(
      (dislike) => dislike.user.toString() !== req.user.id
    );
    post.dislikesCount--;
  }

  res.status(200).json(post);
  const updatedPost = await post.save();
});

// Dislike Post
const dislikePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  // Check if user has already disliked the post
  const alreadyDisliked = post.dislikes.find(
    (dislike) => dislike.user.toString() === req.user.id
  );

  // Check if user has already liked the post
  const alreadyLiked = post.likes.find(
    (like) => like.user.toString() === req.user.id
  );

  if (alreadyDisliked) {
    // User has already disliked the post, so remove the dislike
    post.dislikes = post.dislikes.filter(
      (dislike) => dislike.user.toString() !== req.user.id
    );
    post.dislikesCount--;
  } else {
    // User has not disliked the post, so add the dislike
    post.dislikes.push({ user: req.user.id });
    post.dislikesCount++;
  }

  if (alreadyLiked) {
    // User has already liked the post, so remove the like
    post.likes = post.likes.filter(
      (like) => like.user.toString() !== req.user.id
    );
    post.likesCount--;
  }

  res.status(200).json(post);

  const updatedPost = await post.save();
});

module.exports = {
  createPost,
  getPosts,
  getPostUser,
  getPostById,
  addComment,
  addReply,
  likePost,
  dislikePost,
};
