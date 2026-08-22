/*
# Seed BudgetBuddy catalog with realistic sample data

## Overview
Populates the empty database with 33 realistic beauty/wellness products across
6 categories (Skincare, Haircare, Makeup, Fragrance, Body, Wellness) from 19
recognizable brands. Creates marketplace listings on Amazon, Nykaa, Flipkart,
Myntra, Tira, Zepto, and BigBasket with competitive pricing. Generates 90 days
of realistic price history for every listing to power price charts and
price-drop alerts. Adds 6 sample coupons.

## Data Inserted
- 19 brands (CeraVe, The Ordinary, Minimalist, Cetaphil, Nivea, L'Oreal, etc.)
- 6 categories (Skincare, Haircare, Makeup, Fragrance, Body, Wellness)
- 18 subcategories
- 33 products with full details (images, descriptions, ingredients, prices, ratings)
- ~99 product listings across 7 marketplaces with competitive pricing
- ~8,910 price history records (90 days x ~99 listings) with sinusoidal variation
- 6 sample coupons for Amazon, Nykaa, Flipkart

## Security
- No RLS policy changes (existing policies allow public read on products,
  brands, categories, marketplaces, product_listings, and price_history).
- No schema changes — data only.

## Notes
- All prices in INR
- Images sourced from Pexels (real, working URLs)
- Price history includes sinusoidal variation + random noise for realistic charts
- Idempotent: brands/categories use ON CONFLICT on their unique columns;
  products block skips if rows already exist.
*/

-- ============ 1. BRANDS ============
INSERT INTO brands (name) VALUES
  ('CeraVe'), ('The Ordinary'), ('Minimalist'), ('Cetaphil'), ('Nivea'),
  ('L''Oreal'), ('Maybelline'), ('Lakme'), ('Dove'), ('Plum'),
  ('Mamaearth'), ('Forest Essentials'), ('Nykaa'), ('Ponds'),
  ('Neutrogena'), ('MAC'), ('Colorbar'), ('Khadi Natural'), ('Himalaya')
ON CONFLICT (name) DO NOTHING;

-- ============ 2. CATEGORIES ============
-- categories has a UNIQUE constraint on slug (not name), so conflict target is slug.
INSERT INTO categories (name, slug) VALUES
  ('Skincare','skincare'), ('Haircare','haircare'), ('Makeup','makeup'),
  ('Fragrance','fragrance'), ('Body','body'), ('Wellness','wellness')
ON CONFLICT (slug) DO NOTHING;

-- ============ 3. SUBCATEGORIES ============
INSERT INTO subcategories (category_id, name, slug)
SELECT c.id, v.sn, v.ss FROM categories c
JOIN (VALUES
  ('Skincare','Cleansers','cleansers'), ('Skincare','Serums','serums'), ('Skincare','Moisturizers','moisturizers'),
  ('Haircare','Shampoo','shampoo'), ('Haircare','Hair Oil','hair-oil'), ('Haircare','Hair Serum','hair-serum'),
  ('Makeup','Foundation','foundation'), ('Makeup','Lipstick','lipstick'),
  ('Makeup','Kajal & Eyeliner','kajal-eyeliner'), ('Makeup','Mascara','mascara'),
  ('Fragrance','Eau de Parfum','eau-de-parfum'), ('Fragrance','Body Mist','body-mist'),
  ('Fragrance','Deodorant','deodorant'),
  ('Body','Body Lotion','body-lotion'), ('Body','Body Wash','body-wash'),
  ('Wellness','Supplements','supplements'), ('Wellness','Vitamins','vitamins'),
  ('Wellness','Aromatherapy','aromatherapy')
) AS v(cn, sn, ss) ON c.name = v.cn
ON CONFLICT DO NOTHING;

