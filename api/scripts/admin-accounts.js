require("dotenv").config();
const { mongoose } = require("../config/db");
const userModel = require("../models/user");
const readlineSync = require("readline-sync");


console.log("=== ADMIN ACCOUNTS UTILITY ===");
console.log("This script is used to configure which accounts have admin status.")

async function mainMenu() {
  while (true) {
    console.log("\n\nMENU")
    console.log("  1. List current admins");
    console.log("  2. Add new admin");
    console.log("  3. Remove admin");
    console.log("  9: Exit");

    const choice = readlineSync.question("Choose an option (1-9): ");
    switch (choice) {
      case "1":
        await listCurrentAdmins();
        break;
      case "2":
        await addAdmin();
        break;
      case "3":
        await removeAdmin();
        break;
      case "9":
        console.log("Goodbye!");
        return;
    }
  }
}

async function listCurrentAdmins() {
  const admins = await userModel.find({ role: "admin" }).select("email displayName").lean();
  console.log("\nCurrent admins:");
  for (const admin of admins) {
    console.log(` - ${admin.displayName} (${admin.email})`);
  }
  if (admins.length === 0) {
    console.log(" - none found");
  }
}

async function addAdmin() {
  const email = readlineSync.question("\nEnter the new admin's email address: ");
  const user = await userModel.findOne({ email });
  if (!user) return console.error("❌ Error: user not found.");
  if (user.role !== "staff") return console.error(`❌ Error: user must currently be a staff member. This user's role is: ${user.role}.`);
  user.role = "admin";
  await user.save();
  console.log(`✅ ${user?.displayName} is now an admin.`);
}

async function removeAdmin() {
  const email = readlineSync.question("\nEnter the admin's email address: ");
  const user = await userModel.findOne({ email });
  if (!user) return console.error("❌ Error: user not found.");
  if (user.role !== "admin") return console.error(`❌ Error: user must currently be an admin. This user's role is: ${user.role}.`);
  user.role = "staff";
  await user.save();
  console.log(`✅ ${user?.displayName} is no longer an admin.`);
}

(async () => {
  try {
    await mainMenu();
  } catch (err) {
    console.error(`\n❌ An error occurred: ${err.message}.`);
  } finally {
    mongoose.connection.close();
  }
})();
