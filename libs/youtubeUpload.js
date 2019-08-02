const {google} = require('googleapis');
const sampleClient = require('../static/credentials.json');
const fs = require('fs');

// initialize the Youtube API library
const youtube = google.youtube({
  version: 'v3',
  auth: sampleClient.oAuth2Client
});

// very basic example of uploading a video to youtube
async function runSample (fileName, callback) {
  const fileSize = fs.statSync(fileName).size;
  const res = await youtube.videos.insert({
    part: 'id,snippet,status',
    notifySubscribers: false,
    requestBody: {
      snippet: {
        title: 'Node.js YouTube Upload Test',
        description: 'Testing YouTube upload via Google APIs Node.js Client'
      },
      status: {
        privacyStatus: 'private'
      }
    },
    media: {
      body: fs.createReadStream(fileName)
    }
  }, {
    // Use the `onUploadProgress` event from Axios to track the
    // number of bytes uploaded to this point.
    onUploadProgress: evt => {
      const progress = (evt.bytesRead / fileSize) * 100;
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`${Math.round(progress)}% complete`);
    }
  });
  console.log('\n\n');
  console.log(res.data);
  return res.data;
}

const scopes = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube'
];

if (module === require.main) {
  const fileName = process.argv[2];
  sampleClient.authenticate(scopes)
    .then(c => runSample(fileName))
    .catch(console.error);
}

module.exports = {
  runSample,
  client: sampleClient.oAuth2Client
};