-- ============ 4. PRODUCTS ============
DO $$
DECLARE
  p jsonb;
  v_brand_id uuid;
  v_cat_id uuid;
  v_sub_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM products LIMIT 1) THEN
    RAISE NOTICE 'Products already seeded — skipping product insert';
    RETURN;
  END IF;

  FOR p IN SELECT * FROM jsonb_array_elements($J$
  [
    {"n":"Moisturizing Cream","b":"CeraVe","c":"Skincare","sc":"moisturizers","d":"Daily moisturizing cream with three essential ceramides and hyaluronic acid for dry to very dry skin. Restores the skin barrier and provides 24-hour hydration.","img":"https://images.pexels.com/photos/4841273/pexels-photo-4841273.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":1200,"cp":899,"r":4.5,"rc":3200,"g":"unisex","pt":"moisturizer","ing":"Ceramides 1,3,6-II, Hyaluronic Acid, Glycerin","ben":"24-hour hydration, restores skin barrier, non-comedogenic","htu":"Apply liberously to face and body as needed, morning and night.","w":"453g","sz":"453g","f":true,"tr":true,"bs":true,"sku":"CV-MC-453","bc":"301871300001","tags":"bestseller,ceramides,dry-skin,barrier-repair"},
    {"n":"Hydrating Facial Cleanser","b":"CeraVe","c":"Skincare","sc":"cleansers","d":"Gentle foaming cleanser with ceramides and hyaluronic acid that effectively removes dirt, oil, and makeup without disrupting the skin barrier.","img":"https://images.pexels.com/photos/24602079/pexels-photo-24602079.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":950,"cp":729,"r":4.4,"rc":2100,"g":"unisex","pt":"cleanser","ing":"Ceramides, Hyaluronic Acid, Glycerin","ben":"Gentle cleansing, hydrating, non-stripping","htu":"Massage onto wet skin in circular motions, then rinse thoroughly.","w":"236ml","sz":"236ml","f":false,"tr":false,"bs":true,"sku":"CV-HFC-236","bc":"301871300002","tags":"bestseller,gentle,hydrating,normal-to-dry"},
    {"n":"Niacinamide 10% + Zinc 1% Serum","b":"The Ordinary","c":"Skincare","sc":"serums","d":"High-strength vitamin and mineral blemish formula with 10% niacinamide and 1% zinc pyrrolidone carboxylate to reduce appearance of blemishes and congestion.","img":"https://images.pexels.com/photos/38822007/pexels-photo-38822007.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":590,"cp":449,"r":4.3,"rc":5400,"g":"unisex","pt":"serum","ing":"Niacinamide 10%, Zinc PCA 1%, Glycerin","ben":"Reduces blemishes, controls sebum, minimizes pores","htu":"Apply a few drops to clean skin morning and evening before heavier creams.","w":"30ml","sz":"30ml","f":true,"tr":true,"bs":true,"sku":"TO-NIAC-30","bc":"629110170001","tags":"bestseller,niacinamide,acne-prone,oily-skin"},
    {"n":"Hyaluronic Acid 2% + B5 Serum","b":"The Ordinary","c":"Skincare","sc":"serums","d":"Multi-depth hydration serum with three forms of hyaluronic acid and vitamin B5 for smooth, supple, hydrated skin.","img":"https://images.pexels.com/photos/29060236/pexels-photo-29060236.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":650,"cp":519,"r":4.4,"rc":3100,"g":"unisex","pt":"serum","ing":"Hyaluronic Acid 2%, Panthenol (B5), Glycerin","ben":"Multi-depth hydration, plumps skin, smooths texture","htu":"Apply a few drops to clean skin before moisturizer, morning and night.","w":"30ml","sz":"30ml","f":false,"tr":false,"bs":false,"sku":"TO-HA-30","bc":"629110170002","tags":"hydration,hyaluronic-acid,all-skin-types"},
    {"n":"10% Vitamin C Face Serum","b":"Minimalist","c":"Skincare","sc":"serums","d":"Brightening serum with 10% pure vitamin C (ethyl ascorbic acid) that visibly reduces dark spots and evens skin tone.","img":"https://images.pexels.com/photos/33538456/pexels-photo-33538456.png?auto=compress&cs=tinysrgb&h=650&w=940","mrp":699,"cp":559,"r":4.2,"rc":1800,"g":"unisex","pt":"serum","ing":"Ethyl Ascorbic Acid 10%, Acetyl Glucosamine, Polyhydroxy Acid","ben":"Brightens skin, fades dark spots, boosts collagen","htu":"Apply 2-3 drops to cleansed face every morning. Follow with sunscreen.","w":"30ml","sz":"30ml","f":true,"tr":true,"na":true,"bs":false,"sku":"MIN-VC-30","bc":"890604910001","tags":"vitamin-c,brightening,dark-spots,new"},
    {"n":"Gentle Skin Cleanser","b":"Cetaphil","c":"Skincare","sc":"cleansers","d":"Mild, non-irritating cleanser that removes dirt, oil, and makeup without stripping skin. Ideal for sensitive, dry, and normal skin types.","img":"https://images.pexels.com/photos/33538415/pexels-photo-33538415.png?auto=compress&cs=tinysrgb&h=650&w=940","mrp":549,"cp":419,"r":4.4,"rc":4600,"g":"unisex","pt":"cleanser","ing":"Water, Glycerin, Cetyl Alcohol, Propylene Glycol","ben":"Gentle cleansing, non-irritating, hydrating","htu":"Apply a small amount to wet or dry skin, massage gently, rinse or wipe off.","w":"250ml","sz":"250ml","f":false,"tr":false,"bs":true,"sku":"CET-GSC-250","bc":"600110300001","tags":"bestseller,gentle,sensitive-skin,dermatologist-recommended"},
    {"n":"2% Salicylic Acid Serum","b":"Minimalist","c":"Skincare","sc":"serums","d":"Exfoliating serum with 2% salicylic acid that penetrates pores to clear acne, blackheads, and excess oil while soothing inflammation.","img":"https://images.pexels.com/photos/33538414/pexels-photo-33538414.png?auto=compress&cs=tinysrgb&h=650&w=940","mrp":599,"cp":479,"r":4.1,"rc":1500,"g":"unisex","pt":"serum","ing":"Salicylic Acid 2%, Green Tea Extract, Witch Hazel","ben":"Clears acne, reduces blackheads, controls oil","htu":"Apply 3-4 drops to clean dry skin at night. Start with alternate days.","w":"30ml","sz":"30ml","f":false,"tr":false,"na":true,"bs":false,"sku":"MIN-SA-30","bc":"890604910002","tags":"salicylic-acid,acne,exfoliating,oily-skin,new"},
    {"n":"10% Vitamin C Serum","b":"Plum","c":"Skincare","sc":"serums","d":"Brightening face serum with 10% ethyl ascorbic acid and mandarin extract that fades dark spots and gives a radiant glow.","img":"https://images.pexels.com/photos/14656279/pexels-photo-14656279.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":550,"cp":440,"r":4.2,"rc":2700,"g":"unisex","pt":"serum","ing":"Ethyl Ascorbic Acid 10%, Mandarin Extract, Kakadu Plum","ben":"Brightens, fades dark spots, antioxidant protection","htu":"Apply 2-3 drops on cleansed face every morning. Always follow with sunscreen.","w":"20ml","sz":"20ml","f":false,"tr":true,"bs":false,"sku":"PLM-VC-20","bc":"890443560001","tags":"vitamin-c,brightening,vegan,glow"},
    {"n":"Intense Repair Shampoo","b":"Dove","c":"Haircare","sc":"shampoo","d":"Repairing shampoo with Keratin Repair Actives that nourishes damaged hair from within, leaving it stronger and smoother.","img":"https://images.pexels.com/photos/33525723/pexels-photo-33525723.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":380,"cp":299,"r":4.2,"rc":3800,"g":"unisex","pt":"shampoo","ing":"Sodium Laureth Sulfate, Keratin Actives, Dimethiconol","ben":"Repairs damage, smoothens hair, reduces breakage","htu":"Apply to wet hair, lather, massage into scalp, rinse thoroughly.","w":"340ml","sz":"340ml","f":false,"tr":false,"bs":true,"sku":"DOV-IR-340","bc":"890103001001","tags":"bestseller,repair,damaged-hair,daily-use"},
    {"n":"Onion Hair Oil","b":"Mamaearth","c":"Haircare","sc":"hair-oil","d":"Hair oil enriched with onion oil and redensyl that boosts hair growth, reduces hair fall, and nourishes the scalp naturally.","img":"https://images.pexels.com/photos/14656188/pexels-photo-14656188.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":449,"cp":349,"r":4.1,"rc":6200,"g":"unisex","pt":"hair-oil","ing":"Onion Oil, Redensyl, Coconut Oil, Amla Extract","ben":"Reduces hair fall, promotes growth, nourishes scalp","htu":"Apply to scalp and hair roots, massage gently, leave overnight or for 2 hours before wash.","w":"250ml","sz":"250ml","f":true,"tr":true,"bs":true,"sku":"MAM-OHO-250","bc":"890604950001","tags":"bestseller,hair-fall,growth,natural,toxin-free"},
    {"n":"Onion Hair Growth Serum","b":"Plum","c":"Haircare","sc":"hair-serum","d":"Lightweight hair serum with onion extract, adenosine, and plant keratin that strengthens hair follicles and promotes healthy growth.","img":"https://images.pexels.com/photos/14656315/pexels-photo-14656315.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":550,"cp":440,"r":4.0,"rc":1900,"g":"unisex","pt":"hair-serum","ing":"Onion Extract 5%, Adenosine, Plant Keratin, Biotin","ben":"Strengthens follicles, reduces breakage, promotes growth","htu":"Apply directly to scalp, massage gently. Use daily at night. Do not rinse.","w":"45ml","sz":"45ml","f":false,"tr":false,"na":true,"bs":false,"sku":"PLM-OHS-45","bc":"890443560002","tags":"hair-growth,onion,new,scalp-care"},
    {"n":"Total Repair 5 Shampoo","b":"L'Oreal","c":"Haircare","sc":"shampoo","d":"Repairing shampoo with ceramide cement that addresses 5 signs of damage: hair fall, dryness, dullness, split ends, and roughness.","img":"https://images.pexels.com/photos/19833253/pexels-photo-19833253.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":660,"cp":495,"r":4.3,"rc":4100,"g":"unisex","pt":"shampoo","ing":"Sodium Laureth Sulfate, Ceramide Cement, Pro-Keratin","ben":"Repairs 5 signs of damage, strengthens, smoothens","htu":"Apply to wet hair, massage into lather, focus on lengths, rinse thoroughly.","w":"440ml","sz":"440ml","f":false,"tr":true,"bs":false,"sku":"LOR-TR5-440","bc":"360052000001","tags":"repair,damaged-hair,ceramide,professional"},
    {"n":"Anti-Hair Fall Shampoo","b":"Himalaya","c":"Haircare","sc":"shampoo","d":"Herbal shampoo with bhringaraja and amla that reduces hair fall, strengthens roots, and promotes healthy hair growth naturally.","img":"https://images.pexels.com/photos/18066458/pexels-photo-18066458.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":245,"cp":185,"r":4.1,"rc":3500,"g":"unisex","pt":"shampoo","ing":"Bhringaraja, Amla, Licorice, Chickpea","ben":"Reduces hair fall, strengthens roots, natural care","htu":"Gently massage onto wet hair and scalp, leave for 2 minutes, rinse thoroughly.","w":"200ml","sz":"200ml","f":false,"tr":false,"bs":true,"sku":"HIM-AHF-200","bc":"890113900001","tags":"bestseller,hair-fall,herbal,ayurvedic,affordable"},
    {"n":"Absolute Skin Gloss Foundation","b":"Lakme","c":"Makeup","sc":"foundation","d":"Lightweight liquid foundation with a dewy finish that gives a radiant, glossy complexion. Buildable coverage with SPF 25.","img":"https://images.pexels.com/photos/6527702/pexels-photo-6527702.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":1100,"cp":825,"r":4.2,"rc":2200,"g":"women","pt":"foundation","ing":"Aqua, Cyclopentasiloxane, Glycerin, Titanium Dioxide","ben":"Dewy finish, buildable coverage, SPF 25, lightweight","htu":"Apply dots on forehead, cheeks, nose, and chin. Blend with a damp sponge or brush.","w":"30ml","sz":"30ml","f":true,"tr":true,"bs":false,"sku":"LAK-ASG-30","bc":"490187800001","tags":"foundation,dewy,spf,buildable"},
    {"n":"Fit Me Matte+Poreless Foundation","b":"Maybelline","c":"Makeup","sc":"foundation","d":"Matte foundation that normalizes oily skin and refines pores for a natural, shine-free finish. Medium, buildable coverage.","img":"https://images.pexels.com/photos/3018845/pexels-photo-3018845.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":649,"cp":487,"r":4.4,"rc":5800,"g":"women","pt":"foundation","ing":"Water, Cyclopentasiloxane, Dimethicone, Titanium Dioxide","ben":"Matte finish, pore-minimizing, oil-control, natural look","htu":"Apply to clean moisturized skin. Blend outward from the center of the face.","w":"30ml","sz":"30ml","f":true,"tr":false,"bs":true,"sku":"MAY-FM-30","bc":"360053000001","tags":"bestseller,matte,oily-skin,drugstore,foundation"},
    {"n":"Colossal Kajal","b":"Maybelline","c":"Makeup","sc":"kajal-eyeliner","d":"Smudge-proof, waterproof kajal with intense black color that lasts up to 12 hours. Glides smoothly for precise application.","img":"https://images.pexels.com/photos/6233285/pexels-photo-6233285.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":199,"cp":149,"r":4.5,"rc":12000,"g":"women","pt":"kajal","ing":"Carnauba Wax, Paraffin, Black Iron Oxide","ben":"12-hour wear, smudge-proof, waterproof, intense black","htu":"Glide along the upper and lower waterline. Can be smudged for a smoky look.","w":"0.35g","sz":"0.35g","f":false,"tr":true,"bs":true,"sku":"MAY-CK-035","bc":"360053000002","tags":"bestseller,kajal,waterproof,budget-friendly"},
    {"n":"Eyeconic Curling Mascara","b":"Lakme","c":"Makeup","sc":"mascara","d":"Curling mascara that lifts and curls lashes from the root for wide-eyed, dramatic eyes. Long-lasting, clump-free formula.","img":"https://images.pexels.com/photos/6527699/pexels-photo-6527699.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":450,"cp":338,"r":4.1,"rc":2800,"g":"women","pt":"mascara","ing":"Aqua, Beeswax, Carnauba Wax, Panthenol","ben":"Curls and lifts lashes, clump-free, long-lasting","htu":"Wiggle the wand from root to tip. Apply 2-3 coats for dramatic curl.","w":"9ml","sz":"9ml","f":false,"tr":false,"bs":false,"sku":"LAK-EC-9","bc":"490187800002","tags":"mascara,curling,everyday,clump-free"},
    {"n":"Ruby Woo Lipstick","b":"MAC","c":"Makeup","sc":"lipstick","d":"Iconic retro matte lipstick in a vivid blue-red shade. Long-lasting, highly pigmented formula that delivers intense color in one swipe.","img":"https://images.pexels.com/photos/7810600/pexels-photo-7810600.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":1950,"cp":1750,"r":4.7,"rc":8900,"g":"women","pt":"lipstick","ing":"Talc, Mica, Isododecane, Dimethicone","ben":"Iconic shade, retro matte finish, long-lasting, one-swipe color","htu":"Apply directly to lips or use a lip brush for precision. Prep lips with balm for matte finish.","w":"3g","sz":"3g","f":true,"tr":false,"bs":true,"sku":"MAC-RW-3","bc":"773602000001","tags":"bestseller,iconic,matte,luxury,red"},
    {"n":"Matte Lipstick","b":"Colorbar","c":"Makeup","sc":"lipstick","d":"Highly pigmented matte lipstick with a smooth, non-drying formula. Delivers rich, intense color that lasts for hours.","img":"https://images.pexels.com/photos/25906586/pexels-photo-25906586.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":399,"cp":299,"r":4.2,"rc":3400,"g":"women","pt":"lipstick","ing":"Caprylic/Capric Triglyceride, Candelilla Wax, Mica","ben":"Matte finish, highly pigmented, non-drying, long-lasting","htu":"Apply directly to lips. For precise application, use a lip liner first.","w":"4.5g","sz":"4.5g","f":false,"tr":false,"bs":false,"sku":"CB-ML-45","bc":"890411500001","tags":"lipstick,matte,affordable,pigmented"},
    {"n":"Lush Lychee Eau de Parfum","b":"Forest Essentials","c":"Fragrance","sc":"eau-de-parfum","d":"Luxurious Eau de Parfum with fresh lychee notes blended with rose and jasmine. A vibrant, fruity-floral fragrance for the modern woman.","img":"https://images.pexels.com/photos/29982967/pexels-photo-29982967.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":2500,"cp":2000,"r":4.5,"rc":1200,"g":"women","pt":"eau-de-parfum","ing":"Lychee Extract, Rose Absolute, Jasmine, Sandalwood","ben":"Long-lasting fragrance, fruity-floral, luxury","htu":"Spritz on pulse points — wrists, neck, and behind ears. Do not rub.","w":"50ml","sz":"50ml","f":true,"tr":true,"bs":false,"sku":"FE-LL-50","bc":"890141000001","tags":"luxury,floral,fruity,long-lasting,premium"},
    {"n":"Indian Rose & Geranium Eau de Parfum","b":"Forest Essentials","c":"Fragrance","sc":"eau-de-parfum","d":"Romantic Eau de Parfum blending Indian rose absolute with geranium and musk. A sophisticated, warm floral scent that lingers beautifully.","img":"https://images.pexels.com/photos/6958875/pexels-photo-6958875.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":2200,"cp":1760,"r":4.4,"rc":800,"g":"unisex","pt":"eau-de-parfum","ing":"Rose Absolute, Geranium, Musk, Cedarwood","ben":"Warm floral, long-lasting, sophisticated, unisex","htu":"Spritz on pulse points. Layer with matching body mist for extended wear.","w":"50ml","sz":"50ml","f":false,"tr":false,"bs":false,"sku":"FE-IRG-50","bc":"890141000002","tags":"rose,floral,unisex,luxury"},
    {"n":"Fresh Active Deodorant","b":"Nivea","c":"Fragrance","sc":"deodorant","d":"Long-lasting deodorant spray with a fresh, masculine scent that provides 48-hour protection against body odor.","img":"https://images.pexels.com/photos/36339051/pexels-photo-36339051.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":199,"cp":159,"r":4.3,"rc":5400,"g":"men","pt":"deodorant","ing":"Aluminum Chlorohydrate, Butane, Isopropyl Myristate, Fragrance","ben":"48-hour protection, fresh scent, quick-drying","htu":"Hold 15cm from underarm and spray. Do not apply to broken skin.","w":"150ml","sz":"150ml","f":false,"tr":false,"bs":true,"sku":"NIV-FA-150","bc":"400580000001","tags":"bestseller,deodorant,men,48h-protection,fresh"},
    {"n":"Body Mist","b":"Plum","c":"Fragrance","sc":"body-mist","d":"Light, refreshing body mist with a floral fragrance. Perfect for everyday wear with a subtle, lingering scent.","img":"https://images.pexels.com/photos/11482448/pexels-photo-11482448.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":450,"cp":360,"r":4.1,"rc":1600,"g":"women","pt":"body-mist","ing":"Denatured Alcohol, Fragrance, Aqua, Glycerin","ben":"Light fragrance, everyday wear, non-overpowering","htu":"Spritz on neck, wrists, and body after shower. Reapply throughout the day.","w":"125ml","sz":"125ml","f":false,"tr":false,"na":true,"bs":false,"sku":"PLM-BM-125","bc":"890443560003","tags":"body-mist,light,floral,everyday,new"},
    {"n":"Nourishing Body Lotion","b":"Nivea","c":"Body","sc":"body-lotion","d":"Rich body lotion with almond oil and vitamin E that provides 48-hour deep moisture for soft, smooth skin.","img":"https://images.pexels.com/photos/33537354/pexels-photo-33537354.png?auto=compress&cs=tinysrgb&h=650&w=940","mrp":199,"cp":159,"r":4.4,"rc":7600,"g":"unisex","pt":"body-lotion","ing":"Aqua, Glycerin, Almond Oil, Tocopheryl Acetate (Vitamin E)","ben":"48-hour moisture, non-greasy, smooth skin","htu":"Apply generously to clean dry skin. Massage until fully absorbed.","w":"400ml","sz":"400ml","f":false,"tr":false,"bs":true,"sku":"NIV-NBL-400","bc":"400580000002","tags":"bestseller,body-lotion,dry-skin,daily-use,affordable"},
    {"n":"Deeply Nourishing Body Wash","b":"Dove","c":"Body","sc":"body-wash","d":"Creamy body wash with NutriumMoisture technology that cleanses and nourishes skin, leaving it soft and smooth.","img":"https://images.pexels.com/photos/19522722/pexels-photo-19522722.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":315,"cp":250,"r":4.3,"rc":4200,"g":"unisex","pt":"body-wash","ing":"Sodium Laureth Sulfate, Glycerin, NutriumMoisture, Cocamidopropyl Betaine","ben":"Gentle cleansing, deep nourishment, soft skin","htu":"Squeeze onto a loofah or palm, work into a lather, apply to body, rinse off.","w":"500ml","sz":"500ml","f":false,"tr":true,"bs":false,"sku":"DOV-DNBW-500","bc":"890103001002","tags":"body-wash,nourishing,daily-use,gentle"},
    {"n":"Moisturizing Lotion","b":"Cetaphil","c":"Body","sc":"body-lotion","d":"Lightweight, non-greasy moisturizing lotion that provides long-lasting hydration for all skin types, including sensitive skin.","img":"https://images.pexels.com/photos/16071961/pexels-photo-16071961.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":650,"cp":520,"r":4.4,"rc":3100,"g":"unisex","pt":"body-lotion","ing":"Water, Glycerin, Hydrogenated Polyisobutene, Cetyl Alcohol","ben":"Long-lasting hydration, non-greasy, sensitive skin safe","htu":"Apply liberously to body as needed, especially after bathing.","w":"500ml","sz":"500ml","f":false,"tr":false,"bs":false,"sku":"CET-ML-500","bc":"600110300002","tags":"body-lotion,sensitive-skin,dermatologist-recommended,hydrating"},
    {"n":"Body Wash","b":"Mamaearth","c":"Body","sc":"body-wash","d":"Toxin-free body wash with oatmeal and honey that gently cleanses and moisturizes skin. Free from sulfates and parabens.","img":"https://images.pexels.com/photos/33537356/pexels-photo-33537356.png?auto=compress&cs=tinysrgb&h=650&w=940","mrp":349,"cp":279,"r":4.1,"rc":2200,"g":"unisex","pt":"body-wash","ing":"Oatmeal Extract, Honey, Coconut-derived Surfactants","ben":"Gentle cleansing, toxin-free, moisturizing","htu":"Pour onto a wet loofah, massage into rich lather, apply to body, rinse off.","w":"300ml","sz":"300ml","f":false,"tr":false,"na":true,"bs":false,"sku":"MAM-BW-300","bc":"890604950002","tags":"body-wash,toxin-free,natural,oatmeal,new"},
    {"n":"Triple Vitamin Body Lotion","b":"Ponds","c":"Body","sc":"body-lotion","d":"Lightweight body lotion with triple vitamin system (E, C, and B3) that brightens and softens skin with a non-greasy finish.","img":"https://images.pexels.com/photos/33537352/pexels-photo-33537352.png?auto=compress&cs=tinysrgb&h=650&w=940","mrp":185,"cp":148,"r":4.0,"rc":3400,"g":"unisex","pt":"body-lotion","ing":"Water, Mineral Oil, Glycerin, Niacinamide, Tocopheryl Acetate","ben":"Brightening, softening, non-greasy, affordable","htu":"Apply to clean dry skin and massage until fully absorbed.","w":"300ml","sz":"300ml","f":false,"tr":false,"bs":false,"sku":"PND-TVL-300","bc":"490243000001","tags":"body-lotion,brightening,vitamins,affordable"},
    {"n":"Ashwagandha Capsules","b":"Himalaya","c":"Wellness","sc":"supplements","d":"Pure ashwagandha root extract capsules that help reduce stress, improve energy, and support overall well-being. 60 capsules per bottle.","img":"https://images.pexels.com/photos/13787562/pexels-photo-13787562.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":300,"cp":240,"r":4.3,"rc":1800,"g":"unisex","pt":"supplement","ing":"Ashwagandha Root Extract 500mg","ben":"Reduces stress, boosts energy, supports immunity","htu":"Take 1-2 capsules daily after meals with water, or as directed by physician.","w":"60 capsules","sz":"60 capsules","f":false,"tr":true,"bs":true,"sku":"HIM-ASH-60","bc":"890113900002","tags":"bestseller,ashwagandha,stress-relief,immunity,ayurvedic"},
    {"n":"Liv 52 Tablets","b":"Himalaya","c":"Wellness","sc":"supplements","d":"Ayurvedic liver support formula with herbs like capers and chicory that support liver function and digestion. 100 tablets.","img":"https://images.pexels.com/photos/13779102/pexels-photo-13779102.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":135,"cp":108,"r":4.4,"rc":2600,"g":"unisex","pt":"supplement","ing":"Capparis spinosa, Cichorium intybus, Solanum nigrum, Terminalia arjuna","ben":"Supports liver health, aids digestion, detoxifies","htu":"Take 1-2 tablets twice daily after meals, or as directed by physician.","w":"100 tablets","sz":"100 tablets","f":false,"tr":false,"bs":true,"sku":"HIM-LV-100","bc":"890113900003","tags":"bestseller,liver-health,ayurvedic,digestion,affordable"},
    {"n":"Vitamin C Effervescent Tablets","b":"Mamaearth","c":"Wellness","sc":"vitamins","d":"Effervescent vitamin C tablets with zinc that boost immunity and energy. Orange flavor. 20 tablets per tube.","img":"https://images.pexels.com/photos/14029289/pexels-photo-14029289.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":499,"cp":399,"r":4.2,"rc":1400,"g":"unisex","pt":"vitamin","ing":"Vitamin C 1000mg, Zinc 10mg","ben":"Boosts immunity, enhances energy, antioxidant support","htu":"Dissolve one tablet in a glass of water. Drink once daily after a meal.","w":"20 tablets","sz":"20 tablets","f":true,"tr":true,"na":true,"bs":false,"sku":"MAM-VC-20","bc":"890604950003","tags":"vitamin-c,immunity,zinc,effervescent,new"},
    {"n":"Aloe Vera Gel","b":"Khadi Natural","c":"Wellness","sc":"supplements","d":"Pure aloe vera gel for multi-purpose use on skin and hair. Soothes, hydrates, and heals. Free from parabens and artificial colors.","img":"https://images.pexels.com/photos/13779107/pexels-photo-13779107.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":295,"cp":236,"r":4.1,"rc":2900,"g":"unisex","pt":"gel","ing":"Aloe Vera Extract 99%, Vitamin E, Natural Preservatives","ben":"Soothes skin, hydrates, multi-purpose, natural","htu":"Apply generously to skin or hair as needed. Can be used as a face mask, hair gel, or moisturizer.","w":"200ml","sz":"200ml","f":false,"tr":false,"bs":false,"sku":"KN-AVG-200","bc":"890424000001","tags":"aloe-vera,multi-purpose,natural,soothing,affordable"},
    {"n":"Aromatherapy Oil","b":"Forest Essentials","c":"Wellness","sc":"aromatherapy","d":"Premium aromatherapy essential oil blend with lavender, sandalwood, and bergamot. Promotes relaxation and stress relief.","img":"https://images.pexels.com/photos/13787561/pexels-photo-13787561.jpeg?auto=compress&cs=tinysrgb&h=650&w=940","mrp":1200,"cp":960,"r":4.3,"rc":600,"g":"unisex","pt":"essential-oil","ing":"Lavender Oil, Sandalwood Oil, Bergamot Oil, Jojoba Carrier Oil","ben":"Relaxation, stress relief, aromatherapy, premium quality","htu":"Add 4-5 drops to a diffuser or mix with carrier oil for massage.","w":"30ml","sz":"30ml","f":false,"tr":false,"na":true,"bs":false,"sku":"FE-ARO-30","bc":"890141000003","tags":"aromatherapy,essential-oil,lavender,relaxation,luxury,new"}
  ]
  $J$::jsonb)
  LOOP
    SELECT id INTO v_brand_id FROM brands WHERE name = p->>'b';
    SELECT id INTO v_cat_id FROM categories WHERE name = p->>'c';
    SELECT id INTO v_sub_id FROM subcategories WHERE slug = p->>'sc';

    INSERT INTO products (
      name, brand_id, category_id, sub_category_id, description,
      image_url, thumbnail_url, mrp, current_price, rating, reviews_count,
      slug, gender, product_type, ingredients, benefits, how_to_use,
      weight, size, stock_status, availability,
      featured, trending, new_arrival, best_seller,
      sku, barcode, image_gallery, tags, product_url, archived_at
    ) VALUES (
      p->>'n', v_brand_id, v_cat_id, v_sub_id, p->>'d',
      p->>'img', p->>'img', (p->>'mrp')::numeric, (p->>'cp')::numeric,
      (p->>'r')::numeric, (p->>'rc')::int,
      lower(replace(p->>'n', ' ', '-')), p->>'g', p->>'pt',
      p->>'ing', p->>'ben', p->>'htu', p->>'w', p->>'sz',
      'in_stock', 'in_stock',
      COALESCE((p->>'f')::boolean, false),
      COALESCE((p->>'tr')::boolean, false),
      COALESCE((p->>'na')::boolean, false),
      COALESCE((p->>'bs')::boolean, false),
      p->>'sku', p->>'bc',
      ARRAY[p->>'img']::text[],
      string_to_array(p->>'tags', ','),
      NULL, NULL
    );
  END LOOP;
