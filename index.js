const admin = require('firebase-admin');
const axios = require('axios');

// טעינת המפתח הסודי מהגדרות השרת
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

async function checkAlerts() {
    try {
        // הוספת v=Date.now כדי לוודא שאנחנו מקבלים נתונים טריים ולא זיכרון ישן
        const response = await axios.get('https://www.oref.org.il/WarningMessages/alert/alerts.json?v=' + Date.now(), {
            headers: { 
                'X-Requested-With': 'XMLHttpRequest', 
                'Referer': 'https://www.oref.org.il/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 4000 // אם השרת לא עונה תוך 4 שניות, ננסה שוב בסבב הבא
        });

        if (response.data && response.data.data) {
            const cities = response.data.data;
            console.log('🚨 אזעקה פעילה ב:', cities.join(', '));
            
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
            console.log('✅ התראות נשלחו בהצלחה');
        }
    } catch (e) {
        // בבדיקה תכופה, שגיאות "אין נתונים" הן נורמליות לגמרי
    }
}

// פונקציית הלולאה האינסופית
async function main() {
    console.log("🚀 השרת התחיל בדיקה רציפה כל 5 שניות...");
    
    while (true) {
        await checkAlerts();
        // המתנה של 5000 מילישניות (5 שניות)
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

main();
