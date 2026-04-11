const admin = require('firebase-admin');
const axios = require('axios');
const http = require('http');

// שרת HTTP למניעת שינה
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Active');
}).listen(process.env.PORT || 10000);

// חיבור ל-Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

// פונקציית שליחה משופרת
async function sendPush(title, body) {
    try {
        const message = {
            notification: { title, body },
            android: {
                priority: 'high',
                notification: { sound: 'default', clickAction: 'FLUTTER_NOTIFICATION_CLICK' }
            },
            topic: 'all_alerts'
        };
        await admin.messaging().send(message);
        console.log(`✅ הודעה נשלחה בהצלחה: ${title}`);
    } catch (error) {
        console.error('❌ שגיאת שליחה:', error.message);
    }
}

// בדיקת אזעקות
async function checkAlerts() {
    // השורה הזו תראה לך בלוגים שהשרת חי!
    console.log(`🔍 בדיקה בתאריך: ${new Date().toLocaleTimeString()}`);
    
    try {
        const response = await axios.get('https://www.oref.org.il/WarningMessages/alert/alerts.json?v=' + Date.now(), {
            headers: { 'Referer': 'https://www.oref.org.il/', 'User-Agent': 'Mozilla/5.0' },
            timeout: 5000
        });

        if (response.data && response.data.data) {
            const cities = response.data.data;
            console.log('🚨 אזעקה זוהתה!', cities.join(', '));
            await sendPush('🚨 אזעקה בזמן אמת!', `אזורים: ${cities.join(', ')}`);
        }
    } catch (e) {
        // שגיאות רשת הן נורמליות בגלל העומס
    }
}

// הודעת הפעלה כדי שתדעי שזה עלה
sendPush('🚀 השרת הופעל מחדש', 'בודק אזעקות כל 5 שניות בדיוק');

// הרצה כל 5 שניות
setInterval(checkAlerts, 5000);
console.log("🔥 Monitoring started and logging active...");
