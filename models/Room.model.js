const { Schema, model } = require("mongoose");

// TODO: Please make sure you edit the user model to whatever makes sense in this case
const roomSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    roomOwner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    wishLists: [
      {
        type: Schema.Types.ObjectId,
        ref: "Wish_List",
      },
    ],
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

const Room = model("Room", roomSchema);

module.exports = Room;
