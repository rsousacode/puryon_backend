const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator/check');

const io = require('../socket');
const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 4;
  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200).json({
      message: 'Fetched posts successfully.',
      posts: posts,
      totalItems: totalItems
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  const playername = req.body.playername;
  const kills = req.body.kills;
  const deaths = req.body.deaths;
  const description = req.body.description;
  const post = new Post({
    playername: playername,
    description: description,
    kills: kills,
    deaths: deaths
  });
  try {
    await post.save();
    /*
    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();
    */

    io.getIO().emit('posts', {
      action: 'create',
      post: { ...post._doc }
    });
    res.status(201).json({
      message: 'Post created successfully!',
      post: post
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  const post = await Post.findById(postId);
  try {
    if (!post) {
      const error = new Error('Could not find post.');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ message: 'Post fetched.', post: post });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};


exports.verifyPlayer = async (req, res, next) => {
  const playerName = req.params.playerName;

  const post = await Post.findOne({ playername: playerName });
  try {
    if (!post) {

      const description = req.body.description;
      const post = new Post({
        playername: playerName,
        description: "Newly born player.",
        kills: 0,
        deaths: 0
      });
      try {
        await post.save();
        /*
        const user = await User.findById(req.userId);
        user.posts.push(post);
        await user.save();
        */

        io.getIO().emit('posts', {
          action: 'create',
          post: { ...post._doc }
        });
        res.status(201).json({
          message: 'Post created successfully!',
          post: post
        });
      } catch (err) {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      }
    }
    res.status(200).json({ message: 'Post fetched.', post: post });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  const playername = req.body.playername;
  const kills = req.body.kills;
  const deaths = req.body.deaths;
  const description = req.body.description;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error('Could not find post.');
      error.statusCode = 404;
      throw error;
    }

    post.playername = playername;
    post.description = description;
    post.kills = kills;
    post.deaths = deaths;

    const result = await post.save();
    io.getIO().emit('posts', { action: 'update', post: result });
    res.status(200).json({ message: 'Post updated!', post: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updatePlayer = async (req, res, next) => {
  const playerName = req.params.playerName;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  const kills = req.body.kills;
  const deaths = req.body.deaths;
  const description = req.body.description;

  try {
    const post = await Post.findOne({ playername: playerName });
    if (!post) {
      const error = new Error('Could not find post.');
      error.statusCode = 404;
      throw error;
    }

    post.description = description;
    post.kills = kills;
    post.deaths = deaths;

    const result = await post.save();
    io.getIO().emit('posts', { action: 'update', post: result });
    res.status(200).json({ message: 'Player updated!', post: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.incrementKills = async (req, res, next) => {
  const playerName = req.params.playerName;
  try {
    const post = await Post.findOne({ playername: playerName });

    if (!post) {
      const error = new Error('Could not find post.');
      error.statusCode = 404;
      throw error;
    }
    let kills = post.kills;
    post.kills = kills + 1;

    const result = await post.save();
    io.getIO().emit('posts', { action: 'update', post: result });
    res.status(200).json({ message: 'Player Kills Incremented!', post: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.incrementDeaths = async (req, res, next) => {
  const playerName = req.params.playerName;
  try {
    const post = await Post.findOne({ playername: playerName });

    if (!post) {
      const error = new Error('Could not find player.');
      error.statusCode = 404;
      throw error;
    }
    let deaths = post.deaths;
    post.deaths = deaths + 1;

    const result = await post.save();
    io.getIO().emit('posts', { action: 'update', post: result });
    res.status(200).json({ message: 'Player Deaths Incremented!', post: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};


exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error('Could not find post.');
      error.statusCode = 404;
      throw error;
    }
    // Check logged in user
    io.getIO().emit('posts', { action: 'delete', post: postId });
    res.status(200).json({ message: 'Deleted post.' });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
