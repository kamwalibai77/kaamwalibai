// // Require ngrok javascript sdk
import ngrok from "@ngrok/ngrok";
// import ngrok from '@ngrok/ngrok' // if inside a module
(async function () {
  // Establish connectivity
  await ngrok.authtoken("33Hs42XonDuHxblbsMTCjPaL6Uu_3oyJgeu8rDc7MJ1n9KG7k");

  const listener = await ngrok.forward({
    addr: 5000,
  });

  // Output ngrok url to console
  console.log(`Ingress established at: ${listener.url()}`);
})();

process.stdin.resume();
