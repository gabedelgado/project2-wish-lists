const { Schema, model } = require("mongoose");

// TODO: Please make sure you edit the user model to whatever makes sense in this case
const wishSchema = new Schema(
  {
    wishOwner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    itemName: { type: String, required: true },
    amazonID: { type: String }, // NEED TO FIGURE OUT AND RESEARCH AMAZON API
    description: { type: String },
    otherURL: { type: String },
    claimed: { type: Boolean, default: false },
    claimedByID: { type: Schema.Types.ObjectId, ref: "User" },
    claimedByName: { type: String },
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

const Wish = model("Wish", wishSchema);

module.exports = Wish;
