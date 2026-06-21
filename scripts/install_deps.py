"""
install_deps.py  —  Instala dependencias necesarias para el proyecto.

Verifica e instala:
  - Python packages: Pillow, pytesseract, rapidfuzz, requests
  - Tesseract-OCR (motor OCR)
  - Fuente Arial Bold (para badges)

Uso:
    python scripts/install_deps.py                # instalar todo
    python scripts/install_deps.py --check-only   # solo verificar sin instalar
"""

import os, sys, subprocess, argparse

REQUIRED_PACKAGES = ["Pillow", "pytesseract", "rapidfuzz", "requests"]

TESSERACT_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
]

TESSERACT_DOWNLOAD_URL = (
    "https://github.com/UB-Mannheim/tesseract/wiki"
)

FONT_PATHS = [
    r"C:\Windows\Fonts\arialbd.ttf",
    r"C:\Windows\Fonts\ArialBD.ttf",
    r"C:\Windows\Fonts\arialbd.ttf",
]


def check_python_packages():
    """Verifica paquetes Python instalados."""
    missing = []
    for pkg in REQUIRED_PACKAGES:
        try:
            __import__(pkg.replace("-", "_"))
            print(f"  [OK] {pkg}")
        except ImportError:
            missing.append(pkg)
            print(f"  [--] {pkg} no instalado")
    return missing


def install_packages(packages):
    """Instala paquetes Python via pip."""
    if not packages:
        return
    print(f"\nInstalando paquetes Python: {', '.join(packages)}")
    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", *packages],
        capture_output=True, text=True
    )
    if result.returncode == 0:
        print("  [OK] Paquetes instalados correctamente")
    else:
        print(f"  [ERROR] Falló instalación:\n{result.stderr}")


def check_tesseract():
    """Verifica si Tesseract está instalado."""
    for path in TESSERACT_PATHS:
        if os.path.exists(path):
            print(f"  [OK] Tesseract en {path}")
            return True
    # Buscar en PATH
    try:
        result = subprocess.run(["tesseract", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            first_line = result.stdout.split('\n')[0] if result.stdout else "?"
            print(f"  [OK] Tesseract en PATH: {first_line}")
            return True
    except FileNotFoundError:
        pass
    print(f"  [--] Tesseract no encontrado")
    return False


def check_fonts():
    """Verifica fuentes necesarias."""
    for path in FONT_PATHS:
        if os.path.exists(path):
            print(f"  [OK] Fuente: {os.path.basename(path)}")
            return True
    print("  [--] Arial Bold no encontrada (se usará fallback)")
    return False


def main():
    parser = argparse.ArgumentParser(description="Instala dependencias del proyecto")
    parser.add_argument("--check-only", action="store_true",
                        help="Solo verificar sin instalar")
    args = parser.parse_args()

    print("=== Verificando dependencias ===\n")

    print("Paquetes Python:")
    missing = check_python_packages()

    print("\nTesseract-OCR:")
    tesseract_ok = check_tesseract()

    print("\nFuentes:")
    fonts_ok = check_fonts()

    if args.check_only:
        print("\n=== Resumen (check-only) ===")
    else:
        print("\n=== Instalando ===")
        if missing:
            install_packages(missing)
        else:
            print("  Todos los paquetes Python ya están instalados.")

        if not tesseract_ok:
            print(f"\n  [MANUAL] Tesseract no está instalado.")
            print(f"  Descargalo desde: {TESSERACT_DOWNLOAD_URL}")
            print(f"  Instalador recomendado: tesseract-ocr-w64-setup-*.exe")
            print(f"  Asegúrate de marcar 'English' y 'Spanish' durante la instalación.")

        if not fonts_ok:
            print(f"\n  [INFO] Arial Bold no encontrada. El script usará fallback automático.")

    print("\n=== Hecho ===")


if __name__ == "__main__":
    main()
