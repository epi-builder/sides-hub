// Quick script to run count synchronization
import { syncAllCounts } from './countSync.js';

async function runSync() {
  try {
    console.log("🔄 Starting count synchronization...");
    const result = await syncAllCounts();
    console.log("✅ Count synchronization completed:", result);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during count synchronization:", error);
    process.exit(1);
  }
}

runSync();