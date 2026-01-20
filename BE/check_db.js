const mongoose = require('mongoose');

// URI from .env
const uri = "mongodb+srv://giaoductruongthanh:admin123@truongthanhedu.ufhdc3a.mongodb.net/truongthanhedu?retryWrites=true&w=majority&appName=truongthanhedu";

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected!");

    const db = mongoose.connection.db;
    const payments = db.collection('payments');
    const users = db.collection('users');
    const classes = db.collection('classes');
    const requests = db.collection('studentpaymentrequests');

    // 1. Audit Payment Data
    const totalPayments = await payments.countDocuments({ status: 'success' });
    const paymentsWithBranch = await payments.countDocuments({ status: 'success', branchId: { $exists: true, $ne: null } });
    const paymentsWithBranchName = await payments.countDocuments({ status: 'success', branchName: { $exists: true, $ne: null } });

    console.log('--- Payment Data Audit ---');
    console.log(`Total SUCCESS payments: ${totalPayments}`);
    console.log(`Payments with branchId: ${paymentsWithBranch}`);
    console.log(`Payments with branchName: ${paymentsWithBranchName}`);

    if (totalPayments > 0 && paymentsWithBranch === 0) {
      console.log("ROOT CAUSE CONFIRMED: Payments are missing branchId snapshot!");
    }

    // 2. Audit Class/Subject Data
    const totalClasses = await classes.countDocuments({});
    const classesWithSubject = await classes.countDocuments({ subject: { $ne: null } });
    
    console.log('\n--- Class Data Audit ---');
    console.log(`Total Classes: ${totalClasses}`);
    console.log(`Classes with subject: ${classesWithSubject}`);

    // 3. Sample Data Inspection
    console.log('\n--- Sample Inspection ---');
    const samplePayment = await payments.findOne({ status: 'success' });
    if (samplePayment) {
      console.log('Sample Payment:', JSON.stringify(samplePayment, null, 2));

      // Check linkage
      if (samplePayment.studentId) {
        const student = await users.findOne({ _id: samplePayment.studentId });
        console.log(`Linked Student (${samplePayment.studentId}):`, student ? `Found (BranchId: ${student.branchId})` : 'Not Found');
      }

      if (samplePayment.requestIds && samplePayment.requestIds.length > 0) {
        const requestId = samplePayment.requestIds[0];
        const req = await requests.findOne({ _id: requestId });
        console.log(`Linked Request (${requestId}):`, req ? `Found (ClassId: ${req.classId})` : 'Not Found');
        
        if (req && req.classId) {
          const cls = await classes.findOne({ _id: req.classId });
          console.log(`Linked Class (${req.classId}):`, cls ? `Found (Subject: ${cls.subject})` : 'Not Found');
        }
      }
    } else {
      console.log("No success payments found to inspect.");
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

run();