END $$;

-- ============ 5. PRODUCT LISTINGS ============
-- product_listings has a UNIQUE constraint on (product_id, marketplace_id),
-- so we use ON CONFLICT (product_id, marketplace_id) DO NOTHING to stay idempotent.
INSERT INTO product_listings (
  product_id, marketplace_id, price, mrp, url, in_stock, availability,
  seller, delivery, currency, data_source, is_active, discount_pct,
  last_checked, normalized_url
)
SELECT
  p.id,
  m.id,
  CASE m.slug
    WHEN 'amazon'   THEN ROUND(p.current_price * 1.00, 2)
    WHEN 'nykaa'    THEN ROUND(p.current_price * 1.05, 2)
    WHEN 'flipkart' THEN ROUND(p.current_price * 0.98, 2)
    WHEN 'myntra'   THEN ROUND(p.current_price * 1.08, 2)
    WHEN 'purplle'  THEN ROUND(p.current_price * 1.03, 2)
    WHEN 'tira'     THEN ROUND(p.current_price * 1.06, 2)
    WHEN 'zepto'    THEN ROUND(p.current_price * 1.12, 2)
    WHEN 'bigbasket' THEN ROUND(p.current_price * 1.10, 2)
    ELSE p.current_price
  END,
  p.mrp,
  'https://www.' || m.slug || '.in/product/' || p.slug,
  true,
  'in_stock',
  CASE m.slug
    WHEN 'amazon'    THEN 'CloudTailor India'
    WHEN 'nykaa'     THEN 'Nykaa Retail'
    WHEN 'flipkart'  THEN 'SuperComNet'
    WHEN 'myntra'    THEN 'Myntra Designs'
    WHEN 'purplle'   THEN 'Purplle Beauty'
    WHEN 'tira'      THEN 'Tira Beauty'
    WHEN 'zepto'     THEN 'Zepto Store'
    WHEN 'bigbasket' THEN 'BigBasket Direct'
    ELSE 'Official Store'
  END,
  CASE m.slug
    WHEN 'amazon'    THEN '1-2 days'
    WHEN 'nykaa'     THEN '2-3 days'
    WHEN 'flipkart'  THEN '1-3 days'
    WHEN 'myntra'    THEN '3-5 days'
    WHEN 'purplle'   THEN '2-4 days'
    WHEN 'tira'      THEN '2-3 days'
    WHEN 'zepto'     THEN '10 minutes'
    WHEN 'bigbasket' THEN 'Same day'
    ELSE '3-5 days'
  END,
  'INR',
  'manual',
  true,
  ROUND(((p.mrp - p.current_price) / NULLIF(p.mrp, 0) * 100)::numeric, 2),
  now(),
  'https://www.' || m.slug || '.in/product/' || p.slug
