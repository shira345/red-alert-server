const admin = require('firebase-admin');
const axios = require('axios');
const http = require('http');

// 1. שרת HTTP מינימלי למניעת כיבוי ב-Render
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Server is Live\n');
}).listen(process.env.PORT || 10000);

// 2. הגדרת Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

// פונקציה עזר לשליחת התראה שתעבוד גם כשהאפליקציה סגורה
async function sendPush(title, body, isSilent = false) {
    try {
        const message = {
            // האובייקט הזה אחראי שההתראה תקפוץ גם כשהאפליקציה סגורה
            notification: {
                title: title,
                body: body
            },
            // מידע נוסף שהאפליקציה יכולה להשתמש בו
            data: {
                click_action: "FLUTTER_NOTIFICATION_CLICK",
                status: "done"
            },
            topic: 'all_alerts'
        };

        await admin.messaging().send(message);
        if (!isSilent) console.log(`✅ נשלחה התראה: ${title}`);
    } catch (error) {
        console.error('❌ שגיאה בשליחה:', error.message);
    }
}

// 3. פונקציית הבדיקה המרכזית
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
        // התעלמות משגיאות רשת זמניות
    }
}

// 4. הרצה ראשונית - התראה שהשרת עלה (כדי שתוכלי לבדוק)
sendPush('🚀 השרת הופעל!', 'המערכת בודקת אזעקות כל 5 שניות');

// 5. לולאת ריצה קבועה
setInterval(checkAlerts, 5000);
console.log("🔥 Monitoring started...");
