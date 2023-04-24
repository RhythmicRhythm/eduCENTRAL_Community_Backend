const mongoose = require("mongoose");

const postSchema = mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    userimage: {
      type: String,
      required: [true, "Please add a photo"],
      default:
        "https://preview.redd.it/cpslext1vx971.png?auto=webp&s=a67d767ddec283c3490613cdb0b40c180a33daf6",
    },
    image: {
      type: String,
      default: "",
    },

    comments: [
      {
        text: {
          type: String,
          required: true,
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        replies: [
          {
            replyText: {
              type: String,
              required: false,
            },
            user: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
            createdAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      },
    ],
    likes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
    dislikes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    dislikesCount: {
      type: Number,
      default: 0,
    },
  },

  {
    timestamps: true,
  }
);

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
