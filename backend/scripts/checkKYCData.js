import { Op } from "sequelize";
import db from "../models/index.js";

const { User } = db;

async function checkKYCData() {
  try {
    const providers = await User.findAll({
      where: {
        role: "ServiceProvider",
        kycSubmittedAt: { [Op.ne]: null },
      },
      attributes: [
        "id",
        "name",
        "phoneNumber",
        "kycStatus",
        "kycFrontUrl",
        "kycBackUrl",
        "kycSubmittedAt",
        "aaadharNumber",
        "panCardNumber",
      ],
      limit: 10,
    });

    console.log("\n=== Service Providers with KYC Submitted ===\n");
    console.log(`Total found: ${providers.length}\n`);

    providers.forEach((provider, index) => {
      console.log(`${index + 1}. ${provider.name} (ID: ${provider.id})`);
      console.log(`   Phone: ${provider.phoneNumber}`);
      console.log(`   KYC Status: ${provider.kycStatus}`);
      console.log(`   Aadhaar: ${provider.aaadharNumber || "Not set"}`);
      console.log(`   PAN: ${provider.panCardNumber || "Not set"}`);
      console.log(
        `   KYC Front URL: ${provider.kycFrontUrl ? "✓ SET" : "✗ MISSING"}`
      );
      console.log(
        `   KYC Back URL: ${provider.kycBackUrl ? "✓ SET" : "✗ MISSING"}`
      );
      console.log(
        `   Submitted At: ${
          provider.kycSubmittedAt
            ? new Date(provider.kycSubmittedAt).toLocaleString()
            : "N/A"
        }`
      );
      console.log(
        `   Front URL: ${provider.kycFrontUrl ? provider.kycFrontUrl : "EMPTY"}`
      );
      console.log(
        `   Back URL: ${provider.kycBackUrl ? provider.kycBackUrl : "EMPTY"}\n`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("Error checking KYC data:", error);
    process.exit(1);
  }
}

checkKYCData();
