const mongoose = require('mongoose');

// URI from .env
const uri = "mongodb+srv://giaoductruongthanh:admin123@truongthanhedu.ufhdc3a.mongodb.net/truongthanhedu?retryWrites=true&w=majority&appName=truongthanhedu";

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected!");

    const db = mongoose.connection.db;
    const Payment = db.collection('payments');
    const User = db.collection('users');
    const Branch = db.collection('branches');
    const Request = db.collection('studentpaymentrequests');

    // 1. Find payments missing metadata
    // Check missing branchId OR missing subjectName
    const query = {
      $or: [
        { branchId: { $exists: false } },
        { branchId: null },
        { subjectName: { $exists: false } },
        { subjectName: null }
      ]
    };

    const paymentsToFix = await Payment.find(query).toArray();
    console.log(`Found ${paymentsToFix.length} payments to backfill metadata.`);

    let updatedCount = 0;
    
    for (const p of paymentsToFix) {
      const updates = {};
      let needsUpdate = false;

      // --- 1. Fix Branch ---
      if (!p.branchId) {
          if (p.studentId) {
            const student = await User.findOne({ _id: p.studentId });
            if (student && student.branchId) {
                const branch = await Branch.findOne({ _id: student.branchId });
                updates.branchId = student.branchId;
                updates.branchName = branch ? branch.name : 'Unknown';
                needsUpdate = true;
            }
          }
      }

      // --- 2. Fix Subject ---
      if (!p.subjectName) {
          if (p.requestIds && p.requestIds.length > 0) {
              const pRequests = await Request.find({ _id: { $in: p.requestIds } }).toArray();
              const subjects = pRequests
                  .map(r => r.classSubject)
                  .filter(s => s); // filter null/empty
              
              if (subjects.length > 0) {
                  updates.subjectName = [...new Set(subjects)].join(', ');
                  needsUpdate = true;
              }
          }
      }

      // --- Execute Update ---
      if (needsUpdate) {
          await Payment.updateOne(
              { _id: p._id },
              { $set: updates }
          );
          console.log(`Updated Payment ${p._id}:`, updates);
          updatedCount++;
      } else {
          console.log(`Skipped Payment ${p._id} (Data not resolvable)`);
      }
    }

    console.log(`Backfill Complete. Updated ${updatedCount}/${paymentsToFix.length} payments.`);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

run();
