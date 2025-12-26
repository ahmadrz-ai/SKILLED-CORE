
// This is a "Genesis Script" mock.
// In a real environment, this would use Prisma Client to seed the database.
// Usage: ts-node prisma/seed.ts

const ADMIN_EMAIL = 'ahmad@trivia.global';
const SUPER_SECRET_PASSWORD_HASH = '$argon2id$v=19$m=65536,t=3,p=4$r7...'; // Mock Hash

async function main() {
    console.log('🌱 Starting Genesis Protocol...');

    // 1. Check if Admin exists via CLI simulation
    console.log(`🔍 Scanning for God Mode User: ${ADMIN_EMAIL}...`);

    // Simulate "Not Found" then "Creating"
    await new Promise(r => setTimeout(r, 1000));
    console.log('⚠️  User NOT FOUND. Initiating Creation Sequence.');

    // 2. Create User
    const adminUser = {
        email: ADMIN_EMAIL,
        password: SUPER_SECRET_PASSWORD_HASH,
        role: 'ADMIN',
        isVerified: true,
        createdAt: new Date().toISOString()
    };

    await new Promise(r => setTimeout(r, 800));
    console.log('✅ Genesis Admin Created:', adminUser);

    console.log('🚀 Genesis Protocol Complete. The Entrance is Hidden.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
