# Bulk Upload Formats Comparison Guide

## Quick Comparison

| Feature | Standard Format | Matrix Format |
|---------|-----------------|---------------|
| **Endpoint** | `POST /api/bulkupload/upload` | `POST /api/bulkupload/upload-matrix` |
| **Products Per Row** | 1 | 2 |
| **Best For** | Traditional databases | Space-efficient catalogs |
| **Rows Per Product** | 1 | 3 (+ 1 separator) |
| **Column Structure** | Flat columns | Grouped columns |
| **Category Field** | Required | Auto-generated |
| **Price Format** | Flexible | "Rs. X,XXX" format |
| **GST Field** | Direct number | "HSN X GST Y%" format |
| **Image Rows** | Single URL per cell | Multiple rows per product |
| **Variants** | JSON array | Single Size variant |
| **Complexity** | Moderate | Simple |

---

## Standard Format Details

### When to Use
✅ Complex product data with multiple fields
✅ Variable number of variants per product
✅ Different category for each product
✅ Video URLs needed
✅ Need explicit product descriptions

### Template
```
Category  | ModelNo  | ProductName | Slug | Description | ImageUrl | GstPercent | Variants
----------|----------|-------------|------|-------------|----------|-----------|----------
Trophy    | TPHY001  | Gold Trophy | slug | Desc        | url      | 18        | [{"name":"Size","value":"10inch","price":500}]
```

### API Endpoint
```bash
curl -X POST http://localhost:5000/api/bulkupload/upload \
  -F "file=@products.xlsx"
```

### Response
```json
{
  "message": "Bulk upload completed",
  "summary": {
    "totalRows": 10,
    "successfulRows": 10,
    "failedRows": 0,
    "errors": []
  }
}
```

---

## Matrix Format Details

### When to Use
✅ Large product catalogs with 100+ items
✅ Multiple size variants per product
✅ Standard Indian pricing (Rs. format)
✅ Space-efficient Excel layout
✅ HSN/GST compliance needed

### Template Structure

```
Row 1 (Headers):
IMAGE | MODEL NO. | SIZE | Qty. | PRICE | Links | HSN/GST | ... | IMAGE | MODEL NO. | SIZE | Qty. | PRICE | Links | HSN/GST
      | (Col C)   |      |      |       |       |         |     |       | (Col K)   |      |      |       |       |

Row 2 (Product Data):
      | NWD-1     | 10"  | 29   | Rs. 1,500 | ... | HSN 3926 GST 18% | ... | NWD-2 | 11" | 29 | Rs. 1,420 | ... | HSN 3926 GST 18%

Row 3-4 (Image URLs):
[Image URLs] | ... | [Image URLs]

Row 5 (Empty Separator)

Row 6 (Next Product Set)
      | TPHY-1 | Small | 50 | Rs. 2,500 | ... | HSN 7018 GST 18% | ... | CRYS-1 | Medium | 75 | Rs. 3,200 | ... | HSN 7018 GST 18%
```

### Detailed Column Layout

