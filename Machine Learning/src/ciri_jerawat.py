"""Ciri (60 angka) untuk model 2: 48 ciri warna + 12 ciri titik.

Harus sama persis dengan fungsi `ciri` di notebook
V3\\model2_ml_klasik\\final_gabungan.ipynb, karena model dilatih dengan ciri ini.
"""
import numpy as np
from PIL import Image
from scipy import ndimage
from skimage.color import rgb2hsv, rgb2lab

UKURAN = 64
YY, XX = np.mgrid[:UKURAN, :UKURAN]
JARAK = np.hypot(YY - 31.5, XX - 31.5)
TENGAH, TEPI = JARAK < 12, JARAK > 24
T = np.zeros((UKURAN, UKURAN), bool)
T[16:48, 16:48] = True

NAMA_CIRI = ([f'hist_H{i}' for i in range(12)] + [f'hist_S{i}' for i in range(8)] + [f'hist_V{i}' for i in range(8)]
             + ['L_rata', 'a_rata', 'b_rata', 'L_sebar', 'a_sebar', 'b_sebar']
             + ['R_rata', 'G_rata', 'B_rata', 'R_sebar', 'G_sebar', 'B_sebar']
             + ['porsi_merah', 'porsi_putih', 'porsi_gelap']
             + ['kontras_L', 'kontras_a', 'kontras_b', 'kontras_S', 'kontras_V']
             + ['titik_terang_maks', 'titik_terang_p95', 'titik_porsi_putih', 'titik_porsi_kuning',
                'titik_bintik_maks', 'titik_bintik_pusat', 'titik_bintik_besar_maks', 'titik_bintik_besar_min',
                'titik_merah_tengah', 'porsi_merah_kulit', 'porsi_merah_dekat', 'titik_gelap_tengah'])
assert len(NAMA_CIRI) == 60


def ciri(gambar):
    """gambar: PIL.Image potongan satu jerawat. Hasil: array 60 angka."""
    rgb = np.asarray(gambar.convert('RGB').resize((UKURAN, UKURAN), Image.BICUBIC), np.float32) / 255
    hsv, lab = rgb2hsv(rgb), rgb2lab(rgb)
    n = UKURAN * UKURAN
    # --- 48 ciri warna ---
    hist = np.concatenate([np.histogram(hsv[..., 0], 12, (0, 1))[0], np.histogram(hsv[..., 1], 8, (0, 1))[0],
                           np.histogram(hsv[..., 2], 8, (0, 1))[0]]) / n
    stat_lab = np.concatenate([lab.reshape(-1, 3).mean(0), lab.reshape(-1, 3).std(0)])
    stat_rgb = np.concatenate([rgb.reshape(-1, 3).mean(0), rgb.reshape(-1, 3).std(0)])
    kroma = np.sqrt(lab[..., 1] ** 2 + lab[..., 2] ** 2)
    porsi = np.array([(lab[..., 1] > 15).mean(), ((lab[..., 0] > 75) & (kroma < 12)).mean(), (lab[..., 0] < 30).mean()])
    kontras = np.concatenate([lab[T].mean(0) - lab[~T].mean(0),
                              [hsv[..., 1][T].mean() - hsv[..., 1][~T].mean(), hsv[..., 2][T].mean() - hsv[..., 2][~T].mean()]])
    # --- 12 ciri titik ---
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    kulit = np.median(L[TEPI])
    terang = L - kulit
    putih = (terang > 8) & (np.hypot(a, b) < 25)
    kuning = (terang > 4) & (b > np.median(b[TEPI]) + 6)
    bintik = -ndimage.gaussian_laplace(L, 2)
    bintik_besar = -ndimage.gaussian_laplace(L, 4)
    merah = a - np.median(a[TEPI])
    titik = [terang[TENGAH].max(), np.percentile(terang[TENGAH], 95), putih[TENGAH].mean(), kuning[TENGAH].mean(),
             bintik[TENGAH].max(), bintik[JARAK < 6].max(), bintik_besar[TENGAH].max(), bintik_besar[TENGAH].min(),
             merah[TENGAH].mean(), (merah > 8).mean(), (merah[JARAK < 20] > 8).mean(), L[TENGAH].min() - kulit]
    return np.concatenate([hist, stat_lab, stat_rgb, porsi, kontras, titik]).astype(np.float32)
