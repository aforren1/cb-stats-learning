import numpy as np
import stb.image as im

size = 50
white_noise = np.random.uniform(
    low=0, high=255, size=(size, size, 1)).astype('uint8')

im.write('src/assets/white_noise.png', white_noise)
