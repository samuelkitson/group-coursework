require("dotenv").config();
const { mongoose } = require("../config/db");
const userModel = require("../models/user");
const assignmentModel = require("../models/assignment");
const checkinModel = require("../models/checkin");
const meetingModel = require("../models/meeting");
const observationModel = require("../models/observation");
const peerReviewModel = require("../models/peerReview");
const teamModel = require("../models/team");
const readlineSync = require("readline-sync");

console.log("=== DATABASE RESET UTILITY ===");
console.log("This script is used to reset parts of the database.")

async function mainMenu() {
  while (true) {
    console.log("\n\nMENU")
    console.log("  1. Erase all placeholder accounts");
    console.log("  2. Erase all user accounts");
    console.log("  3. Erase all closed assignments");
    console.log("  4. Erase all assignments and related data");
    console.log("  9: Exit");

    const choice = readlineSync.question("Choose an option (1-9): ");
    switch (choice) {
      case "1":
        await removePlaceholderAccounts();
        break;
      case "2":
        await removeAllAccounts();
        break;
      case "3":
        await removeAllClosedAssignments();
        break;
      case "4":
        await removeAllNonAccountData();
        break;
      case "9":
        console.log("Goodbye!");
        return;
    }
  }
}

async function removePlaceholderAccounts(user) {
  console.log("\nWARNING: this action cannot be undone.");
  const confirmation = readlineSync.question(`Confirm deletion of all placeholder accounts [Y/N]: `);
  if (confirmation === "Y") {
    await userModel.deleteMany({ role: "placeholder" });
    console.log("✅ Placeholder accounts deleted.");
  } else {
    console.log("⚠️ Operation cancelled.");
  }
}

async function removeAllAccounts(user) {
  console.log("\nWARNING: this action cannot be undone.");
  const confirmation = readlineSync.question(`Confirm deletion of all user accounts [Y/N]: `);
  if (confirmation === "Y") {
    await userModel.deleteMany({ });
    console.log("✅ All user accounts deleted.");
  } else {
    console.log("⚠️ Operation cancelled.");
  }
}

async function removeAllClosedAssignments(user) {
  console.log("\nWARNING: this action cannot be undone.");
  const confirmation = readlineSync.question(`Confirm deletion of all closed assignments [Y/N]: `);
  if (confirmation === "Y") {
    await assignmentModel.deleteMany({ state: "closed" });
    console.log("✅ All closed assignments deleted.");
  } else {
    console.log("⚠️ Operation cancelled.");
  }
}

async function removeAllNonAccountData(user) {
  console.log("\nWARNING: this action cannot be undone.");
  const confirmation = readlineSync.question(`Confirm deletion of all assignments and related data [Y/N]: `);
  if (confirmation === "Y") {
    await assignmentModel.deleteMany({ });
    await checkinModel.deleteMany({ });
    await meetingModel.deleteMany({ });
    await observationModel.deleteMany({ });
    await peerReviewModel.deleteMany({ });
    await teamModel.deleteMany({ });
    console.log("✅ All non-account data deleted.");
  } else {
    console.log("⚠️ Operation cancelled.");
  }
}

(async () => {
  try {
    const confirmation = readlineSync.question("\n⚠️ WARNING! This utility can easily reset most of the database. Proceed with extreme caution.\nType \"UNDERSTOOD\" and press enter to continue: ");
    if (confirmation !== "UNDERSTOOD") {
      throw Error("confirmation not received")
    }
    await mainMenu();
  } catch (err) {
    console.error(`\n❌ An error occurred: ${err.message}.`);
  } finally {
    mongoose.connection.close();
  }
})();
