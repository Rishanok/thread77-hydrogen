#!/usr/bin/env python3
"""
Thread77 Shopify Admin Catalog Generator
This script creates streetwear products and collections directly in your Shopify store.

Usage:
  python3 scripts/import_to_shopify.py <SHOPIFY_ADMIN_ACCESS_TOKEN>

Example:
  python3 scripts/import_to_shopify.py shpat_xxxxxxx
"""

import sys
import json
import urllib.request
import urllib.error

SHOP_DOMAIN = "ja1kvi-ri.myshopify.com"
API_VERSION = "2025-01"

PRODUCTS_TO_CREATE = [
    {
        "title": "Cotton Cuffed Jogger — Pink Frost",
        "descriptionHtml": "<p>Constructed from custom-milled 380 GSM organic french terry with deep side slash pockets, ribbed ankle cuffs, and matte black heavy drawstring tips.</p>",
        "vendor": "Thread77",
        "productType": "Bottoms",
        "tags": ["streetwear", "joggers", "heavyweight", "new-arrival"],
        "price": "2899.00",
        "compareAtPrice": "3499.00",
        "imageUrl": "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=1000&q=85",
        "sizes": ["S", "M", "L", "XL", "XXL"]
    },
    {
        "title": "450 GSM Heavyweight Boxy Hoodie — Onyx",
        "descriptionHtml": "<p>Double-layered unstructured hood, dropped shoulders, and ultra-dense cotton fleece. Built to maintain structural silhouette wash after wash.</p>",
        "vendor": "Thread77",
        "productType": "Hoodies",
        "tags": ["streetwear", "hoodies", "heavyweight", "bestseller"],
        "price": "3499.00",
        "compareAtPrice": "4299.00",
        "imageUrl": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=85",
        "sizes": ["S", "M", "L", "XL", "XXL"]
    },
    {
        "title": "260 GSM Raw Edge Oversized Tee — Chalk",
        "descriptionHtml": "<p>Raw-cut drop shoulder hem, thick 1.25\" rib collar, and combed compact cotton.</p>",
        "vendor": "Thread77",
        "productType": "Tops",
        "tags": ["streetwear", "tees", "oversized", "essential"],
        "price": "1899.00",
        "compareAtPrice": "2499.00",
        "imageUrl": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=85",
        "sizes": ["S", "M", "L", "XL", "XXL"]
    },
    {
        "title": "Vintage Wash Wide Cargo Pant — Charcoal",
        "descriptionHtml": "<p>Enzyme-washed ripstop cotton featuring ergonomic 3D bellowed pockets and knee articulation darts.</p>",
        "vendor": "Thread77",
        "productType": "Bottoms",
        "tags": ["streetwear", "cargo", "vintage", "limited-drop"],
        "price": "3299.00",
        "compareAtPrice": "3999.00",
        "imageUrl": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=85",
        "sizes": ["S", "M", "L", "XL", "XXL"]
    }
]

def execute_graphql(query, variables, token):
    url = f"https://{SHOP_DOMAIN}/admin/api/{API_VERSION}/graphql.json"
    headers = {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token
    }
    data = json.dumps({"query": query, "variables": variables}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
        return None

def create_product(prod_data, token):
    mutation = """
    mutation productCreate($input: ProductInput!, $media: [CreateMediaInput!]) {
      productCreate(input: $input, media: $media) {
        product {
          id
          title
          handle
        }
        userErrors {
          field
          message
        }
      }
    }
    """
    variables = {
        "input": {
            "title": prod_data["title"],
            "bodyHtml": prod_data["descriptionHtml"],
            "vendor": prod_data["vendor"],
            "productType": prod_data["productType"],
            "tags": prod_data["tags"],
            "status": "ACTIVE"
        },
        "media": [
            {
                "originalSource": prod_data["imageUrl"],
                "mediaContentType": "IMAGE"
            }
        ]
    }
    res = execute_graphql(mutation, variables, token)
    if res and "data" in res and res["data"]["productCreate"]["product"]:
        p = res["data"]["productCreate"]["product"]
        print(f"✓ Created product: {p['title']} ({p['id']})")
        return p
    else:
        print(f"✗ Failed to create {prod_data['title']}: {res}")
        return None

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/import_to_shopify.py <SHOPIFY_ADMIN_ACCESS_TOKEN>")
        print("Tip: You can also import 'thread77-products-import.csv' directly via Shopify Admin > Products > Import")
        sys.exit(1)

    token = sys.argv[1].strip()
    print(f"Connecting to {SHOP_DOMAIN} using provided Admin Token...")
    for prod in PRODUCTS_TO_CREATE:
        create_product(prod, token)
    print("\n✓ Finished creating products! Remember to ensure 'Hydrogen: Thread77' sales channel is active on them.")

if __name__ == "__main__":
    main()
