from PIL import Image, ImageDraw, ImageFont

def create_icon(size):
    img = Image.new('RGB', (size, size), color='#1565c0')
    draw = ImageDraw.Draw(img)
    scale = size / 128
    
    radius = int(20 * scale)
    draw.rounded_rectangle([(0, 0), (size, size)], radius=radius, fill='#1565c0')
    
    bar_width = int(64 * scale)
    bar_height = max(int(10 * scale), 2)
    spacing = int(16 * scale)
    start_y = int(28 * scale)
    start_x = int(28 * scale)
    
    widths = [bar_width, bar_width, int(48 * scale), int(56 * scale), int(52 * scale)]
    
    for i, width in enumerate(widths):
        draw.rectangle([start_x, start_y + i * spacing, start_x + width, start_y + i * spacing + bar_height], fill='#ffffff', outline='#e3f2fd', width=max(int(1 * scale), 1))
    
    circle_size = int(18 * scale)
    circle_x = size - int(28 * scale)
    circle_y = size - int(28 * scale)
    
    draw.ellipse([circle_x - circle_size, circle_y - circle_size, circle_x + circle_size, circle_y + circle_size], fill='#2e7d32', outline='#ffffff', width=max(int(2 * scale), 1))
    
    check_width = max(int(4 * scale), 2)
    check_points = [
        (circle_x - int(10 * scale), circle_y),
        (circle_x - int(3 * scale), circle_y + int(7 * scale)),
        (circle_x + int(10 * scale), circle_y - int(7 * scale))
    ]
    draw.line([check_points[0], check_points[1], check_points[2]], fill='#ffffff', width=check_width)
    
    return img

if __name__ == '__main__':
    try:
        for size in [16, 48, 128]:
            icon = create_icon(size)
            icon.save(f'icons/icon{size}.png')
            print(f'已生成 icon{size}.png')
    except ImportError:
        print('請先安裝 Pillow: pip install Pillow')
    except Exception as e:
        print(f'錯誤: {e}')

