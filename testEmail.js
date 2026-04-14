require('dotenv').config();
const { sendEnrollmentEmail } = require('./utils/enrollmentEmailService');

async function test() {
  const result = await sendEnrollmentEmail({
    studentEmail: 'doralemayuri766@gmail.com', // ✅ put YOUR real email here
    studentName: 'Ravi Kumar',
    batchName: 'Morning Batch A',
    studioName: 'Step Up Studio',
    styleName: 'Salsa',
    levelName: 'Beginner',
    fromDate: '2026-05-01',
    toDate: '2026-07-31',
    amountPaid: 3500,
    paymentId: 'pay_testABC123',
    paymentMethod: 'Razorpay',
  });

  console.log('Result:', result ? '✅ Email sent!' : '❌ Email failed');
}

test();