**First Product (Columns B-H):**
- B: Image placeholder/URL
- C: ModelNo (e.g., NWD-1)
- D: Size (e.g., 10")
- E: Qty (e.g., 29)
- F: Price (e.g., Rs. 1,500)
- G: Links/References
- H: HSN/GST (e.g., HSN 3926 GST 18%)

**Image Rows (Columns B-H, rows 3-4):**
- B: Image URL 1
- G: Links/References
- Rows 3-4 contain actual URLs to download

**Second Product (Columns J-P):**
- J: Image placeholder/URL
- K: ModelNo
- L: Size
- M: Qty
- N: Price
- O: Links/References
- P: HSN/GST

### Data Processing

1. **ModelNo Parsing**
   - Input: "NWD-1"
   - Category: "NWD" (auto-extracted)
   - Creates category if doesn't exist

2. **Price Parsing**
   - Input: "Rs. 1,500"
   - Output: 1500 (decimal)
   - Removes: Rs., commas, spaces

3. **GST Extraction**
   - Input: "HSN 3926 GST 18%"
   - Output: 18 (decimal)
   - Creates product with GST 18%

4. **Variant Creation**
   - Name: "Size"
   - Value: From Size column (e.g., "10"")
   - Price: Parsed from Price column
   - StockQty: From Qty column

5. **Image Download**
   - Downloads from URLs in rows 3-4
   - Stores as: `{ModelNo}_base.{ext}`
   - Example: NWD-1_base.jpg

### API Endpoint
```bash
curl -X POST http://localhost:5000/api/bulkupload/upload-matrix \
  -F "file=@products_matrix.xlsx"
```

### Response
```json
{
  "message": "Bulk matrix upload completed",
  "summary": {
    "totalRows": 4,
    "successfulRows": 4,
    "failedRows": 0,
    "errors": []
  }
}
```

---

## Side-by-Side Example

### Same Products in Both Formats

#### Standard Format (1 row per product)
```
Category | ModelNo | ProductName    | Size | Price | HSN/GST
---------|---------|----------------|------|-------|----------
NWD      | NWD-1   | Napkin - 10in  | 10"  | 1500  | HST 3926 GST 18%
NWD      | NWD-2   | Napkin - 11in  | 11"  | 1420  | HST 3926 GST 18%
Trophy   | TPHY-1  | Trophy - Small | S    | 2500  | HSN 7018 GST 18%
Trophy   | CRYS-1  | Crystal - Med  | M    | 3200  | HSN 7018 GST 18%
```

#### Matrix Format (2 per row)
```
Row 1: [Headers]
Row 2: NWD-1, 10", 29, Rs.1500, HSN 3926 18% | NWD-2, 11", 29, Rs.1420, HSN 3926 18%
Row 3: [Image URLs] | [Image URLs]
Row 4: [More refs] | [More refs]
Row 5: [Empty]
Row 6: TPHY-1, S, 50, Rs.2500, HSN 7018 18% | CRYS-1, M, 75, Rs.3200, HSN 7018 18%
Row 7: [Image URLs] | [Image URLs]
Row 8: [More refs] | [More refs]
```

---

## Migration Guide

### Convert from Standard to Matrix Format

1. **Group products in pairs**
   - Product 1 and 2 → Row 2
   - Product 3 and 4 → Row 6
   - Product 5 and 6 → Row 10
   - And so on...

2. **Reorganize columns**
   - Standard columns: C(ModelNo), D(Size), E(Price), F(HSN/GST)
   - Matrix columns:
     - Product 1: B-H
     - Product 2: J-P

3. **Prepare image rows**
   - Rows 3-4: Image URLs for Product 1 and 2
   - Rows 7-8: Image URLs for Product 3 and 4
   - etc.

---

## Troubleshooting

### Standard Format Issues

| Error | Solution |
|-------|----------|
| "Category is required" | Add category column with values |
| "ModelNo is required" | Add ModelNo column, ensure unique |
| "Price parsing failed" | Use numeric format (e.g., 1500 not "Rs. 1500") |
| "Variants JSON invalid" | Use proper JSON format |

### Matrix Format Issues

| Error | Solution |
|-------|----------|
| "ModelNo is required" | Check column C for Product 1, K for Product 2 |
| "Size is required" | Check column D for Product 1, L for Product 2 |
| "Price parsing failed" | Ensure format is "Rs. X,XXX" or numeric |
| "GST extraction failed" | Use format "HSN XXXX GST YY%" or default used |
| "No data found" | Check rows 2, 6, 10, etc. contain data |

---

## Performance Comparison

### Standard Format
- Rows per file: 10,000 recommended
- Products per file: 10,000
- Typical time: 5-10 minutes

### Matrix Format
- Rows per file: 5,000 recommended (since 2 products per row)
- Products per file: 10,000
- Typical time: 5-10 minutes

---

## Choosing Between Formats

### Use Standard Format If:
- ✅ Each product has unique category
- ✅ Products have multiple variants (not just size)
- ✅ You have video URLs
- ✅ You have detailed descriptions
- ✅ You prefer flat structure

### Use Matrix Format If:
- ✅ All products have same GST
- ✅ Multiple size variants per product
- ✅ Space-efficient layout preferred
- ✅ Indian pricing (Rs. format)
- ✅ HSN compliance needed
- ✅ Large catalogs (100+ products)

---

## Examples

### Standard Format Complete Example
```
Category,ModelNo,ProductName,Slug,Description,ImageUrl,GstPercent,IsCustomizable
Trophy,TPHY001,Gold Trophy,gold-trophy,Premium award,https://example.com/gold.jpg,18,No
Crystal,CRYS001,Crystal Award,crystal-award,Elegant crystal,https://example.com/crystal.jpg,18,Yes
```

### Matrix Format Complete Example
```
[Row 2]
[Col C: TPHY-1][Col D: Small][Col E: 50][Col F: Rs. 2,500][Col H: HSN 7018 GST 18%] | [Col K: CRYS-1][Col L: M][Col M: 75][Col N: Rs. 3,200][Col P: HSN 7018 GST 18%]

[Row 3]
[Col B: https://example.com/trophy-1.jpg] | [Col J: https://example.com/crystal-1.jpg]

[Row 4]
[Col B: https://example.com/trophy-2.jpg] | [Col J: https://example.com/crystal-2.jpg]
```

---

## API Template Downloads

```bash
# Get Standard Format Template
curl http://localhost:5000/api/bulkupload/template -o template_standard.csv

# Get Matrix Format Template
curl http://localhost:5000/api/bulkupload/template-matrix -o template_matrix.txt
```

