import csv
import re
import os

def format_number(phone_number):
    # Remove caracteres não numéricos
    phone_number = re.sub(r'\D', '', phone_number)
    # Garante que o número comece com '55'
    if not phone_number.startswith('55'):
        phone_number = '55' + phone_number
    return phone_number

def process_csv(input_file, output_folder, max_per_file=600):
    # Cria a pasta de saída se ela não existir
    os.makedirs(output_folder, exist_ok=True)

    with open(input_file, newline='', encoding='utf-8') as infile:
        reader = csv.reader(infile)
        file_number = 1
        current_count = 0
        outfile = open(os.path.join(output_folder, f'user{file_number:02}.csv'), mode='w', newline='', encoding='utf-8')
        writer = csv.writer(outfile)

        for row in reader:
            if current_count >= max_per_file:
                # Fecha o arquivo atual e começa um novo
                outfile.close()
                file_number += 1
                current_count = 0
                outfile = open(os.path.join(output_folder, f'user{file_number:02}.csv'), mode='w', newline='', encoding='utf-8')
                writer = csv.writer(outfile)

            formatted_row = [format_number(cell) for cell in row]
            writer.writerow(formatted_row)
            current_count += 1

        if not outfile.closed:
            outfile.close()

# Substitua 'input.csv' pelo caminho do seu arquivo de entrada
process_csv('input.csv', 'output/user01')
