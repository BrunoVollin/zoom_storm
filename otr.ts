import { IProduct } from "./products";

const productInstance: IProduct = {
  name: "Premium Cotton Minimalist T-Shirt",
  brand: "Everwear Co.",
  short_description: "A breathable, 100% organic cotton t-shirt built for daily comfort.",
  detailed_description: "Crafted from ethically sourced organic cotton, this t-shirt features a modern tailored fit, reinforced crewneck stitching, and pre-shrunk fabric to prevent shrinking in the wash.",
  category: "Apparel",
  subcategory: "Men's Tops",
  meta_title: "Premium Cotton Minimalist T-Shirt | Everwear Co.",
  meta_description: "Shop our premium 100% organic cotton minimalist t-shirt. Durable, breathable, and ethically made. Free shipping available.",
  tags: ["t-shirt", "organic cotton", "minimalist fashion", "mens clothing", "essential"],
  technical_spec: {
    material: "100% Organic Cotton",
    warranty_months: 3,
    country_of_origin: "Portugal",
    washing_instructions: "Machine wash cold, tumble dry low"
  },
  images: [
    {
      image_url: "https://myshop.com",
      display_order: 1,
      is_main: true
    },
    {
      image_url: "https://myshop.com",
      display_order: 2,
      is_main: false
    }
  ],
  variants: [
    {
      sku: "EVR-TS-BLK-MD",
      barcode_ean: "7891234567890",
      color: "Matte Black",
      size_voltage_flavor: "Medium",
      cost_price: 8.50,
      sale_price: 29.99,
      promotional_price: 24.99, // Active discount
      stock_quantity: 45,
      weight_grams: 180,
      height_cm: 2,
      width_cm: 20,
      depth_cm: 25
    },
    {
      sku: "EVR-TS-BLK-LG",
      barcode_ean: "7891234567891",
      color: "Matte Black",
      size_voltage_flavor: "Large",
      cost_price: 9.00,
      sale_price: 29.99,
      stock_quantity: 30,
      weight_grams: 200,
      height_cm: 2,
      width_cm: 20,
      depth_cm: 25
    }
  ]
};
