const router = require("express").Router();
const { is } = require("express/lib/request");
const isLoggedIn = require("../middleware/isLoggedIn");
const isRoomMember = require("../middleware/isRoomMember");
const Room = require("../models/Room.model");
const User = require("../models/User.model");
const Wish_List = require("../models/Wish_List.model");
const Wish = require("../models/Wish.model");

/* GET home page */
router.get("/", isLoggedIn, async (req, res, next) => {
  try {
    let { rooms } = await User.findById(req.session.user._id, "rooms").populate(
      "rooms"
    );
    res.render("rooms/user-rooms", { rooms });
  } catch (error) {
    res.render("rooms/user-rooms", {
      errorMessage:
        "Something went wrong when trying to load your rooms, please try again.",
    });
  }
});

router.get("/create", isLoggedIn, (req, res, next) => {
  res.render("rooms/create");
});

router.post("/create", isLoggedIn, async (req, res) => {
  try {
    let { name, description } = req.body;
    let createdRoom = await Room.create({
      name,
      description,
      roomOwner: req.session.user._id,
      users: [req.session.user._id],
    });
    let ownerwishlist = await Wish_List.create({
      associatedRoom: createdRoom._id,
      listOwner: req.session.user._id,
    });
    await User.findByIdAndUpdate(req.session.user._id, {
      $push: { rooms: createdRoom._id },
    });
    await Room.findByIdAndUpdate(createdRoom._id, {
      $push: { wishLists: ownerwishlist._id },
    });

    res.redirect("/rooms");
  } catch (error) {
    res.render("rooms/create", {
      errorMessage:
        "Something went wrong trying to add the room, please try again.",
    });
  }
});

router.get("/:id", isLoggedIn, isRoomMember, async (req, res) => {
  try {
    let room = await Room.findById(req.params.id).populate({
      path: "wishLists",
      populate: "wishes listOwner",
    });
    console.log("wishlists from room: ", room.wishLists);
    res.render("rooms/room", { room, currentUser: req.session.user._id });
  } catch (error) {
    console.log(error);
    res.render("error");
  }
});

router.post("/:id/createwish", isLoggedIn, isRoomMember, async (req, res) => {
  try {
    let { itemName, description, otherURL } = req.body;
    let newwish = await Wish.create({
      itemName,
      description,
      otherURL,
      wishOwner: req.session.user._id,
    });
    let { wishLists } = await Room.findById(req.params.id, {
      wishLists: 1,
    }).populate("wishLists");

    console.log("wishlists variable contains: ", wishLists);
    let wishlistID = "";
    wishLists.forEach((list) => {
      // console.log("list.listOwner.toString():  ", list.listOwner.toString());
      // console.log("req.session.user._id:  ", req.session.user._id);
      // console.log(
      //   "equality test: ",
      //   list.listOwner.toString() === req.session.user._id
      // );
      // console.log("list id to string: ", list._id.toString());
      if (list.listOwner.toString() === req.session.user._id) {
        wishlistID = list._id.toString();
      }
    });
    // console.log("wishlistID: ", wishlistID);
    if (wishlistID) {
      await Wish_List.findByIdAndUpdate(wishlistID, {
        $push: { wishes: newwish._id },
      });
      res.redirect("/rooms/" + req.params.id);
    } else {
      console.log("something went wrong when retrieving the users wishlist");
      res.render("error");
    }
  } catch (error) {
    console.log(error);
    res.render("error");
  }
});

router.post("/:id/add-user", isLoggedIn, isRoomMember, async (req, res) => {
  try {
    let newUser = await User.findOneAndUpdate(
      { email: req.body.newUser },
      { $push: { rooms: req.params.id } }
    );
    let newwishlist = await Wish_List.create({
      associatedRoom: req.params.id,
      listOwner: newUser._id,
    });
    await Room.findByIdAndUpdate(req.params.id, {
      $push: { users: newUser._id, wishLists: newwishlist._id },
    });
    res.redirect("/rooms/" + req.params.id);
  } catch (error) {
    console.log(error);
    res.render("error");
  }
}); //maybe make a isroomowner here????

router.post(
  "/:id/:wishid/claim",
  isLoggedIn,
  isRoomMember,
  async (req, res) => {
    try {
      await Wish.findByIdAndUpdate(req.params.wishid, {
        claimed: true,
        claimedBy: req.session.user._id,
        claimedByName: req.session.user.fullName,
      });
      res.redirect("/rooms/" + req.params.id);
    } catch (error) {
      console.log(error);
      res.render("error");
    }
  }
);

module.exports = router;
