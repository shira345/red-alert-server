const admin = require('firebase-admin');
const axios = require('axios');

// טעינת המפתח הסודי שהגדרת ב-Settings
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

async function sendTestNotification() {
    try {
        const testMessage = {
            notification: {
                title: "בדיקת מערכת 🛠️",
                body: "השרת שלך מחובר ועובד! כל דקה תתבצע בדיקה."
            },
            topic: 'all_alerts'
        };
        await admin.messaging().send(testMessage);
        console.log('✅ הודעת בדיקה נשלחה בהצלחה ל-Firebase');
    } catch (error) {
        console.error('❌ שגיאה בשליחת הודעת הבדיקה:', error);
    }
}

async function checkAlerts() {
    try {
        console.log('בודק אזעקות...');
        const response = await axios.get('https://www.oref.org.il/WarningMessages/alert/alerts.json', {
            headers: { 
                'X-Requested-With': 'XMLHttpRequest', 
                'Referer': 'https://www.oref.org.il/',
                'User-Agent': 'Mozilla/5.0'
            }
        });

        if (response.data && response.data.data) {
            const cities = response.data.data;
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
                console.log('התראה נשלחה עבור: ' + city);
            }
        } else {
            console.log('אין אזעקות כרגע.');
        }
    } catch (e) { 
        console.log('שגיאה בחיבור לפיקוד העורף (ייתכן שאין אזעקות):', e.message); 
    }
}

// הרצה של הבדיקות
async function main() {
    await sendTestNotification(); // שליחת הודעת בדיקה מיד עם ההפעלה
    await checkAlerts();          // בדיקת אזעקות אמת
}

main();
