#!/usr/bin/env python3
import os
import zipfile

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUTPUT_ZIP = os.path.join(PROJECT_ROOT, 'public', 'incuNOVA_v3_2_Proyecto_Completo.zip')

EXCLUDE_DIRS = {
    'node_modules',
    '.git',
    'dist',
    'dev-dist',
    '.aistudio',
    '__pycache__'
}

EXCLUDE_FILES = {
    'incuNOVA_v3_2_Proyecto_Completo.zip'
}

def make_zip():
    os.makedirs(os.path.dirname(OUTPUT_ZIP), exist_ok=True)
    count = 0
    with zipfile.ZipFile(OUTPUT_ZIP, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(PROJECT_ROOT):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            for file in files:
                if file in EXCLUDE_FILES:
                    continue
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, PROJECT_ROOT)
                zipf.write(full_path, rel_path)
                count += 1
    
    file_size_kb = os.path.getsize(OUTPUT_ZIP) / 1024
    print(f"[ZIP CREADO] Archivos incluidos: {count}")
    print(f"[DESTINO] {OUTPUT_ZIP}")
    print(f"[TAMAÑO] {file_size_kb:.1f} KB")

if __name__ == '__main__':
    make_zip()
