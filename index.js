const admin = require('firebase-admin');
const axios = require('axios');

// טעינת המפתח הסודי שהגדרת ב-Settings
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
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
        }
    } catch (e) { 
        console.log('אין אזעקות כרגע או שגיאה בחיבור'); 
    }
}

checkAlerts();
