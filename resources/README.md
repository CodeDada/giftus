# Resources Directory

This directory contains static assets for the Giftus project.

## Structure

### images/

Stores all product images used in the Giftus e-commerce platform.

**Organization:**

- Product images should be organized by product ID or category
- Supported formats: JPG, PNG, WebP
- Recommended image dimensions: 1200x1200px (min 800x800px)

**Naming Convention:**

- Format: `{product-id}_{variant}_{sequence}.{ext}`
- Example: `001_red_1.jpg`, `001_red_2.jpg`, `002_blue_base.png`

**Note:** These images will typically be served through the API with URLs stored in the database.

---

For more details, see the API documentation in `giftusApi/EF_CORE_SETUP.md`
