import os
import django 

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ar_backend.settings')
django.setup()

from ar_service.models import Product, Category

def seed():
    # 1. Seed Categories
    categories_data = [
        {"name": "Furniture", "slug": "furniture", "description": "High-end ergonomic and accent chairs, sofas, tables."},
        {"name": "Lighting", "slug": "lighting", "description": "Handcrafted lamps and illumination fixtures."},
        {"name": "Outdoor", "slug": "outdoor", "description": "Patio, fire pit, and outdoor living products."},
        {"name": "Decor", "slug": "decor", "description": "Collectibles, tabletop decor, and spatial accessories."},
    ]

    cat_map = {}
    for c in categories_data:
        cat_obj, _ = Category.objects.update_or_create(
            name=c["name"],
            defaults={"slug": c["slug"], "description": c["description"]}
        )
        cat_map[c["name"]] = cat_obj
        print(f"Category ready: {cat_obj.name}")

    # 2. Seed Products
    products_to_seed = [
        {
            "product_id": "chair_exec_001",
            "name": "Ergonomic Office Chair",
            "description": "Ergonomic high-back office chair with adjustable armrests, mesh lumbar support, and adaptive tilt mechanism.",
            "material": "Breathable Mesh, Metal, High-Density Foam",
            "dimensions": "26\"W x 26\"D x 48\"H",
            "weight": "38 lbs",
            "assembly": "Required",
            "model_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb",
            "usdz_url": "https://developer.apple.com/augmented-reality/quick-look/models/chair/chair.usdz",
            "image_url": "https://images.unsplash.com/photo-1580481072645-022f9a6d8310?auto=format&fit=crop&w=600&q=80",
            "scale": 1.0,
            "surface_type": "floor",
            "category": cat_map.get("Furniture"),
            "price": 299.99,
            "is_featured": True
        },
        {
            "product_id": "chair_sheen_002",
            "name": "Designer Sheen Accent Chair",
            "description": "An elegant, luxurious modern accent chair upholstered in premium deep blue sheen fabric with gold brass legs.",
            "material": "Sheen Velvet Fabric, Polished Brass",
            "dimensions": "28\"W x 28\"D x 34\"H",
            "weight": "24 lbs",
            "assembly": "None",
            "model_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb",
            "image_url": "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80",
            "scale": 1.0,
            "surface_type": "floor",
            "category": cat_map.get("Furniture"),
            "price": 449.00,
            "is_featured": True
        },
        {
            "product_id": "sofa_leather_003",
            "name": "Luxury Wood Leather Sofa",
            "description": "A classic mid-century modern three-seater wood frame sofa upholstered in rich full-grain Italian leather.",
            "material": "Full-Grain Leather, Solid American Walnut",
            "dimensions": "84\"W x 34\"D x 32\"H",
            "weight": "120 lbs",
            "assembly": "Minimal",
            "model_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenWoodLeatherSofa/glTF-Binary/SheenWoodLeatherSofa.glb",
            "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80",
            "scale": 0.8,
            "surface_type": "floor",
            "category": cat_map.get("Furniture"),
            "price": 1299.50,
            "is_featured": True
        },
        {
            "product_id": "lamp_stained_004",
            "name": "Tiffany Stained Glass Lamp",
            "description": "Exquisite handcrafted stained-glass table lamp with intricate floral patterns and vintage copper finish base.",
            "material": "Handcut Glass, Copper, Bronze",
            "dimensions": "16\"W x 16\"D x 24\"H",
            "weight": "12 lbs",
            "assembly": "None",
            "model_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Lantern/glTF-Binary/Lantern.glb",
            "usdz_url": "https://developer.apple.com/augmented-reality/quick-look/models/chair/chair.usdz",
            "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80",
            "scale": 1.2,
            "surface_type": "tabletop",
            "category": cat_map.get("Lighting"),
            "price": 185.00,
            "is_featured": False
        },
        {
            "product_id": "pit_copper_005",
            "name": "Vintage Copper Fire Pit",
            "description": "Heavy-duty outdoor copper fire pit with hand-hammered texture and thick cast iron support stand.",
            "material": "Hammered Copper, Cast Iron",
            "dimensions": "32\"W x 32\"D x 20\"H",
            "weight": "45 lbs",
            "assembly": "Minimal",
            "model_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/PotOfCoals/glTF-Binary/PotOfCoals.glb",
            "image_url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80",
            "scale": 1.0,
            "surface_type": "floor",
            "category": cat_map.get("Outdoor"),
            "price": 320.00,
            "is_featured": False
        },
        {
            "product_id": "car_toy_006",
            "name": "Retro Wooden Toy Car",
            "description": "A beautifully hand-crafted classic wooden toy car with rotating wheels, finished with non-toxic, eco-friendly lacquer.",
            "material": "Solid Maple Wood, Non-toxic Varnish",
            "dimensions": "12\"W x 6\"D x 5\"H",
            "weight": "3 lbs",
            "assembly": "None",
            "model_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ToyCar/glTF-Binary/ToyCar.glb",
            "image_url": "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80",
            "scale": 1.5,
            "surface_type": "tabletop",
            "category": cat_map.get("Decor"),
            "price": 65.00,
            "is_featured": False
        }
    ]

    for p_data in products_to_seed:
        product, created = Product.objects.update_or_create(
            product_id=p_data["product_id"],
            defaults={
                "name": p_data["name"],
                "description": p_data["description"],
                "material": p_data["material"],
                "dimensions": p_data["dimensions"],
                "weight": p_data["weight"],
                "assembly": p_data["assembly"],
                "model_url": p_data["model_url"],
                "usdz_url": p_data.get("usdz_url", ""),
                "image_url": p_data["image_url"],
                "scale": p_data["scale"],
                "surface_type": p_data["surface_type"],
                "category": p_data["category"],
                "price": p_data["price"],
                "is_featured": p_data["is_featured"]
            }
        )
        if created:
            print(f"Created product: {product.name}")
        else:
            print(f"Updated product: {product.name}")

if __name__ == "__main__":
    seed()

