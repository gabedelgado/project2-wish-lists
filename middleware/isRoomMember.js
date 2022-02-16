const Room = require("../models/Room.model");
module.exports = async (req, res, next) => {
  // checks if the user is logged in when trying to access a specific page
  let { users } = await Room.findById(req.params.id, "users");
  let stringUsers = users.map((user) => user.toString());
  if (!stringUsers.includes(req.session.user._id)) {
    res.render("rooms/user-rooms", {
      errorMessage:
        "You do not have permission to view that room. Listed below are the rooms you are a part of",
    });
  } else {
    next();
  }
};
