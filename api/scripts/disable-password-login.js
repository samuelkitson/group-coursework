require("dotenv").config();
const { mongoose } = require("../config/db");
const userModel = require("../models/user");
const readlineSync = require("readline-sync");

(async () => {
  try {
    console.log("=== Disabe password login on an existing account ===\n");

    const email = readlineSync.question("Email address of the account: ");

    const user = await userModel.findOne({ email });
    if (!user) throw Error("user not found");
    
    user.passwordHash = undefined;
    await user.save();

    console.log(`\n✅ Password login disabled for ${user?.displayName}`);
  } catch (err) {
    console.error("\n❌ An error occurred:", err.message);
  } finally {
    mongoose.connection.close();
  }
})();
