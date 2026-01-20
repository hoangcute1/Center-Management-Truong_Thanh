const mongoose = require('mongoose');
const uri = "mongodb+srv://giaoductruongthanh:admin123@truongthanhedu.ufhdc3a.mongodb.net/truongthanhedu?retryWrites=true&w=majority&appName=truongthanhedu";

async function run() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const Payment = db.collection('payments');
    
    // 1. Check payments missing subjectName
    const missingSubject = await Payment.countDocuments({ 
        status: 'success', 
        $or: [{ subjectName: { $exists: false } }, { subjectName: null }, { subjectName: "" }] 
    });
    
    // 2. Check payments HAVE subjectName
    const haveSubject = await Payment.countDocuments({ 
        status: 'success', 
        subjectName: { $exists: true, $ne: null, $ne: "" } 
    });

    console.log(`--- SUBJECT AUDIT ---`);
    console.log(`Total Success Payments with Subject: ${haveSubject}`);
    console.log(`Total Success Payments MISSING Subject: ${missingSubject}`);

    if (missingSubject > 0) {
        console.log("-> FOUND MISSING DATA. Need improved backfill.");
        // Inspect one
        const sample = await Payment.findOne({ 
            status: 'success', 
            $or: [{ subjectName: { $exists: false } }, { subjectName: null }] 
        });
        console.log("Sample missing:", sample._id, "RequestIds:", sample.requestIds);
    } else {
        console.log("-> ALL GOOD? Maybe FE issue?");
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
