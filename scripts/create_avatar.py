
import os

BASE_DIR = r"c:/Users/bigey/Documents/Antigravity/L2C/miniprogram/assets"
AVATAR_PATH = os.path.join(BASE_DIR, "default-avatar.png")

# Start of a simple PNG file (1x1 pixel)
PNG_DATA = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\x01sRGB\x00\xae\xce\x1c\xe9\x00\x00\x00\rIDAT\x08\x1dc\x60\x60\x60\x00\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'

if not os.path.exists(AVATAR_PATH):
    with open(AVATAR_PATH, "wb") as f:
        f.write(PNG_DATA)
    print(f"Created placeholder avatar at {AVATAR_PATH}")
else:
    print("Avatar already exists")
