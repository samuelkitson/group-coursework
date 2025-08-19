require("dotenv").config();
const { mongoose } = require("../config/db");
const userModel = require("../models/user");
const readlineSync = require("readline-sync");
const { generateHash } = require("../utility/auth");

(async () => {
  try {
    console.log("=== Enable password login on an existing account ===\n");

    const email = readlineSync.question("Email address of the account: ");

    const user = await userModel.findOne({ email });
    if (!user) throw Error("user not found");

    const password = readlineSync.question("Enter a password: ", { hideEchoBack: true });
    const confirmPassword = readlineSync.question("Confirm password: ", { hideEchoBack: true });

    if (password != confirmPassword) throw Error("passwords did not match");
    if (password.length < 8) throw Error("password must be at least 9 characters long");

    const hashed = await generateHash(password);
    user.passwordHash = hashed;
    await user.save();

    console.log(`\n✅ Password login enabled for ${user?.displayName}`);
  } catch (err) {
    console.error("\n❌ An error occurred:", err.message);
  } finally {
    mongoose.connection.close();
  }
})();
