const qrcode = require("qrcode-terminal");
const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js");
const schedule = require("node-schedule");
const moment = require("moment-timezone");

const botActive = { value: true };
let startDate = new Date(); // Data de início do bot
const GROUP_IDS = [
    "120363205945896855@g.us", // ID do Grupo 1
    "120363219756067105@g.us", // ID do Grupo 2
    "120363214348020444@g.us", // ID do Grupo 3
    "120363202681534527@g.us", // ID do Grupo 3
];

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
    // Agendando os demais sinais conforme definido em signalHours
    const signalHours = [
        { hour: 6, minute: 10 },
        { hour: 9, minute: 0 },
        { hour: 11, minute: 0 },
        { hour: 13, minute: 0 },
        { hour: 15, minute: 0 },
        { hour: 17, minute: 5 },
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
            sendSignal(GROUP_IDS, scheduledTime);
        });
    });
}

function sendSignal(groupIds, scheduledTime) {
    if (botActive.value) {
        groupIds.forEach((chatId, index) => {
            // Adicionando um atraso de 5 segundos multiplicado pelo índice do grupo
            setTimeout(() => {
                sendMinutePayingMessage(chatId, scheduledTime);
            }, 5000 * index); // 5000 milissegundos = 5 segundos
        });
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
    // ... código anterior para gerar a mensagem ...
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

// Adicione tratamento de erros para evitar que o bot pare completamente em caso de falha
client.on("auth_failure", () => {
    console.error("Falha na autenticação do cliente WhatsApp.");
    // Você pode adicionar aqui ações para tentar reconectar ou notificar um administrador.
});

client.on("disconnected", (reason) => {
    console.error(`Cliente WhatsApp desconectado. Motivo: ${reason}`);
    // Você pode adicionar aqui ações para tentar reconectar ou notificar um administrador.
});

// Clientes WhatsApp
client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on("message", (message) => {
    // Lide com as mensagens recebidas conforme necessário
});

client.on("group_join", (notification) => {
    // Lide com eventos de entrada em grupos
});

client.on("group_leave", (notification) => {
    // Lide com eventos de saída de grupos
});
