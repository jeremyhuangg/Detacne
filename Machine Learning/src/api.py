r"""API (FastAPI) supaya backend website bisa memanggil model lewat HTTP.

Jalankan dari folder proyek:
    python -m uvicorn api:app --app-dir src --host 127.0.0.1 --port 8000

POST /analisis          : multipart, kolom "foto" -> JSON hasil; foto berkotak disimpan ke hasil_foto/
GET  /hasil/{nama}.jpg  : isi foto berkotak
Bukan alat diagnosis medis.
"""
import io
import os
import re
import threading
import warnings
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from PIL import Image, ImageOps

import pipeline
from hasil_web import jalankan_lengkap

FOLDER_HASIL = os.path.join(pipeline.PROYEK, 'hasil_foto')
MAKS_BYTE = 15 * 1024 * 1024
POLA_NAMA = re.compile(r'[0-9a-f]{32}\.jpg')
MODEL = {}
KUNCI = threading.Lock()      # model dipakai bergantian, satu foto sekali jalan


@asynccontextmanager
async def siklus(app):
    MODEL['detektor'] = pipeline.muat_deteksi()
    MODEL['model'], MODEL['kelas'] = pipeline.muat_jenis()
    yield


app = FastAPI(title='API Deteksi & Jenis Jerawat', lifespan=siklus)


@app.post('/analisis')
def analisis(foto: UploadFile = File(...)):
    isi = foto.file.read(MAKS_BYTE + 1)
    if len(isi) > MAKS_BYTE:
        raise HTTPException(413, 'Ukuran foto lebih dari 15 MB.')
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            gambar = Image.open(io.BytesIO(isi), formats=['JPEG', 'PNG'])
            gambar = ImageOps.exif_transpose(gambar).convert('RGB')
    except Exception:
        raise HTTPException(400, 'File bukan foto JPG/PNG yang bisa dibaca.')
    with KUNCI:
        return jalankan_lengkap(gambar, MODEL['detektor'], MODEL['model'], MODEL['kelas'], folder_simpan=FOLDER_HASIL)


@app.get('/hasil/{nama}')
def ambil_foto(nama: str):
    if not POLA_NAMA.fullmatch(nama):
        raise HTTPException(400, 'Nama file tidak sah.')
    path = os.path.join(FOLDER_HASIL, nama)
    if not os.path.isfile(path):
        raise HTTPException(404, 'Foto tidak ditemukan.')
    return FileResponse(path, media_type='image/jpeg')
