const admin = require('firebase-admin');
const axios = require('axios');
const http = require('http');

// יצירת שרת דמי כדי ש-Render לא יבצע כיבוי (Timed Out)
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Alert server is running\n');
}).listen(process.env.PORT || 10000); 

// טעינת המפתח הסודי מה-Environment Variables
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

// --- פונקציית בדיקה חדשה ---
async function sendTestNotification() {
    try {
        const testMessage = {
            data: { 
                title: 'בדיקת מערכת 🛠️', 
                message: 'השרת עלה בהצלחה ומחובר ל-Firebase!' 
            },
            topic: 'all_alerts'
        };
        await admin.messaging().send(testMessage);
        console.log('✅ התראת בדיקה נשלחה בהצלחה ל-Firebase');
    } catch (error) {
        console.error('❌ שגיאה בשליחת התראת בדיקה:', error);
    }
}

async function checkAlerts() {
    try {
        const response = await axios.get('https://www.oref.org.il/WarningMessages/alert/alerts.json?v=' + Date.now(), {
            headers: { 
                'X-Requested-With': 'XMLHttpRequest', 
                'Referer': 'https://www.oref.org.il/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 4000
        });

        if (response.data && response.data.data) {
            const cities = response.data.data;
            console.log('🚨 אזעקה זוהתה ב:', cities.join(', '));
            
            for (let city of cities) {
                const message = {
                    data: { 
                        city: city, 
                        title: '🚨 אזעקה!', 
                        message: `היכנסו למרחב מוגן ב-${city}` 
                    },
                    topic: 'all_alerts'
                };
                await admin.messaging().send(message);
            }
        }
    } catch (e) {
        // שגיאות חיבור/טיים-אאוט הן נורמליות בבדיקה תכופה
    }
}

// הפעלת הבדיקה החד פעמית מיד עם העלייה
sendTestNotification();

// תחילת לולאת הבדיקה הקבועה
setInterval(checkAlerts, 5000);
console.log("🚀 השרת הושק ובודק כל 5 שניות...");
