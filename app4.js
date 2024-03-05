const qrcode = require("qrcode-terminal");
const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js");
const schedule = require("node-schedule");
const moment = require("moment-timezone");

const botActive = { value: true };
let startDate = new Date(); // Data de início do bot
const GROUP_IDS = [
    "120363164051478387@g.us", // ID do Grupo 1
    "120363185715138412@g.us", // ID do Grupo 2
    "120363209853618580@g.us", // ID do Grupo 2
];

// Funções auxiliares
function checkIfShouldPause() {
    try {
        let currentDate = new Date();
        let timeDiff = currentDate - startDate;
        let daysPassed = timeDiff / (1000 * 60 * 60 * 24); // Convertendo de milissegundos para dias

        if (daysPassed >= 30) {
            console.log("30 dias passaram, bot está agora em pausa.");
            botActive.value = false;
        } else {
            setTimeout(checkIfShouldPause, 24 * 60 * 60 * 1000); // 24 horas em milissegundos
        }
    } catch (error) {
        console.error("Erro em checkIfShouldPause:", error);
    }
}

function getRandomInt(min, max) {
    try {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    } catch (error) {
        console.error("Erro em getRandomInt:", error);
        return min; // Retorna o valor mínimo como fallback
    }
}

function sendEndOfDayMessage(chatId) {
    try {
        const endOfDayMessage = "Mensagem de final de dia"; // Coloque sua mensagem aqui
        client.sendMessage(chatId, endOfDayMessage);
    } catch (error) {
        console.error("Erro em sendEndOfDayMessage:", error);
    }
}

function sendRandomSignal(chatId, imagePath) {
    try {
        const signalImage = MessageMedia.fromFilePath(imagePath);
        const message = "Sua mensagem aqui"; // Sua mensagem

        client.sendMessage(chatId, signalImage, { caption: message });
    } catch (error) {
        console.error("Erro em sendRandomSignal:", error);
    }
}

// Função para agendar sinais
function scheduleSignals() {
    try {
        console.log("Agendando sinais com base na hora programada.");
        // Agendando os demais sinais conforme definido em signalHours
        const signalHours = [
            { hour: 9, minute: 0 },
            { hour: 11, minute: 0 },
            { hour: 13, minute: 0 },
            { hour: 15, minute: 40 },
            { hour: 17, minute: 0 },
            { hour: 19, minute: 0 },
            { hour: 22, minute: 0 },
            { hour: 23, minute: 5 },
            { hour: 3, minute: 0 },
            { hour: 6, minute: 0 },
        ];

        signalHours.forEach((timeObj) => {
            let scheduledTime = moment().tz("America/Sao_Paulo").set({
                hour: timeObj.hour,
                minute: timeObj.minute,
                second: 0,
            });

            if (scheduledTime.isBefore(moment())) {
                scheduledTime.add(1, "days");
            }

            console.log(`Agendado para ${scheduledTime.format("HH:mm")} BRT.`);

            schedule.scheduleJob(scheduledTime.toDate(), function () {
                console.log(
                    `Enviando sinal para ${scheduledTime.format("HH:mm")} BRT.`
                );
                sendSignal(GROUP_IDS, scheduledTime);
            });
        });
    } catch (error) {
        console.error("Erro em scheduleSignals:", error);
    }
}

function sendSignal(groupIds, scheduledTime) {
    try {
        if (botActive.value) {
            groupIds.forEach((chatId, index) => {
                const delay = index * 5000; // Incremento de tempo para cada grupo
                setTimeout(() => {
                    sendMinutePayingMessage(chatId, scheduledTime);
                }, delay);
            });
        } else {
            console.log("Bot está pausado e não pode enviar sinais.");
        }
    } catch (error) {
        console.error("Erro em sendSignal:", error);
    }
}


