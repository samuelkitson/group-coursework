require("dotenv").config();
const { mongoose } = require("../config/db");
const userModel = require("../models/user");
const readlineSync = require("readline-sync");
const { generateHash } = require("../utility/auth");


console.log("=== ACCOUNT EDITOR UTILITY ===");
console.log("This script is used to edit individual user accounts.")

async function mainMenu(user) {
  while (true) {
    console.log("\n\nMENU")
    console.log("  1. Change email address");
    console.log("  2. Change display name");
    console.log("  3. Change account type (staff/student/placeholder)");
    console.log("  4. Set/change password for direct login");
    console.log("  5. Disable direct login with password");
    console.log("  6. Delete account");
    console.log("  9: Exit");

    const choice = readlineSync.question("Choose an option (1-9): ");
    switch (choice) {
      case "1":
        await changeEmailAddress(user);
        break;
      case "2":
        await changeDisplayName(user);
        break;
      case "3":
        await changeRole(user);
        break;
      case "4":
        await setChangePassword(user);
        break;
      case "5":
        await disablePasswordLogin(user);
        break;
      case "6":
        await deleteAccount(user);
        break;
      case "9":
        console.log("Goodbye!");
        return;
    }
  }
}

async function changeEmailAddress(user) {
  const email = readlineSync.question(`\nEnter ${user.displayName}'s new email address: `);
  if (email) {
    user.email = email;
    await user.save();
    console.log(`✅ Email address changed successfully.`);
  } else {
    console.log("⚠️ Operation cancelled.");
  }
}

async function changeDisplayName(user) {
  const displayName = readlineSync.question(`\nEnter ${user.displayName}'s new display name: `);
  if (displayName) {
    user.displayName = displayName;
    await user.save();
    console.log(`✅ Display name changed successfully.`);
  } else {
    console.log("⚠️ Operation cancelled.");
  }
}

async function changeRole(user) {
  if (user.role === "admin") {
    return console.error("\n❌ You can't demote admins with this tool.");
  }
  console.log(`\n${user.displayName}'s account is currently of the type "${user.role}".`);
  const newRole = readlineSync.question(`Enter a new role [staff/student/placeholder]: `);
  if (!["staff", "student", "placeholder"].includes(newRole)) {
    return console.error("❌ Invalid role entered.");
  } else {
    user.role = newRole;
    await user.save();
    console.log(`✅ Account type set to ${newRole}.`);
  }
}

async function setChangePassword(user) {
  console.log("");
  const password = readlineSync.question("Enter a password: ", { hideEchoBack: true });
  const confirmPassword = readlineSync.question("Confirm password: ", { hideEchoBack: true });
  if (password != confirmPassword) return console.error("❌ Passwords did not match.");
  if (password.length < 8) return console.error("❌ Password must be at least 9 characters in length.");
  const hashed = await generateHash(password);
  user.passwordHash = hashed;
  await user.save();
  console.log("✅ Password login enabled.");
}

async function disablePasswordLogin(user) {
  console.log("");
  if (user.passwordHash) {
    const confirmation = readlineSync.question("Confirm disabling password login for this user [Y/N]: ");
    if (confirmation === "Y") {
      user.passwordHash = undefined;
      await user.save();
      console.log("✅ Password login disabled.");
    } else {
      console.log("⚠️ Operation cancelled.");
    }
  } else {
    console.log("❌ Direct password login isn't enabled for this user.");
  }
}

async function deleteAccount(user) {
  console.log("\nWARNING: this action cannot be undone.");
  const confirmation = readlineSync.question(`Confirm deletion of ${user.displayName}'s account [Y/N]: `);
  if (confirmation === "Y") {
    await userModel.deleteOne({ _id: user._id });
    console.log("✅ User account deleted.");
    throw new Error("exiting tool as account has been deleted");
  } else {
    console.log("⚠️ Operation cancelled.");
  }
}

(async () => {
  try {
    const email = readlineSync.question("\nEnter the user's email address: ");
    const user = await userModel.findOne({ email });
    if (!user) throw Error("user not found.");
    console.log(`User account found: ${user.displayName}`);
    await mainMenu(user);
  } catch (err) {
    console.error(`\n❌ An error occurred: ${err.message}.`);
  } finally {
    mongoose.connection.close();
  }
})();
