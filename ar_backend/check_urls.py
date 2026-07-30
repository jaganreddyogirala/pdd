import os
import django
import urllib.request

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ar_backend.settings')
django.setup()

from ar_service.models import Product

products = Product.objects.all()
print(f"Total Products in Database: {products.count()}\n")

for p in products:
    glb_url = p.get_model_display_url()
    usdz_url = p.get_usdz_display_url()
    print(f"Product ID: {p.product_id}")
    print(f"  Name: {p.name}")
    print(f"  GLB URL: {glb_url}")
    print(f"  USDZ URL: {usdz_url}")

    if glb_url and glb_url.startswith('http'):
        try:
            req = urllib.request.Request(glb_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as res:
                print(f"  GLB HTTP Status: {res.status}")
        except Exception as e:
            print(f"  GLB HTTP Check Note: {e}")

    if usdz_url and usdz_url.startswith('http'):
        try:
            req = urllib.request.Request(usdz_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as res:
                print(f"  USDZ HTTP Status: {res.status}")
        except Exception as e:
            print(f"  USDZ HTTP Check Note: {e}")

    print("-" * 50)
