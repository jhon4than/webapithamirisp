const qrcode = require("qrcode-terminal");
const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js");
const schedule = require("node-schedule");
const moment = require("moment-timezone");

const botActive = { value: true };
let startDate = new Date(); // Data de início do bot
const GROUP_ID = "120363164051478387@g.us";

// Funções auxiliares
function checkIfShouldPause() {
    let currentDate = new Date();
    let timeDiff = currentDate - startDate;
    let daysPassed = timeDiff / (1000 * 60 * 60 * 24); // Convertendo de milissegundos para dias

    if (daysPassed >= 30) {
        console.log("30 dias passaram, bot está agora em pausa.");
        botActive.value = false;
    } else {
        setTimeout(checkIfShouldPause, 24 * 60 * 60 * 1000); // 24 horas em milissegundos
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sendEndOfDayMessage(chatId) {
    const endOfDayMessage = "Mensagem de final de dia"; // Coloque sua mensagem aqui
    client.sendMessage(chatId, endOfDayMessage);
}

function sendRandomSignal(chatId, imagePath) {
    const signalImage = MessageMedia.fromFilePath(imagePath);
    const message = "Sua mensagem aqui"; // Sua mensagem

    client.sendMessage(chatId, signalImage, { caption: message });
}

// Função para agendar sinais
function scheduleSignals() {
    console.log("Agendando sinais com base na hora programada.");

    // Agendando o primeiro sinal para 3 minutos após o horário atual
    const firstSignalTime = moment().tz("America/Sao_Paulo").add(3, "minutes");
    console.log(
        `Agendado primeiro sinal para ${firstSignalTime.format("HH:mm")} BRT.`
    );
    schedule.scheduleJob(firstSignalTime.toDate(), function () {
        console.log(
            `Enviando primeiro sinal para ${firstSignalTime.format(
                "HH:mm"
            )} BRT.`
        );
        sendSignal(GROUP_ID, firstSignalTime);
    });

    // Agendando os demais sinais conforme definido em signalHours
    const signalHours = [
        { hour: 9, minute: 0 },
        { hour: 11, minute: 0 },
        { hour: 13, minute: 0 },
        { hour: 15, minute: 0 },
        { hour: 17, minute: 0 },
        { hour: 19, minute: 0 },
        { hour: 21, minute: 0 },
        { hour: 23, minute: 0 },
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
            sendSignal(GROUP_ID, scheduledTime);
        });
    });
}

// Função para enviar sinal
function sendSignal(chatId, scheduledTime) {
    if (botActive.value) {
        sendMinutePayingMessage(chatId, scheduledTime);
    } else {
        console.log("Bot está pausado e não pode enviar sinais.");
    }
}

// Função para gerar a mensagem com sinais sequenciais
function sendMinutePayingMessage(chatId, startTime) {
    const message = generateMessageBasedOnStartTime(startTime);
    client
        .sendMessage(chatId, message)
        .then(() => console.log("Mensagem de minutos pagantes enviada."))
        .catch((err) => console.error("Erro ao enviar mensagem:", err));
}
function generateMessageBasedOnStartTime(startTime) {
    const nextTime = startTime.clone().add(2, "hours");
    let message = `SINAIS 10x🎰\n\nLINK DA PLATAFORMA FIXADO🚨⤴🍀\n\nJoguem com consciência!🍀💰\n▪▪▪▪▪▪▪▪▪▪▪\n⏰MINUTOS PAGANTES⏰\n🕕 ${startTime.format(
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
            let timeIncrement = getRandomInt(5, 10); // Intervalo aleatório entre 5 e 10 minutos
            message += `⏰${signalTime.format("HH:mm")}\n`;
            signalTime.add(timeIncrement, "minutes");
        }
        message += `▪▪▪▪▪▪▪▪▪▪▪\n`;
    }

    message +=
        "⚠ Deu 4 ou 5 giros máximo com bet mínima de forma manual e INTERCALANDO e o jogo não te pagou um valor superior aos da suas apostas? Saia da plataforma IMEDIATAMENTE!\n🍀 BOA SORTE! 🍀\n▪▪▪▪▪▪▪▪▪▪▪";

    console.log(message);
    return message;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomTime(startTime, endTime) {
    let diff = endTime.diff(startTime, "minutes");
    let randomDiff = Math.floor(Math.random() * diff);
    return startTime.clone().add(randomDiff, "minutes");
}

// Cliente WhatsApp e inicialização
const client = new Client({
    authStrategy: new LocalAuth(),
});

client.initialize();

client.on("ready", () => {
    console.log("Bot Online!");
    scheduleSignals();
    checkIfShouldPause(); // Inicia a verificação de pausa
});

client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
});

// Opcional: código para listar grupos
client.on("ready", () => {
    console.log("Client is ready!");
    client.getChats().then((chats) => {
        const groups = chats.filter((chat) => chat.isGroup);
        groups.forEach((group) => {
            console.log(
                `Group Name: ${group.name}, Group ID: ${group.id._serialized}`
            );
        });
    });
});
