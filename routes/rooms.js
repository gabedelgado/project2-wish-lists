const router = require("express").Router();
const { is } = require("express/lib/request");
const isLoggedIn = require("../middleware/isLoggedIn");
const isRoomMember = require("../middleware/isRoomMember");
const Room = require("../models/Room.model");
const User = require("../models/User.model");
const Wish_List = require("../models/Wish_List.model");
const Wish = require("../models/Wish.model");
const mongoose = require("mongoose");
const axios = require("axios").default;

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
    res.render("rooms/room", { room, currentUser: req.session.user._id });
  } catch (error) {
    console.log(error);
    res.render("error");
  }
});

router.post("/:id/createwish", isLoggedIn, isRoomMember, async (req, res) => {
  try {
    let { itemName, description, otherURL, amazonURL } = req.body;
    let productID = null;
    let amazonPrice = null;
    let amazonImageURL = null;
    if (amazonURL) {
      const dpRegex = new RegExp("/dp/([^/?]+)[/?]", "g");
      let matches = dpRegex.exec(amazonURL);
      productID = matches ? matches[1] : null;
      if (productID) {
        //pull info from amazon api
        const options = {
          method: "GET",
          url: "https://amazon24.p.rapidapi.com/api/product/" + productID,
          params: { country: "US" },
          headers: {
            "x-rapidapi-host": "amazon24.p.rapidapi.com",
            "x-rapidapi-key":
              "1547880da5msh516cf9307851d4ep1b9128jsned839e804a7b",
          },
        };
        let { data } = await axios.request(options);
        amazonPrice = data.app_sale_price;
        amazonImageURL = data.product_small_image_urls[0];
      }
    }

    let newwish = await Wish.create({
      itemName,
      description,
      otherURL,
      wishOwner: req.session.user._id,
      amazonURL,
      amazonPrice,
      amazonImageURL,
    });

    let { wishLists } = await Room.findById(req.params.id, {
      wishLists: 1,
    }).populate("wishLists");

    let wishlistID = "";
    wishLists.forEach((list) => {
      if (list.listOwner.toString() === req.session.user._id) {
        wishlistID = list._id.toString();
      }
    });

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

router.get("/:id/edit", isLoggedIn, isRoomMember, async (req, res) => {
  try {
    let room = await Room.findById(req.params.id).populate("users");
    res.render("rooms/edit", { room });
  } catch (error) {
    res.render("error");
    console.log(error);
  }
});

router.post(
  "/:id/:userid/delete",
  isLoggedIn,
  isRoomMember,
  async (req, res) => {
    try {
      // delete the the users wishes from the correct wishlist
      let { wishLists: wishlist } = await Room.findById(req.params.id, {
        wishLists: 1,
      }).populate({
        path: "wishLists",
        match: { listOwner: mongoose.Types.ObjectId(req.params.userid) },
      });
      wishlist = wishlist[0];
      wishlist.wishes.forEach(async (wish) => {
        await Wish.findByIdAndDelete(wish);
      });

      // delete the user wishlist
      await Wish_List.findByIdAndDelete(wishlist._id);

      // update room to remove wishlist from wishLists and user from users
      await Room.findByIdAndUpdate(req.params.id, {
        $pull: {
          wishLists: mongoose.Types.ObjectId(wishlist._id),
          users: mongoose.Types.ObjectId(req.params.userid),
        },
      });

      // update user to remove room from user
      await User.findByIdAndUpdate(req.params.userid, {
        $pull: { rooms: mongoose.Types.ObjectId(req.params.id) },
      });
      res.redirect("/rooms/" + req.params.id + "/edit");
    } catch (error) {
      res.render("error");
      console.log(error);
    }
  }
);

router.post("/:id/delete", isLoggedIn, isRoomMember, async (req, res) => {
  try {
    // delete wishlists and wishes inside those wishlists
    let { wishLists, users } = await Room.findById(req.params.id).populate(
      "wishLists"
    );
    wishLists.forEach(async (wishlist) => {
      wishlist.wishes.forEach(async (wish) => {
        await Wish.findByIdAndDelete(wish);
      });
      await Wish_List.findByIdAndDelete(wishlist._id);
    });

    // delete room altogether
    await Room.findByIdAndDelete(req.params.id);

    // delete room from each user
    users.forEach(async (user) => {
      await User.findByIdAndUpdate(user, {
        $pull: { rooms: mongoose.Types.ObjectId(req.params.id) },
      });
    });

    res.redirect("/rooms");
  } catch (error) {
    console.log(error);
    res.render("error");
  }
});

router.post("/:id/edit", isLoggedIn, isRoomMember, async (req, res) => {
  try {
    let { name, description } = req.body;
    await Room.findByIdAndUpdate(req.params.id, { name, description });
    res.redirect("/rooms/" + req.params.id + "/edit");
  } catch (error) {
    console.log(error);
    res.render("error");
  }
});
module.exports = router;
