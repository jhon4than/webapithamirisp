const { Client } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const readline = require("readline");
const util = require('util');
const sleep = util.promisify(setTimeout);

// Group Name: Horários Pagantes[OFICIAL]✅#01, Group ID: 120363184319354183@g.us
// Group Name: Horários Pagantes[OFICIAL]✅#03, Group ID: 120363186668232235@g.us
// Group Name: Horários Pagantes[OFICIAL]✅#06, Group ID: 120363203833110802@g.us
// Group Name: Horários Pagantes[OFICIAL]✅#05, Group ID: 120363203614517636@g.us
// Group Name: Horários Pagantes[OFICIAL]✅#04, Group ID: 120363204205712766@g.us
// Group Name: Horários Pagantes[OFICIAL]✅#02, Group ID: 120363185126676149@g.us

// IDs dos grupos
const groupIds = ["120363184319354183@g.us"];

// Crie um cliente WhatsApp
const client = new Client();

client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on("ready", async () => {
    console.log("Cliente pronto");
    await processNumbers();
});

const processNumbers = async () => {
    const csvFilePath = "numeros.csv"; // Caminho para o seu arquivo CSV

    if (!fs.existsSync(csvFilePath)) {
        console.error(`O arquivo ${csvFilePath} não foi encontrado.`);
        return;
    }

    const fileStream = fs.createReadStream(csvFilePath);
    const reader = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let currentGroupIndex = 0;
    let membersAdded = 0;
    const participants = [];

    for await (const line of reader) {
        const phoneNumber = line.trim();
        const phoneNumberWithSuffix = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;

        if (/^\d+@c.us$/.test(phoneNumberWithSuffix)) {
            if (membersAdded < 600) {
                participants.push(phoneNumberWithSuffix);
                membersAdded++;
            } else {
                try {
                    // Adiciona participantes ao grupo atual
                    const group = await client.getChatById(groupIds[currentGroupIndex]);
                    const result = await group.addParticipants(participants);
                    console.log(`Participantes adicionados ao grupo ${groupIds[currentGroupIndex]}`);
                    console.log(result);
                } catch (error) {
                    console.error(`Erro ao adicionar participantes: ${error}`);
                }

                // Prepara para o próximo grupo
                currentGroupIndex++;
                membersAdded = 0;
                participants.length = 0;

                if (currentGroupIndex >= groupIds.length) {
                    console.log("Todos os números foram processados.");
                    break;
                }
            }
        } else {
            console.error(`Formato inválido encontrado: ${line}`);
        }
    }

    if (participants.length > 0) {
        try {
            // Adiciona os participantes restantes ao último grupo
            const group = await client.getChatById(groupIds[currentGroupIndex]);
            const result = await group.addParticipants(participants);
            console.log(`Participantes adicionados ao grupo ${groupIds[currentGroupIndex]}`);
            console.log(result);
        } catch (error) {
            console.error(`Erro ao adicionar participantes: ${error}`);
        }
    }
};

client.on("auth_failure", (msg) => {
    console.error("Falha na autenticação:", msg);
});

client.initialize();