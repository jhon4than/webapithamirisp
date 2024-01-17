import datetime
import random
import time
from yowsup.stacks import YowStackBuilder
from yowsup.layers import YowLayerEvent
from yowsup.layers.auth import AuthError
from yowsup.layers.network import YowNetworkLayer
from yowsup.env import YowsupEnv
from yowsup.layers.interface import YowInterfaceLayer, ProtocolEntityCallback
from yowsup.layers.protocol_messages.protocolentities import TextMessageProtocolEntity

class WhatsappBot(YowInterfaceLayer):
    def __init__(self, credentials, group_id):
        super(WhatsappBot, self).__init__()
        self.credentials = credentials  # Número de telefone e senha
        self.group_id = group_id
        self.bot_active = True
        self.start_date = datetime.datetime.now()

    @ProtocolEntityCallback("message")
    def on_message(self, message_protocol_entity):
        # Responder a mensagens ou processar comandos aqui
        pass

    def send_message(self, text):
        outgoing_message = TextMessageProtocolEntity(
            text, to=self.group_id
        )
        self.toLower(outgoing_message)

    def check_if_should_pause(self):
        current_date = datetime.datetime.now()
        if (current_date - self.start_date).days >= 30:
            print("30 dias passaram, bot está agora em pausa.")
            self.bot_active = False
        else:
            # Reagendar a verificação para o próximo dia
            time.sleep(86400)  # 24 horas
            self.check_if_should_pause()

    # Outras funções auxiliares aqui

if __name__ == "__main__":
    credentials = ("5521959076102", "senha")  # Substitua com suas credenciais
    group_id = "120363214348020444@g.us"  # Substitua com o ID do seu grupo
    bot = WhatsappBot(credentials, group_id)

    stack_builder = YowStackBuilder()
    stack = stack_builder\
        .pushDefaultLayers(True)\
        .push(bot)\
        .build()

    stack.setCredentials(credentials)
    stack.broadcastEvent(YowLayerEvent(YowNetworkLayer.EVENT_STATE_CONNECT))

    try:
        stack.loop()  # Iniciar o bot
    except AuthError as e:
        print("Erro de autenticação:", e)
    except Exception as e:
        print("Erro inesperado:", e)