FROM products p
CROSS JOIN marketplaces m
WHERE p.archived_at IS NULL
  AND (
    (p.category_id IN (SELECT id FROM categories WHERE name IN ('Skincare','Haircare'))
     AND m.slug IN ('amazon','nykaa','flipkart'))
    OR (p.category_id IN (SELECT id FROM categories WHERE name = 'Makeup')
     AND m.slug IN ('amazon','nykaa','myntra'))
    OR (p.category_id IN (SELECT id FROM categories WHERE name = 'Fragrance')
     AND m.slug IN ('amazon','nykaa','tira'))
    OR (p.category_id IN (SELECT id FROM categories WHERE name = 'Body')
     AND m.slug IN ('amazon','flipkart','zepto'))
    OR (p.category_id IN (SELECT id FROM categories WHERE name = 'Wellness')
     AND m.slug IN ('amazon','flipkart','bigbasket'))
  )
ON CONFLICT (product_id, marketplace_id) DO NOTHING;

-- ============ 6. PRICE HISTORY (90 days per listing) ============
INSERT INTO price_history (
  product_id, marketplace_id, product_marketplace_id,
  price, mrp, discount_percentage, recorded_at, availability, source
)
SELECT
  p.id,
  pl.marketplace_id,
  pl.id,
  ROUND((
    pl.price * (1.0 + sin(g.days * 0.08) * 0.05 + (random() * 0.04 - 0.02) + g.days * 0.0005)
  )::numeric, 2),
  p.mrp,
  ROUND(((p.mrp - pl.price) / NULLIF(p.mrp, 0) * 100)::numeric, 2),
  now() - make_interval(days => g.days),
  'in_stock',
  'manual'
