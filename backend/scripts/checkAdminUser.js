import db from "../models/index.js";

const { User } = db;

async function checkAdminUser() {
  try {
    console.log("Checking for admin users...\n");

    // Find all users with phoneNumber starting with admin or specific admin phone
    const adminUsers = await User.findAll({
      where: {
        phoneNumber: ["9999999999", "1234567890"], // Common admin phone numbers
      },
      attributes: ["id", "name", "phoneNumber", "email", "role", "createdAt"],
    });

    if (adminUsers.length === 0) {
      console.log("No admin users found with common phone numbers.");
      console.log("Searching for any users with 'admin' in name or superadmin role...\n");

      const allAdmins = await User.findAll({
        where: {
          role: "superadmin",
        },
        attributes: ["id", "name", "phoneNumber", "email", "role", "createdAt"],
      });

      if (allAdmins.length === 0) {
        console.log("No users with superadmin role found.");
        console.log("\nLet me check the first few users in the database:\n");

        const someUsers = await User.findAll({
          limit: 5,
          attributes: ["id", "name", "phoneNumber", "email", "role", "createdAt"],
        });

        console.table(someUsers.map((u) => u.toJSON()));
      } else {
        console.log("Found superadmin users:");
        console.table(allAdmins.map((u) => u.toJSON()));
      }
    } else {
      console.log("Found admin users:");
      console.table(adminUsers.map((u) => u.toJSON()));
    }

    process.exit(0);
  } catch (error) {
    console.error("Error checking admin user:", error);
    process.exit(1);
  }
}

checkAdminUser();
