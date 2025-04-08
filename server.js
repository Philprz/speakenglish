const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

// Rediriger toutes les routes vers index.html sauf les fichiers existants
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`SpeakEnglish app running on http://localhost:${port}`);
});
