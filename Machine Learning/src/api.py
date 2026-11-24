import os
import sys
import threading
import warnings
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from PIL import Image, ImageOps
from pydantic import BaseModel

# Pastikan import modul lokal di folder src/ selalu jalan dari direktori mana pun
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pipeline
from hasil_web import jalankan_lengkap
from info_jenis import KURANG_YAKIN

# Folder bersama Express & FastAPI (bisa di-override lewat env variable)
FOLDER_UPLOAD = os.path.abspath(
    os.getenv('UPLOAD_DIR', os.path.join(pipeline.PROYEK, 'uploads'))
)
FOLDER_HASIL = os.path.abspath(
    os.getenv('RESULT_DIR', os.path.join(pipeline.PROYEK, 'hasil_foto'))
)

# Ubah ke True kalau 'Kurang yakin' tidak mau ikut dikirim ke Express/DB
SKIP_KURANG_YAKIN = False

MODEL = {}
KUNCI = threading.Lock()


class ScanRequest(BaseModel):
    imageKey: str


@asynccontextmanager
async def siklus(app: FastAPI):
    os.makedirs(FOLDER_UPLOAD, exist_ok=True)
    os.makedirs(FOLDER_HASIL, exist_ok=True)
    MODEL['detektor'] = pipeline.muat_deteksi()
    MODEL['model'], MODEL['kelas'] = pipeline.muat_jenis()
    yield


app = FastAPI(title='Detacne ML API', lifespan=siklus)


@app.post('/scan')
def scan(payload: ScanRequest):
    rel_key = payload.imageKey.strip().lstrip('/\\')
    if not rel_key:
        raise HTTPException(status_code=400, detail='imageKey tidak boleh kosong.')

    input_path = os.path.abspath(os.path.join(FOLDER_UPLOAD, rel_key))
    if os.path.commonpath([FOLDER_UPLOAD, input_path]) != FOLDER_UPLOAD:
        raise HTTPException(status_code=400, detail='Path foto tidak valid.')

    if not os.path.isfile(input_path):
        raise HTTPException(status_code=404, detail='Foto tidak ditemukan.')

    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            with Image.open(input_path, formats=['JPEG', 'PNG']) as img:
                gambar = ImageOps.exif_transpose(img).convert('RGB')
    except Exception:
        raise HTTPException(status_code=400, detail='File bukan foto JPG/PNG yang valid.')

    with KUNCI:
        raw_result = jalankan_lengkap(
            gambar,
            MODEL['detektor'],
            MODEL['model'],
            MODEL['kelas'],
            folder_simpan=FOLDER_HASIL,
        )

    acne = [
        {
            'acneName': item['jenis'],
            'jumlah': item['jumlah'],
        }
        for item in raw_result['ringkasan']
        if not (SKIP_KURANG_YAKIN and item['jenis'] == KURANG_YAKIN)
    ]

    return {
        'imageKey': raw_result['foto_hasil'],
        'acne': acne,
    }