from PIL import Image
import os

def generate_icons():
    assets_dir = "/Users/ritom/Projects/z/native/assets/images"
    
    icon_black_path = os.path.join(assets_dir, "icon_black.png")
    icon_white_path = os.path.join(assets_dir, "icon_white.png")
    
    # 1. Generate light/opaque icon (flatten icon_black onto white background)
    print("Generating light/opaque icon...")
    im_black = Image.open(icon_black_path)
    
    # Create white background
    bg_white = Image.new("RGBA", im_black.size, (255, 255, 255, 255))
    # Paste black icon using its own alpha channel as mask
    bg_white.paste(im_black, (0, 0), im_black)
    
    # Convert to RGB (strip alpha channel)
    icon_light = bg_white.convert("RGB")
    icon_light_path = os.path.join(assets_dir, "icon_light.png")
    icon_light.save(icon_light_path, "PNG")
    print(f"Saved light/opaque icon to {icon_light_path}")
    
    # 2. Copy/save dark and tinted icons
    im_white = Image.open(icon_white_path)
    
    icon_dark_path = os.path.join(assets_dir, "icon_dark.png")
    im_white.save(icon_dark_path, "PNG")
    print(f"Saved dark icon to {icon_dark_path}")
    
    icon_tinted_path = os.path.join(assets_dir, "icon_tinted.png")
    im_white.save(icon_tinted_path, "PNG")
    print(f"Saved tinted icon to {icon_tinted_path}")

if __name__ == "__main__":
    generate_icons()
