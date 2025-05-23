const admin = require('firebase-admin');

// Make sure the path matches your downloaded key file
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixVideos() {
  const snapshot = await db.collection('videos').get();
  const batch = db.batch();
  snapshot.forEach(doc => {
    const data = doc.data();
    let needsUpdate = false;
    const update = {};
    if (!data.status) {
      update.status = 'published';
      needsUpdate = true;
    }
    if (!data.visibility) {
      update.visibility = 'public';
      needsUpdate = true;
    }
    if (needsUpdate) {
      batch.update(doc.ref, update);
    }
  });
  await batch.commit();
  console.log('All videos updated!');
}

fixVideos();