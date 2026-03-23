// THIS IS FOR TESTING


import 'dotenv/config';
import { sendEmail } from './email.service';

const main = async () => {
  await sendEmail(
    'aidanmclean7030@yahoo.com',
    'Your model is ready',
    '<p>Your model <strong>TestModel1</strong> has been processed.</p>'
  );
  console.log('Email sent!');
};

main();