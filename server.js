// server.js
require('dotenv').config();          // .env içindeki değişkenleri yükle
const express = require('express'); // web server
const app = express();
const fs = require('fs');           // dosya işlemleri

// --------------------------------------------------
// Twilio client (kimlik doğrulama)
const twilioClient = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// TwiML oluşturmak için gerekli sınıf
const MessagingResponse = require('twilio').twiml.MessagingResponse;

// --------------------------------------------------
// JSON dosyası yolu
const APPOINTMENTS_PATH = 'appointments.json';

// --------------------------------------------------
// Yardımcı fonksiyonlar
function getAppointments() {
  try {
    const data = fs.readFileSync(APPOINTMENTS_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return []; // dosya yoksa boş liste döndür
  }
}

function addAppointment(appointment) {
  const appointments = getAppointments();
  appointments.push(appointment);
  fs.writeFileSync(APPOINTMENTS_PATH, JSON.stringify(appointments, null, 2));
}

// --------------------------------------------------
// Middleware – Twilio’dan gelen form‑data’yı parse eder
app.use(express.urlencoded({ extended: true }));

// --------------------------------------------------
// Webhook endpoint
app.post('/webhook', (req, res) => {
  const twiml = new MessagingResponse();
  const incoming = req.body.Body.trim().toLowerCase();

  if (incoming === 'randevu al') {
    twiml.message(
      'Merhaba! Lütfen adınızı, randevu tarihini ve saatini şu şekilde yazın: Adınız, YYYY-MM-DD, HH:MM'
    );
  } else if (incoming.includes(',')) {
    const parts = incoming.split(',');
    if (parts.length === 3) {
      const [name, date, time] = parts.map(p => p.trim());
      addAppointment({
        name,
        date,
        time,
        phone: req.body.From,
        createdAt: new Date().toISOString()
      });
      twiml.message(`Teşekkürler ${name}, ${date} ${time} için randevunuz kaydedildi.`);
    } else {
      twiml.message('Format hatalı. Lütfen "Adınız, YYYY-MM-DD, HH:MM" şeklinde gönderin.');
    }
  } else {
    twiml.message('Bilinmeyen komut. "Randevu al" yazarak başlayabilirsiniz.');
  }

  res.type('text/xml').send(twiml.toString());
});

// --------------------------------------------------
// Server başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ${PORT} portunda çalışıyor`));