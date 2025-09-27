// ngrok.js
import ngrok from "ngrok";

(async () => {
  try {
    // Replace 5000 with your backend port
    const url = await ngrok.connect(5000);
    console.log("ngrok URL:", url);
    console.log("Keep this terminal open to keep ngrok running!");
  } catch (err) {
    console.error("Error starting ngrok:", err);
  }
})();
