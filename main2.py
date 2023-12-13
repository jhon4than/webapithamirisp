import csv
import re

# Caminho do arquivo CSV original
input_file_path = 'contacts.csv'

# Caminho do arquivo de saída com apenas números de telefone
output_file_path = 'phone_numbers.txt'

# Função para formatar o número de telefone
def format_phone_number(phone_number):
    # Remove caracteres não numéricos
    clean_number = re.sub(r'\D', '', phone_number)
    # Adiciona o prefixo '55' e retorna o número formatado
    return '55' + clean_number

# Lê o arquivo CSV, formata os números de telefone e salva em um novo arquivo
def extract_and_format_phone_numbers(input_path, output_path):
    with open(input_path, mode='r', encoding='utf-8') as file:
        reader = csv.reader(file)
        data = list(reader)

        # Identifica a coluna do número de telefone
        phone_column_index = data[0].index('Phone 1 - Value') if data else -1

        # Lista para guardar os números formatados
        formatted_numbers = []

        # Processa cada linha (exceto o cabeçalho)
        for row in data[1:]:
            if row and phone_column_index != -1:
                formatted_number = format_phone_number(row[phone_column_index])
                formatted_numbers.append(formatted_number)

    # Salva os números formatados em um novo arquivo
    with open(output_path, mode='w', encoding='utf-8') as file:
        for number in formatted_numbers:
            file.write(number + '\n')

# Executa a função
extract_and_format_phone_numbers(input_file_path, output_file_path)