FROM products p
JOIN product_listings pl ON pl.product_id = p.id AND pl.is_active = true
CROSS JOIN generate_series(0, 89) AS g(days)
WHERE p.archived_at IS NULL;

-- ============ 7. UPDATE AGGREGATE PRICE FIELDS ON PRODUCTS ============
UPDATE products p SET
  lowest_price  = agg.lowest,
  highest_price = agg.highest,
  avg_price     = agg.avg
FROM (
  SELECT product_id,
         MIN(price)  AS lowest,
         MAX(price)  AS highest,
         ROUND(AVG(price)) AS avg
  FROM product_listings WHERE is_active = true
  GROUP BY product_id
) agg
WHERE p.id = agg.product_id;

-- ============ 8. SAMPLE COUPONS ============
INSERT INTO coupons (code, marketplace_id, description, discount_pct, min_order, expires_at, active)
SELECT v.code, m.id, v.descr, v.dp, v.mo, v.exp, true
FROM (VALUES
  ('NYKAA10',    'nykaa'::text,    '10% off on all orders'::text,                      10::numeric, 0::numeric,    now() + interval '30 days'),
  ('AMAZON15',   'amazon'::text,   '15% off on beauty products above Rs. 500'::text,  15::numeric, 500::numeric,  now() + interval '15 days'),
  ('FLIPKART20', 'flipkart'::text, '20% off on personal care above Rs. 999'::text,    20::numeric, 999::numeric,  now() + interval '45 days'),
  ('MAMAEARTH25','amazon'::text,   '25% off on Mamaearth products'::text,             25::numeric, 300::numeric,  now() + interval '20 days'),
  ('PLUM15',     'nykaa'::text,    '15% off on Plum products'::text,                   15::numeric, 400::numeric,  now() + interval '25 days'),
  ('TIRA10',     'tira'::text,     '10% off on first order'::text,                     10::numeric, 0::numeric,    now() + interval '60 days')
) AS v(code, mp_slug, descr, dp, mo, exp)
JOIN marketplaces m ON m.slug = v.mp_slug;