import sys

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from pedalboard import Compressor, Gain, HighpassFilter, HighShelfFilter, Limiter, LowShelfFilter, Pedalboard, Reverb

stems, out = sys.argv[1], sys.argv[2]
load = lambda name: sf.read(f"{stems}/{name}.wav", dtype="float32")
(drums, sr), (music, _), (fx, _), (send, _) = load("drums"), load("music"), load("fx"), load("send")

drums = Pedalboard([Compressor(threshold_db=-14, ratio=3, attack_ms=4, release_ms=90)])(drums.T, sr).T
room = Pedalboard([HighpassFilter(250), Reverb(room_size=0.72, damping=0.45, wet_level=1.0, dry_level=0.0, width=1.0), LowShelfFilter(300, -4)])(send.T, sr).T
mix = drums + music + fx + room * 0.32
mix = Pedalboard([
    Compressor(threshold_db=-12, ratio=2, attack_ms=25, release_ms=180),
    HighShelfFilter(9000, 1.5),
])(mix.T, sr).T

meter = pyln.Meter(sr)
mix = Pedalboard([Gain(-12.0 - meter.integrated_loudness(mix)), Limiter(threshold_db=-3.0, release_ms=120)])(mix.T, sr).T
mix *= 10 ** ((-14.2 - meter.integrated_loudness(mix)) / 20)
fade = np.minimum(1, np.minimum(np.arange(len(mix)) / (sr * 0.02), (len(mix) - np.arange(len(mix))) / (sr * 0.8)))
mix *= fade[:, None]
sf.write(out, mix, sr, subtype="PCM_24")
print(f"integrated {meter.integrated_loudness(mix):.1f} LUFS, sample peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS")
