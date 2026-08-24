import os
import math
from PIL import Image, ImageDraw

def create_smart_table_logo(size=512, is_maskable=False):
    # Create image with RGBA
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    scale = size / 512.0
    corner_radius = int(120 * scale) if not is_maskable else 0

    # Draw rounded gradient background box
    bg_box = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg_box)

    # Linear gradient #C81E1E (top-left) to #FF6A00 (bottom-right)
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2.0 * size)
            r = int(200 + (255 - 200) * t)
            g = int(30 + (106 - 30) * t)
            b = int(30 * (1 - t))
            # Check mask
            bg_box.putpixel((x, y), (r, g, b, 255))

    # Apply rounded corner mask
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    if is_maskable:
        mask_draw.rectangle([0, 0, size, size], fill=255)
    else:
        padding = int(12 * scale)
        mask_draw.rounded_rectangle([padding, padding, size - padding, size - padding], radius=corner_radius, fill=255)

    img.paste(bg_box, (0, 0), mask)
    draw = ImageDraw.Draw(img)

    # Draw Inner Glowing Rim
    if not is_maskable:
        padding = int(12 * scale)
        draw.rounded_rectangle(
            [padding + int(4*scale), padding + int(4*scale), size - padding - int(4*scale), size - padding - int(4*scale)],
            radius=max(1, corner_radius - int(4*scale)),
            outline=(255, 255, 255, 60),
            width=int(3 * scale)
        )

    # Draw Table Surface (Dark Slate Ellipse)
    cx, cy = size / 2, size * 0.48
    rx, ry = 150 * scale, 65 * scale
    
    # Outer dark shadow table top
    draw.ellipse([cx - rx - 4*scale, cy - ry + 8*scale, cx + rx + 4*scale, cy + ry + 12*scale], fill=(15, 23, 42, 180))
    # Table top plate background
    draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(15, 23, 42, 255), outline=(255, 255, 255, 220), width=int(5*scale))

    # Center gourmet plate
    plate_r = 52 * scale
    draw.ellipse([cx - plate_r, cy - plate_r*0.6, cx + plate_r, cy + plate_r*0.6], fill=(255, 255, 255, 245))
    
    inner_r = 32 * scale
    draw.ellipse([cx - inner_r, cy - inner_r*0.6, cx + inner_r, cy - inner_r*0.6 + inner_r*1.2], fill=(200, 30, 30, 255))

    core_r = 12 * scale
    draw.ellipse([cx - core_r, cy - core_r*0.6, cx + core_r, cy - core_r*0.6 + core_r*1.2], fill=(255, 255, 255, 255))

    # Cutlery: Fork on Left
    fork_x = cx - 95 * scale
    fork_y = cy
    draw.line([fork_x, fork_y - 35*scale, fork_x, fork_y + 35*scale], fill=(255, 255, 255, 240), width=int(6*scale))
    draw.line([fork_x - 12*scale, fork_y - 35*scale, fork_x - 12*scale, fork_y - 10*scale], fill=(255, 255, 255, 240), width=int(4.5*scale))
    draw.line([fork_x + 12*scale, fork_y - 35*scale, fork_x + 12*scale, fork_y - 10*scale], fill=(255, 255, 255, 240), width=int(4.5*scale))
    draw.line([fork_x - 12*scale, fork_y - 10*scale, fork_x + 12*scale, fork_y - 10*scale], fill=(255, 255, 255, 240), width=int(4.5*scale))

    # Cutlery: Knife on Right
    knife_x = cx + 95 * scale
    knife_y = cy
    draw.line([knife_x, knife_y - 35*scale, knife_x, knife_y + 35*scale], fill=(255, 255, 255, 240), width=int(6*scale))
    draw.arc([knife_x - 10*scale, knife_y - 35*scale, knife_x + 20*scale, knife_y - 2*scale], 270, 90, fill=(255, 255, 255, 240), width=int(5*scale))

    # Table Base / Pedestal
    pedestal_top_y = cy + ry - 8*scale
    pedestal_bot_y = cy + ry + 85*scale
    draw.line([cx - 10*scale, pedestal_top_y, cx - 10*scale, pedestal_bot_y], fill=(255, 255, 255, 240), width=int(7*scale))
    draw.line([cx + 10*scale, pedestal_top_y, cx + 10*scale, pedestal_bot_y], fill=(255, 255, 255, 240), width=int(7*scale))
    # Base Bar
    draw.line([cx - 75*scale, pedestal_bot_y, cx + 75*scale, pedestal_bot_y], fill=(255, 255, 255, 240), width=int(9*scale))

    # Top Sparkle / Smart Star
    star_cx, star_cy = cx, size * 0.18
    star_r = 30 * scale
    star_points = []
    for i in range(8):
        angle = i * math.pi / 4
        r = star_r if i % 2 == 0 else star_r * 0.35
        px = star_cx + r * math.cos(angle - math.pi / 2)
        py = star_cy + r * math.sin(angle - math.pi / 2)
        star_points.append((px, py))
    draw.polygon(star_points, fill=(255, 255, 255, 255))

    return img

def main():
    base_dir = r"c:\Users\hemas\DINETRACK\DINETRACK"
    
    # 1. assets/images/
    assets_dir = os.path.join(base_dir, "assets", "images")
    os.makedirs(assets_dir, exist_ok=True)
    img_512 = create_smart_table_logo(512)
    img_512.save(os.path.join(assets_dir, "app_logo.png"), "PNG")
    print("Saved assets/images/app_logo.png")

    # 2. Android mipmaps
    mipmaps = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    for folder, dim in mipmaps.items():
        folder_path = os.path.join(base_dir, "android", "app", "src", "main", "res", folder)
        os.makedirs(folder_path, exist_ok=True)
        icon = create_smart_table_logo(dim)
        icon.save(os.path.join(folder_path, "ic_launcher.png"), "PNG")
        print(f"Saved {folder}/ic_launcher.png ({dim}x{dim})")

    # 3. Web icons
    web_icons_dir = os.path.join(base_dir, "web", "icons")
    os.makedirs(web_icons_dir, exist_ok=True)
    
    icon_192 = create_smart_table_logo(192)
    icon_192.save(os.path.join(web_icons_dir, "Icon-192.png"), "PNG")
    
    icon_512 = create_smart_table_logo(512)
    icon_512.save(os.path.join(web_icons_dir, "Icon-512.png"), "PNG")

    mask_192 = create_smart_table_logo(192, is_maskable=True)
    mask_192.save(os.path.join(web_icons_dir, "Icon-maskable-192.png"), "PNG")

    mask_512 = create_smart_table_logo(512, is_maskable=True)
    mask_512.save(os.path.join(web_icons_dir, "Icon-maskable-512.png"), "PNG")

    favicon_png = create_smart_table_logo(64)
    favicon_png.save(os.path.join(base_dir, "web", "favicon.png"), "PNG")
    print("Saved web icons & favicon.png")

    # 4. Frontend public logo
    frontend_public = os.path.join(base_dir, "frontend", "public")
    os.makedirs(frontend_public, exist_ok=True)
    img_512.save(os.path.join(frontend_public, "logo.png"), "PNG")
    favicon_png.save(os.path.join(frontend_public, "favicon.png"), "PNG")
    print("Saved frontend/public/logo.png & favicon.png")

if __name__ == "__main__":
    main()
