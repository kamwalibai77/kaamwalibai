import axios from "axios";

async function testAdminKYCAPI() {
  try {
    // First, login as superadmin to get token
    console.log("Step 1: Logging in as superadmin...");
    const loginResponse = await axios.post(
      "http://192.168.1.3:5000/api/auth/send-otp",
      {
        phoneNumber: "9999999999",
      }
    );
    console.log("OTP Send Response:", loginResponse.data);

    // For testing, we'll use a hardcoded verification (in production, you'd get the OTP)
    // Let's try to call the KYC API without token first to see the error

    console.log("\nStep 2: Fetching KYC list...");
    try {
      const kycResponse = await axios.get(
        "http://192.168.1.3:5000/api/admin/kyc"
      );
      console.log("\n=== KYC API Response ===");
      console.log(JSON.stringify(kycResponse.data, null, 2));

      if (kycResponse.data.providers) {
        console.log("\n=== Provider KYC URLs ===");
        kycResponse.data.providers.forEach((provider, index) => {
          console.log(`\n${index + 1}. ${provider.name}`);
          console.log(`   kycFrontUrl: ${provider.kycFrontUrl || "MISSING"}`);
          console.log(`   kycBackUrl: ${provider.kycBackUrl || "MISSING"}`);
        });
      }
    } catch (apiError) {
      console.error("API Error:", apiError.response?.data || apiError.message);
    }
  } catch (error) {
    console.error("Test Error:", error.message);
  }
}

testAdminKYCAPI();
