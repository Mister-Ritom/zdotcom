from PIL import Image
import os

def fix_tinted_icon():
    white_icon_path = "/Users/ritom/Projects/z/native/assets/images/icon_white.png"
    target_tinted_path = "/Users/ritom/Projects/z/native/ios/Z/Images.xcassets/AppIcon.appiconset/App-Icon-tinted-1024x1024@1x.png"
    
    if os.path.exists(white_icon_path):
        print(f"Resizing {white_icon_path} to 1024x1024 for tinted app icon...")
        img = Image.open(white_icon_path)
        img_resized = img.resize((1024, 1024), Image.Resampling.LANCZOS)
        img_resized.save(target_tinted_path, "PNG")
        print(f"Successfully saved transparent tinted icon to {target_tinted_path}")
    else:
        print("icon_white.png not found")

if __name__ == "__main__":
    fix_tinted_icon()
