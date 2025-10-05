/* eslint-disable no-useless-escape */
/*
 * OwO Farm Bot Stable
 * Copyright (C) 2024 Mido
 * This software is licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 * For more information, see README.md and LICENSE
 */

/**
 * Checks if a message contains suspicious content that might indicate a web captcha message.
 *
 * @param {string} msgcontent - The content of the message to check.
 * @param {boolean} helloChristopher - A flag indicating if a specific condition is met.
 * @param {boolean} canulickmymonster - Another flag indicating if a different specific condition is met.
 * @returns {boolean} - Returns true if the message contains suspicious content or if either of the flags are true.
 */

// DEĞİŞİKLİK: Butonlu webhook gönderebilmek için axios kütüphanesini ekliyoruz.
const axios = require('axios');

function isWebCaptchaMessage(msgcontent, helloChristopher, canulickmymonster) {
    const suspiciousPhrases = [".com", "please use the link"];

    const hasSuspiciousContent = suspiciousPhrases.some((phrase) =>
        msgcontent.includes(phrase),
    );

    return hasSuspiciousContent || helloChristopher || canulickmymonster;
}

module.exports = async (client, message) => {
    const CHANNEL_IDS = [
        client.basic.commandschannelid,
        client.basic.huntbotchannelid,
        client.basic.gamblechannelid,
        client.basic.autoquestchannelid,
        client.basic.owodmchannelid,
    ];

    if (message.author.id === "408785106942164992") {
        let rawmsgcontent = message.content.toLowerCase();
        let channeltype = message.channel.type;
        let msgcontent = client.globalutil.removeInvisibleChars(rawmsgcontent);
        let helloChristopher, canulickmymonster;

        if (
            CHANNEL_IDS.includes(message.channel.id) &&
            message.content.toLowerCase().includes(`<@${client.user.id}>`) &&
            (msgcontent.includes("please complete your captcha") ||
                msgcontent.includes("verify that you are human") ||
                msgcontent.includes("are you a real human") ||
                msgcontent.includes("it may result in a ban") ||
                msgcontent.includes(
                    "please complete this within 10 minutes",
                ) ||
                msgcontent.includes(
                    "please use the link below so i can check",
                ) ||
                msgcontent.includes("captcha")) &&
            !client.global.captchadetected
        ) {
            client.global.paused = true;
            client.global.captchadetected = true;
            client.global.total.captcha++;
            client.broadcast({
                action: "update",
                type: "captcha",
                progress: client.global.total.captcha,
                global: client.global,
            });
            client.broadcast({
                action: "update",
                type: "botstatus",
                status: "Paused",
                global: client.global,
            });
            client.logger.alert("Bot", "Captcha", `Captcha Detected!`);
            client.logger.info(
                "Bot",
                "Captcha",
                `Total Captcha: ${client.global.total.captcha}`,
            );
            client.logger.warn(
                "Bot",
                "Captcha",
                `Bot Paused: ${client.global.paused}`,
            );

            if (
                message.components.length > 0 &&
                message.components[0].components[0]
            ) {
                helloChristopher = message.components[0].components.find(
                    (button) => button.url.toLowerCase() === "owobot.com",
                );
                canulickmymonster = message.components[0].components[0].url
                    .toLowerCase()
                    .includes("owobot.com");
            }

            /**
             * Desktop Notifications
             */
            if (
                (!client.config.settings.captcha.autosolve ||
                    client.config.settings.captcha.alerttype.desktop.force) &&
                !client.global.istermux &&
                client.config.settings.captcha.alerttype.desktop.notification
            ) {
                client.childprocess.spawn("node", ["./utils/function/warn.js"]);
            }
            if (
                (!client.config.settings.captcha.autosolve ||
                    client.config.settings.captcha.alerttype.desktop.force) &&
                !client.global.istermux &&
                client.config.settings.captcha.alerttype.desktop.prompt
            ) {
                var promptmessage = `Captcha detected! Solve the captcha and type ${client.config.prefix}resume in farm channel`;

                const psCommands = [
                    "Add-Type -AssemblyName PresentationFramework",
                    "[System.Windows.MessageBox]::" +
                        `Show(\'${promptmessage}\', \'OwO Farm Bot Stable\', \'OK\', \'Warning\')`,
                ];
                const psScript = psCommands.join("; ");
                client.childprocess.exec(
                    `powershell.exe -ExecutionPolicy Bypass -Command "${psScript}"`,
                );
            }

            // ######################################################################
            // ## DEĞİŞİKLİK BURADA BAŞLIYOR ##
            // ######################################################################
            if (
                client.config.settings.captcha.alerttype.webhook &&
                client.config.settings.captcha.alerttype.webhookurl.length > 10
            ) {
                // Captcha'nın geldiği mesajın direkt linkini oluşturuyoruz.
                const messageLink = `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`;

                const webhookUrl = client.config.settings.captcha.alerttype.webhookurl;

                // Gönderilecek olan embed ve butonu hazırlıyoruz.
                const payload = {
                    content: `||@everyone||`, // Everyone etiketini content içine alıyoruz
                    embeds: [{
                        title: "🚨 Captcha Tespit Edildi! 🚨",
                        description: `**${client.user.username}** adlı kullanıcı için bir captcha çıktı. Lütfen aşağıdaki butona tıklayarak mesaja gidin ve captcha'yı çözün.`,
                        color: 16711680, // Kırmızı
                        footer: {
                            text: `OwO Farm Bot Stable | ${new Date().toLocaleString()}`
                        }
                    }],
                    components: [{
                        type: 1, // Action Row
                        components: [{
                            type: 2, // Button
                            style: 5, // Link butonu
                            label: "Mesaja Git", // Butonun üzerindeki yazı
                            url: messageLink // Butonun yönlendireceği link
                        }]
                    }]
                };

                // Webhook'u spamlamak için döngü (1 saniye aralıklarla 5 kez gönderir)
                for (let i = 0; i < 5; i++) {
                    try {
                        await axios.post(webhookUrl, payload);
                        client.logger.info("Webhook", "CAPTCHA", `Webhook notification sent (${i + 1}/5)`);
                    } catch (error) {
                        client.logger.alert("Webhook", "CAPTCHA", `Failed to send webhook notification: ${error.message}`);
                        break; // Hata olursa döngüyü kır
                    }
                    await client.delay(1000); // 1 saniye bekle
                }
            }
            // ######################################################################
            // ## DEĞİŞİKLİK BURADA BİTİYOR ##
            // ######################################################################


            /**
             * Termux Notifications
             */
            if (client.global.istermux) {
                if (
                    client.config.settings.captcha.alerttype.termux.notification
                ) {
                    const termuxnotificationCommand = `termux-notification --title "OwO Farm Bot Stable" --content "${client.user.username} - Captcha Detected" --priority high --button1 "Open Captcha Page" --button1-action "termux-open-url https://owobot.com/captcha"`;

                    client.childprocess.exec(termuxnotificationCommand);
                }

                if (client.config.settings.captcha.alerttype.termux.vibration) {
                    let vibrationtime =
                        client.config.settings.captcha.alerttype.termux
                            .vibration;
                    if (isNaN(vibrationtime) || vibrationtime < 1000) {
                        vibrationtime = 1000;
                    }
                    const termuxvibrationCommand = `termux-vibrate -f -d ${vibrationtime}`;

                    client.childprocess.exec(termuxvibrationCommand);
                }
                if (client.config.settings.captcha.alerttype.termux.toast) {
                    const termuxtoastCommand = `termux-toast -c black -b red 'OwO Farm Bot Stable - Captcha Detected!'`;

                    client.childprocess.exec(termuxtoastCommand);
                }
            }

            if (
                client.config.settings.captcha.autosolve &&
                isWebCaptchaMessage(
                    msgcontent,
                    helloChristopher,
                    canulickmymonster,
                )
            ) {
                let spawnthread =
                    client.config.settings.captcha.autosolve_thread;
                if (isNaN(spawnthread) || spawnthread < 1) {
                    spawnthread = 1;
                }
                switch (process.platform || client.global.istermux) {
                    case "android":
                        client.logger.warn(
                            "Bot",
                            "Captcha",
                            "Unsupported platform!",
                        );
                        return;
                    default:
                        client.logger.info(
                            "Bot",
                            "Captcha",
                            `Opening automated Chromium browser... Thread Count: ${spawnthread}`,
                        );

                        for (
                            let spawncount = 0;
                            spawncount < spawnthread;
                            spawncount++
                        ) {
                            client.childprocess.spawn("node", [
                                "./utils/captcha.js",
                                `--token=${client.basic.token}`,
                                `--userid=${client.user.id}`,
                            ]);
                            await client.delay(3000);
                        }
                        break;
                }
            }
        }
        if (msgcontent.includes("i have verified") && channeltype === "DM") {
            client.broadcast({
                action: "closechrome",
                type: "captcha",
                status: "solved",
                userid: client.user.id,
            });

            client.global.captchadetected = false;
            client.global.total.solvedcaptcha++;
            client.broadcast({
                action: "update",
                type: "solvedcaptcha",
                progress: client.global.total.solvedcaptcha,
                global: client.global,
            });
            if (client.config.settings.autoresume) {
                client.global.paused = false;
                client.logger.warn(
                    "Bot",
                    "Captcha",
                    `Captcha solved. Resuming bot automatically...`,
                );
                client.broadcast({
                    action: "update",
                    type: "botstatus",
                    status: "Running",
                    global: client.global,
                });
            } else {
                client.logger.warn(
                    "Bot",
                    "Captcha",
                    `Captcha Solved, please resume by using the command \"${client.config.prefix}resume\" to resume`,
                );
            }
        }
    }

    /**
     * CMD
     */
    let PREFIX = client.config.prefix;

    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const prefixRegex = new RegExp(
        `^(<@!?${client.user.id}>|${escapeRegex(PREFIX)})\\s*`,
    );
    if (!prefixRegex.test(message.content)) return;
    const [matchedPrefix] = message.content.match(prefixRegex);
    const args = message.content
        .slice(matchedPrefix.length)
        .trim()
        .split(/ +/g);
    const command = args.shift().toLowerCase();

    const cmd =
        client.commands.get(command) ||
        client.commands.get(client.aliases.get(command));

    if (cmd) {
        if (message.author.id !== client.basic.userid) return;
        cmd.run(client, message, args);
    }
};
                    
