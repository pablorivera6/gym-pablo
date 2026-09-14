"""Genera los iconos PNG de la app (mancuerna) sin dependencias externas."""
import zlib, struct, math, os

SS = 4  # supersampling para bordes suaves

def rounded_rect(px, py, x0, y0, x1, y1, r):
    if px < x0 or px > x1 or py < y0 or py > y1: return False
    cx = min(max(px, x0 + r), x1 - r)
    cy = min(max(py, y0 + r), y1 - r)
    return (px - cx) ** 2 + (py - cy) ** 2 <= r * r

def render(size):
    S = size * SS
    bg = (14, 14, 18)
    accent = (56, 189, 248)   # sky-400
    light = (125, 211, 252)
    buf = bytearray()
    # geometría de la mancuerna, en fracción del lienzo
    barY0, barY1 = 0.455, 0.545
    barX0, barX1 = 0.215, 0.785
    plates = [  # (x0, x1, y0, y1) discos exteriores e interiores
        (0.085, 0.185, 0.315, 0.685),
        (0.195, 0.265, 0.375, 0.625),
        (0.735, 0.805, 0.375, 0.625),
        (0.815, 0.915, 0.315, 0.685),
    ]
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            r = g = b = 0
            for sy in range(SS):
                for sx in range(SS):
                    px = (x * SS + sx + 0.5) / S
                    py = (y * SS + sy + 0.5) / S
                    # fondo con un halo suave arriba a la izquierda
                    d = math.hypot(px - 0.32, py - 0.24)
                    t = max(0.0, 1.0 - d * 1.25) ** 2 * 0.30
                    c = tuple(int(bg[i] + (accent[i] - bg[i]) * t) for i in range(3))
                    hit = rounded_rect(px, py, barX0, barY0, barX1, barY1, 0.028)
                    col = accent if hit else None
                    for i, (a0, a1, b0, b1) in enumerate(plates):
                        if rounded_rect(px, py, a0, b0, a1, b1, 0.030):
                            col = light if i in (0, 3) else accent
                    if col: c = col
                    r += c[0]; g += c[1]; b += c[2]
            n = SS * SS
            row += bytes((r // n, g // n, b // n))
        buf += row
    raw = bytes(buf)
    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw, 9))
    png += chunk(b'IEND', b'')
    return png

os.makedirs('public', exist_ok=True)
for s in (180, 192, 512):
    open(f'public/icon-{s}.png', 'wb').write(render(s))
    print(f'  ✓ public/icon-{s}.png')
