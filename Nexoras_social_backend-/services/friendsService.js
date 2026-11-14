const mongoose = require("mongoose");
const FriendRequest = require("../models/FriendRequest");
const Friendship = require("../models/Friendship");
const User = require("../models/User");

const areFriends = async (a, b) => {
  const [x, y] = [a.toString(), b.toString()].sort();
  const friendship = await Friendship.findOne({ userA: x, userB: y });
  return !!friendship;
};

const findUserById = async (id) => {
  if (!mongoose.isValidObjectId(id)) return null;
  return User.findById(id);
};

const createFriendshipIfNotExists = async (a, b) => {
  const [x, y] = [a.toString(), b.toString()].sort();
  try {
    await Friendship.create({ userA: x, userB: y });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
};

module.exports = { areFriends, findUserById, createFriendshipIfNotExists, FriendRequest, Friendship, User };
