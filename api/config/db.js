require("dotenv").config();
const mongoose = require("mongoose");

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:27017`;

mongoose
  .connect(mongoUri, { dbName: "groupsappdb" })
  .then(() => console.log("Connected to MongoDB."))
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });

module.exports = { mongoose, mongoUri };
