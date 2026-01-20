const mongoose = require('mongoose');
const uri = "mongodb+srv://giaoductruongthanh:admin123@truongthanhedu.ufhdc3a.mongodb.net/truongthanhedu?retryWrites=true&w=majority&appName=truongthanhedu";

async function run() {
  try {
    console.log("Connecting...");
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const Payment = db.collection('payments');
    const Request = db.collection('studentpaymentrequests');
    const Class = db.collection('classes');

    // Find all success payments missing subjectName
    const payments = await Payment.find({
        status: 'success',
        $or: [{ subjectName: { $exists: false } }, { subjectName: null }, { subjectName: "" }]
    }).toArray();

    console.log(`Found ${payments.length} payments missing subjectName.`);

    for (const p of payments) {
        if (!p.requestIds || p.requestIds.length === 0) {
            console.log(`Payment ${p._id} has no info to trace.`);
            continue;
        }

        // 1. Get Requests
        const requests = await Request.find({ _id: { $in: p.requestIds } }).toArray();
        let subjects = [];

        for (const req of requests) {
            // Try snapshot first
            if (req.classSubject) {
                subjects.push(req.classSubject);
            } else if (req.classId) {
                // Fallback to Class lookup
                const cls = await Class.findOne({ _id: req.classId });
                if (cls && cls.subject) {
                    subjects.push(cls.subject);
                } else {
                    console.log(`Class ${req.classId} has no subject info.`);
                }
            }
        }

        // Unique subjects
        const uniqueSubjects = [...new Set(subjects.filter(s => s))].join(', ');
        
        if (uniqueSubjects) {
            await Payment.updateOne(
                { _id: p._id },
                { $set: { subjectName: uniqueSubjects } }
            );
            console.log(`Fixed Payment ${p._id} -> Subject: ${uniqueSubjects}`);
        } else {
            console.log(`Could not resolve subject for Payment ${p._id} (Requests found: ${requests.length})`);
        }
    }
    console.log("Deep Backfill Finished.");

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
