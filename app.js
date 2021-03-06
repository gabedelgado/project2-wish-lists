// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
require("dotenv/config");
const User = require("./models/User.model");
// ℹ️ Connects to the database
require("./db");

// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
const express = require("express");

// Handles the handlebars
// https://www.npmjs.com/package/hbs
const hbs = require("hbs");
hbs.registerHelper("ifNotEquals", function (arg1, arg2, options) {
  return arg1.toString() !== arg2.toString()
    ? options.fn(this)
    : options.inverse(this);
});
hbs.registerHelper("getFullNameFromID", (id) => {
  User.findById(id).then((user) => {
    return user.fullName;
  });
});
hbs.registerHelper("ifEquals", function (arg1, arg2, options) {
  return arg1.toString() === arg2.toString()
    ? options.fn(this)
    : options.inverse(this);
});

const app = express();

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

const projectName = "project2-wish-lists";
const capitalized = (string) =>
  string[0].toUpperCase() + string.slice(1).toLowerCase();

app.locals.title = `${capitalized(projectName)} created with IronLauncher`;

// 👇 Start handling routes here
const index = require("./routes/index");
app.use("/", index);

const authRouter = require("./routes/auth");
app.use("/auth", authRouter);

const roomsRouter = require("./routes/rooms");
app.use("/rooms", roomsRouter);

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

module.exports = app;
