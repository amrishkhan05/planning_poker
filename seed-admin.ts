import { registerWorkspace } from "./lib/store.js";

async function seed() {
  try {
    console.log("🚀 Seeding Admin Account...");
    const result = await registerWorkspace({
      workspaceName: "Studio Elite",
      displayName: "Amrish Admin",
      email: "admin@studio.elite",
      password: "elitepassword123"
    });
    console.log("✅ Admin Created Successfully!");
    console.log("Email: admin@studio.elite");
    console.log("Password: elitepassword123");
    console.log("Workspace: Studio Elite");
  } catch (error) {
    if (error instanceof Error && error.message.includes("Email already exists")) {
      console.log("ℹ️ Admin account already exists.");
    } else {
      console.error("❌ Seeding failed:", error);
    }
  }
}

seed();
