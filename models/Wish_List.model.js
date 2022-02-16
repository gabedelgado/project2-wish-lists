const { Schema, model } = require("mongoose");

// TODO: Please make sure you edit the user model to whatever makes sense in this case
const wishListSchema = new Schema(
  {
    associatedRoom: {
      type: Schema.Types.ObjectId,
      ref: "Room",
    },
    listOwner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    wishes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Wish",
      },
    ],
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

const Wish_List = model("Wish_List", wishListSchema);

module.exports = Wish_List;
