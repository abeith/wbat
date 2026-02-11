import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';

// import { WaveFile } from 'wavefile';

// import LoopbackRecording from 'wbat';

import { saveLoopbackData, loopbackTableData } from './db.js';
// import { runExperiment } from './jspsych.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// ✅ Serve the client-side UI
app.use(express.static(path.join(__dirname, '../public')));

// const setupStaticRoutes = async () => {
//   const jspsychPath = await import.meta.resolve('jspsych');
//   const nomalisedJspsychPath = path.dirname(new URL(jspsychPath).pathname);
//   console.log(nomalisedJspsychPath);
//   app.use('/js/jspsych', express.static(nomalisedJspsychPath));

//   const htmlButtonResponse = await import.meta.resolve(
//     '@jspsych/plugin-html-button-response',
//   );
//   console.log(htmlButtonResponse);
//   app.use('/js/htmlButtonResponse.js', express.static(htmlButtonResponse));

//   const jspsychCSS = await import.meta.resolve('jspsych/css/jspsych.css');
//   console.log(jspsychCSS);
//   app.use('/js/jspsych.css', express.static(jspsychCSS));
// };

// setupStaticRoutes();

app.use(
  '/js/jspsych/css/jspsych.css',
  express.static(
    path.join(__dirname, '../../../node_modules/jspsych/css/jspsych.css'),
  ),
);

app.use(
  '/js/plugin-html-button-response',
  express.static(
    path.join(
      __dirname,
      '../../../node_modules/@jspsych/plugin-html-button-response/dist',
    ),
  ),
);

app.use(
  '/jspsych',
  express.static(path.join(__dirname, '../public/jspsych.html')),
);

// ✅ Serve worklets and main package for client-side use
app.use(
  '/worklets/recorder-worklet.js',
  express.static(
    path.join(
      __dirname,
      '../../../node_modules/@wbat/recorder-worklet/dist/recorder-worklet.js',
    ),
  ),
);
app.use(
  '/auditoryToolbox',
  express.static(path.join(__dirname, '../../../node_modules/wbat/dist')),
);
app.use('/sounds', express.static(path.join(__dirname, '../../../sounds')));

app.get('/examples/record-session', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/record-session.html'));
});

const upload = multer({ dest: './data/' });

app.post(
  '/save/loopback',
  upload.single('loopbackRecording'),
  async (req, res) => {
    try {
      if (!req.file) throw new Error('req.file is undefined');

      if (!req.body.id) throw new Error('File ID must be provided');

      // Need to add check for avoiding overwrites

      const loopbackData: loopbackTableData = {
        id: req.body.id,
        user_agent: req.body.userAgent,
        signal: req.body.signal,
      };

      const loopbackDataProcessed: loopbackTableData =
        await saveLoopbackData(loopbackData);

      fs.renameSync(req.file.path, `./data/${loopbackDataProcessed.file_path}`);

      res.status(200).json({
        success: true,
        file: req.file,
        loopbackDataProcessed,
      });
    } catch (err) {
      if (err instanceof Error) {
        res.status(500).json({ error: err.message });
      }
    }
  },
);

// Start server
app.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}`);
});
