const axios = require('axios');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function sendCaptchaWebhook(webhookUrl, captchaLink, user, client) {
    if (!webhookUrl || webhookUrl === "xxx") {
        client.logger.warn("Webhook", "CAPTCHA", "Webhook URL is not configured in config.json. Skipping notification.");
        return;
    }

    client.logger.info("Webhook", "CAPTCHA", `Captcha detected! Starting to spam webhook for user: ${user.tag}`);

    const embed = {
        title: "🚨 CAPTCHA TESPİT EDİLDİ! 🚨",
        description: `Lütfen aşağıdaki linke tıklayarak captcha'yı çözün:\n\n**[your link](${captchaLink})**`,
        color: 16711680, // Kırmızı Renk
        footer: {
            text: `Kullanıcı: ${user.tag} | ${new Date().toLocaleString()}`
        },
        thumbnail: {
            url: user.displayAvatarURL()
        }
    };

    // Webhook'u spamlamak için döngü (1 saniye aralıklarla 10 kez gönderir)
    for (let i = 0; i < 10; i++) {
        try {
            await axios.post(webhookUrl, { embeds: [embed] });
            client.logger.info("Webhook", "CAPTCHA", `Webhook notification sent (${i + 1}/10)`);
        } catch (error) {
            client.logger.alert("Webhook", "CAPTCHA", `Failed to send webhook notification: ${error.message}`);
            // Hata alırsan spam'ı durdur (örn: yanlış URL)
            break;
        }
        await delay(1000); // Mesajlar arası 1 saniye bekleme
    }
}

module.exports = sendCaptchaWebhook;
