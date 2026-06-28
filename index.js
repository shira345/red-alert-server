const admin = require('firebase-admin');
const axios = require('axios');

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const sentAlerts = new Set(); // מניעת כפילויות

async function sendAlertForCity(city) {
    // מפתח ייחודי לפי עיר + דקה (מונע שליחה כפולה באותה דקה)
    const key = `${city}_${Math.floor(Date.now() / 60000)}`;
    if (sentAlerts.has(key)) return;
    sentAlerts.add(key);

    const message = {
    data: {                    // ✅ data בלבד
        city: city,
        title: '🚨 צבע אדום!',
        body: `אזעקה ב${city}. היכנסו למרחב המוגן!`
    },
    android: { priority: 'high' },
    topic: 'all_alerts'
    // ❌ אין כאן שום שדה notification!
};
await admin.messaging().send(message);
    console.log(`✅ נשלח עבור: ${city}`);
}

async function checkAlerts() {
    console.log(`🔍 בדיקה: ${new Date().toLocaleTimeString('he-IL')}`);
    try {
        const res = await axios.get(
            'https://www.oref.org.il/WarningMessages/alert/alerts.json?v=' + Date.now(),
            {
                headers: { 'Referer': 'https://www.oref.org.il/', 'User-Agent': 'Mozilla/5.0' },
                timeout: 5000
            }
        );
        if (res.data?.data?.length > 0) {
            console.log('🚨 אזעקה!', res.data.data.join(', '));
            // ✅ שולח הודעה נפרדת לכל עיר עם שדה city
            for (const city of res.data.data) {
                await sendAlertForCity(city);
            }
        }
    } catch (e) {
        console.error('שגיאה:', e.message);
    }
}

// ✅ רץ כל 5 שניות, נעצר אחרי 55 שניות (לפני שה-Action נהרג)
checkAlerts();
const interval = setInterval(checkAlerts, 5000);
setTimeout(() => {
    clearInterval(interval);
    console.log('✅ סיום ריצה');
    process.exit(0);
}, 55000);