// Função para gerar a mensagem com sinais sequenciais
function sendMinutePayingMessage(chatId, startTime) {
    try {
        const message = generateMessageBasedOnStartTime(startTime);
        client
            .sendMessage(chatId, message)
            .catch((err) => console.error("Erro ao enviar mensagem:", err));
    } catch (error) {
        console.error("Erro em sendMinutePayingMessage:", error);
    }
}

function sendMegaSlotsMessage(chatId) {
    try {
        const megaSlotsMessage = `🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨\n🎯LANÇAMENTO DA REDE MEGA SLOTS 🥳🥳🤑\n\nhttps://m.vinicius777slots.com/?gfs=lj586kfa\n\n✅Depósito mínimo de 20,00\n✅Saque a partir de 50,00\nSaque diário de acordo com o VIP\n🍀Bora faturar que a 777 da show sempree\n🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀`;
        client.sendMessage(chatId, megaSlotsMessage);
    } catch (error) {
        console.error("Erro em sendMegaSlotsMessage:", error);
    }
}


function generateMessageBasedOnStartTime(startTime) {
    try {
        const nextTime = startTime.clone().add(2, "hours");
        let message = `Horários Pagantes🎰\n\nLINK DA PLATAFORMA FIXADO🚨⤴🍀\n\nJoguem com consciência!🍀💰\n▪▪▪▪▪▪▪▪▪▪▪\n⏰MINUTOS PAGANTES⏰\n🕕 ${startTime.format(
            "HH:mm"
        )} HORAS 🕕\n▪▪▪▪▪▪▪▪▪▪▪\n`;

        const games = {
            "FORTUNE MOUSE": 15,
            "FORTUNE OX": 15,
            "FORTUNE RABBIT": 15,
            "FORTUNE TIGER": 15,
            "JUNGLE DELIGHT": 15,
            "LUCKY PIG": 15,
            PINGUIM: 15,
        };

        for (let game in games) {
            message += `🔰${game}⤵\n`;
            let signalTime = startTime.clone();
            for (let i = 0; i < games[game]; i++) {
                let timeIncrement = getRandomInt(9, 15); // Intervalo aleatório entre 5 e 10 minutos
                message += `⏰${signalTime.format("HH:mm")}\n`;
                signalTime.add(timeIncrement, "minutes");
            }
            message += `▪▪▪▪▪▪▪▪▪▪▪\n`;
        }

        message +=
            "⚠ Deu 4 ou 5 giros máximo com bet mínima de forma manual e INTERCALANDO e o jogo não te pagou um valor superior aos da suas apostas? Saia da plataforma IMEDIATAMENTE!\n🍀 BOA SORTE! 🍀\n▪▪▪▪▪▪▪▪▪▪▪";

        console.log(message);
        return message;
    } catch (error) {
        console.error("Erro em generateMessageBasedOnStartTime:", error);
        return ""; // Retorna uma string vazia como fallback
    }
}

function generateRandomTime(startTime, endTime) {
    try {
        let diff = endTime.diff(startTime, "minutes");
        let randomDiff = Math.floor(Math.random() * diff);
        return startTime.clone().add(randomDiff, "minutes");
    } catch (error) {
        console.error("Erro em generateRandomTime:", error);
        return startTime.clone(); // Retorna startTime como fallback
    }
}

// Cliente WhatsApp e inicialização
const client = new Client({
    authStrategy: new LocalAuth(),
});

client.initialize();

client.on("ready", () => {
    try {
        console.log("Bot Online!");
        scheduleSignals();
        checkIfShouldPause(); // Inicia a verificação de pausa
    } catch (error) {
        console.error("Erro em cliente.on('ready'):", error);
    }
});

client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
});

// Opcional: código para listar grupos
client.on("ready", () => {
    try {
        console.log("Client is ready!");
        client.getChats().then((chats) => {
            const groups = chats.filter((chat) => chat.isGroup);
            groups.forEach((group) => {
                console.log(
                    `Group Name: ${group.name}, Group ID: ${group.id._serialized}`
                );
            });
        });
    } catch (error) {
        console.error("Erro em cliente.on('ready') (listar grupos):", error);
    }
});
