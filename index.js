const admin = require('firebase-admin');
const axios = require('axios');
const http = require('http');

// שרת HTTP מינימלי - קריטי כדי ש-Render לא יכבה את הבוט
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Server is Active\n');
}).listen(process.env.PORT || 10000);

// הגדרת Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

// פונקציה לשליחת התראה - המבנה הזה קופץ גם כשהאפליקציה סגורה
async function sendPush(title, body) {
    try {
        const message = {
            notification: {
                title: title,
                body: body
            },
            data: {
                click_action: "FLUTTER_NOTIFICATION_CLICK",
                type: "alert"
            },
            topic: 'all_alerts'
        };

        await admin.messaging().send(message);
        console.log(`✅ התראה נשלחה: ${title}`);
    } catch (error) {
        console.error('❌ שגיאה בשליחה:', error.message);
    }
}

// בדיקת אזעקות מול פיקוד העורף
async function checkAlerts() {
    try {
        const response = await axios.get('https://www.oref.org.il/WarningMessages/alert/alerts.json?v=' + Date.now(), {
            headers: { 
                'Referer': 'https://www.oref.org.il/',
                'User-Agent': 'Mozilla/5.0'
            },
            timeout: 5000
        });

        if (response.data && response.data.data) {
            const cities = response.data.data;
            console.log('🚨 אזעקה!', cities.join(', '));
            await sendPush('🚨 אזעקה בזמן אמת!', `אזורים: ${cities.join(', ')}`);
        }
    } catch (e) {
        // שגיאות רשת הן נורמליות בגלל הבדיקות התכופות
    }
}

// הודעת בדיקה: שולח התראה לטלפון מיד כשהשרת ב-Render עולה
sendPush('🚀 השרת הופעל בהצלחה!', 'המערכת בודקת אזעקות כל 5 שניות');

// הרצה קבועה
setInterval(checkAlerts, 5000);
console.log("🔥 Monitoring started...");
