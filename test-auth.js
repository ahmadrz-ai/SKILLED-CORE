const { auth } = require('./src/auth');

async function main() {
  try {
    console.log("Calling auth()...");
    const session = await auth();
    console.log("Session:", session);
  } catch (err) {
    console.error("Auth threw error:", err);
  }
}

main();
