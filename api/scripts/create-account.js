require("dotenv").config();
const { mongoose } = require("../config/db");
const userModel = require("../models/user");
const readlineSync = require("readline-sync");
const { generateHash } = require("../utility/auth");

(async () => {
  try {
    console.log("=== ACCOUNT CREATION UTILITY ===\n");
    console.log("This script is used to create one-off accounts.");

    const email = readlineSync.question("Email address: ");
    const user = await userModel.findOne({ email });
    if (user) throw Error("email address already exists in database");

    const displayName = readlineSync.question("Display name: ");
    if (!displayName) throw Error("display name not provided");

    const role = readlineSync.question(`User role [staff/student/placeholder]: `);
    if (!["staff", "student", "placeholder"].includes(role)) throw Error("invalid role provided");

    const password = readlineSync.question("Password (leave blank to enforce Microsoft login): ", { hideEchoBack: true });
    let passwordHash;
    if (password) {
      const confirmPassword = readlineSync.question("Confirm password: ", { hideEchoBack: true });
      if (password != confirmPassword) return console.error("❌ Passwords did not match.");
      if (password.length < 8) return console.error("❌ Password must be at least 9 characters in length.");
      passwordHash = await generateHash(password);
    }

    const createdUser = await userModel.create({
      email,
      displayName,
      role,
      passwordHash,
    });

    console.log(`\n✅ User account created for ${createdUser?.displayName}`);
  } catch (err) {
    console.error("\n❌ An error occurred:", err.message);
  } finally {
    mongoose.connection.close();
  }
})();
