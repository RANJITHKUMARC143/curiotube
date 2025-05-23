const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
initializeApp({
  credential: applicationDefault(),
});
const db = getFirestore();

async function fixCreatedAt() {
  const videosRef = db.collection('videos');
  const snapshot = await videosRef.get();

  let updatedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const createdAt = data.createdAt;

    // If createdAt is a string, try to parse it and update to Timestamp
    if (typeof createdAt === 'string') {
      // Try to parse the string to a Date
      const parsedDate = new Date(createdAt);
      if (!isNaN(parsedDate.getTime())) {
        await doc.ref.update({
          createdAt: Timestamp.fromDate(parsedDate),
        });
        updatedCount++;
        console.log(`Updated doc ${doc.id}: createdAt fixed`);
      } else {
        console.warn(`Could not parse createdAt for doc ${doc.id}:`, createdAt);
      }
    }
  }

  console.log(`Done! Updated ${updatedCount} documents.`);
}

fixCreatedAt().catch(console.error); 