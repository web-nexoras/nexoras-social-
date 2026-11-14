const { areFriends } = require("./friendsService");

const chatService = {
  areFriends,
};

module.exports = chatService;
module.exports.areFriends = areFriends;
