"""Approximate WCAG 2.3.1 general-flash check for a video.

A flash is a pair of opposing relative-luminance changes of at least 0.10 where the
darker state is below 0.80. Content fails when more than three flashes occur within
one second over a combined area larger than roughly a quarter of the central field
of view, taken here as 10% of the frame.
"""

import subprocess
import sys

import numpy as np

path = sys.argv[1]
GW, GH, FPS = 48, 27, 60
raw = subprocess.run(
    ["ffmpeg", "-loglevel", "error", "-i", path, "-vf", f"fps={FPS},scale={GW}:{GH}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
    capture_output=True, check=True,
).stdout
frames = np.frombuffer(raw, np.uint8).reshape(-1, GH, GW, 3).astype(np.float32) / 255
lin = np.where(frames <= 0.04045, frames / 12.92, ((frames + 0.055) / 1.055) ** 2.4)
lum = lin @ np.array([0.2126, 0.7152, 0.0722], np.float32)
red = (frames[..., 0] - np.maximum(frames[..., 1], frames[..., 2])) > 0.5

n = lum.shape[0]
events = np.zeros((n, GH, GW), bool)
for y in range(GH):
    for x in range(GW):
        seq = lum[:, y, x]
        anchor, direction = seq[0], 0
        for i in range(1, n):
            delta = seq[i] - anchor
            if abs(delta) >= 0.10 and min(seq[i], anchor) < 0.80:
                d = 1 if delta > 0 else -1
                if d != direction:
                    events[i, y, x] = True
                    direction = d
                anchor = seq[i]
            elif (direction > 0 and seq[i] > anchor) or (direction < 0 and seq[i] < anchor):
                anchor = seq[i]

window = FPS
csum = np.cumsum(events, axis=0)
counts = csum[window:] - csum[:-window]
flagged = (counts > 6).mean(axis=(1, 2))
worst = int(flagged.argmax())
red_share = red.mean(axis=(1, 2))
print(f"{path}: {n / FPS:.1f}s")
print(f"  worst 1 s window at {worst / FPS:.1f}s: {flagged[worst] * 100:.1f}% of frame has >3 flashes (limit ~10%)")
print(f"  seconds with any flagged area: {int((flagged > 0).sum() / FPS)}")
print(f"  largest saturated-red area in one frame: {red_share.max() * 100:.1f}%")
print("  verdict:", "FAIL" if flagged.max() > 0.10 else "pass")
