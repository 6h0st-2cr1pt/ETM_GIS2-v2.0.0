-- SQL Script to insert taxonomy data into the database
-- Note: Replace USER_ID_HERE with the actual user ID, or use a subquery to get the first user
-- Example: (SELECT id FROM auth_user LIMIT 1)

-- First, let's get or create families
-- Insert unique families
INSERT INTO app_treefamily (name, description, user_id)
SELECT DISTINCT 
    'Dipterocarpaceae' as name,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treefamily WHERE name = 'Dipterocarpaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treefamily (name, description, user_id)
SELECT DISTINCT 
    'Lamiaceae' as name,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treefamily WHERE name = 'Lamiaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treefamily (name, description, user_id)
SELECT DISTINCT 
    'Ebenaceae' as name,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treefamily WHERE name = 'Ebenaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treefamily (name, description, user_id)
SELECT DISTINCT 
    'Myrtaceae' as name,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treefamily WHERE name = 'Myrtaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treefamily (name, description, user_id)
SELECT DISTINCT 
    'Fabaceae' as name,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treefamily WHERE name = 'Fabaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treefamily (name, description, user_id)
SELECT DISTINCT 
    'Dilleniaceae' as name,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treefamily WHERE name = 'Dilleniaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treefamily (name, description, user_id)
SELECT DISTINCT 
    'Meliaceae' as name,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treefamily WHERE name = 'Meliaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treefamily (name, description, user_id)
SELECT DISTINCT 
    'Sapotaceae' as name,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treefamily WHERE name = 'Sapotaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treefamily (name, description, user_id)
SELECT DISTINCT 
    'Araliaceae' as name,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treefamily WHERE name = 'Araliaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treefamily (name, description, user_id)
SELECT DISTINCT 
    'Lythraceae' as name,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treefamily WHERE name = 'Lythraceae' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treefamily (name, description, user_id)
SELECT DISTINCT 
    'Araucariaceae' as name,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treefamily WHERE name = 'Araucariaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treefamily (name, description, user_id)
SELECT DISTINCT 
    'Melastomataceae' as name,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treefamily WHERE name = 'Melastomataceae' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treefamily (name, description, user_id)
SELECT DISTINCT 
    'Lauraceae' as name,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treefamily WHERE name = 'Lauraceae' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treefamily (name, description, user_id)
SELECT DISTINCT 
    'Cannabaceae' as name,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treefamily WHERE name = 'Cannabaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treefamily (name, description, user_id)
SELECT DISTINCT 
    'Moraceae' as name,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treefamily WHERE name = 'Moraceae' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treefamily (name, description, user_id)
SELECT DISTINCT 
    'Clusiaceae' as name,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treefamily WHERE name = 'Clusiaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treefamily (name, description, user_id)
SELECT DISTINCT 
    'Clethraceae' as name,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treefamily WHERE name = 'Clethraceae' AND user_id = (SELECT id FROM auth_user LIMIT 1));

-- Insert genera (with family relationships)
INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Shorea' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Dipterocarpaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Shorea' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Anisoptera' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Dipterocarpaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Anisoptera' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Parashorea' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Dipterocarpaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Parashorea' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Hopea' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Dipterocarpaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Hopea' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Tectona' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Lamiaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Tectona' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Diospyros' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Ebenaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Diospyros' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Xanthostemon' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Myrtaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Xanthostemon' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Wallaceodendron' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Fabaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Wallaceodendron' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Dillenia' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Dilleniaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Dillenia' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Tristaniopsis' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Myrtaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Tristaniopsis' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Afzelia' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Fabaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Afzelia' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Toona' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Meliaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Toona' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Palaquium' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Sapotaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Palaquium' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Sandoricum' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Meliaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Sandoricum' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Intsia' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Fabaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Intsia' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Dipterocarpus' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Dipterocarpaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Dipterocarpus' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Polyscias' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Araliaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Polyscias' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Lagerstroemia' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Lythraceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Lagerstroemia' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Agathis' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Araucariaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Agathis' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Astronia' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Melastomataceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Astronia' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Litsea' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Lauraceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Litsea' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Celtis' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Cannabaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Celtis' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Ficus' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Moraceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Ficus' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Calophyllum' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Clusiaceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Calophyllum' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Cinnamomum' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Lauraceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Cinnamomum' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treegenus (name, family_id, description, user_id)
SELECT DISTINCT 
    'Clethra' as name,
    (SELECT id FROM app_treefamily WHERE name = 'Clethraceae' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as family_id,
    '' as description,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treegenus WHERE name = 'Clethra' AND user_id = (SELECT id FROM auth_user LIMIT 1));

-- Insert species
INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Shorea astylosa' as scientific_name,
    'Yakal' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Shorea' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Shorea astylosa' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Shorea negrosensis' as scientific_name,
    'Red Lauan' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Shorea' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Shorea negrosensis' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Shorea contorta' as scientific_name,
    'White Lauan' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Shorea' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Shorea contorta' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Shorea polysperma' as scientific_name,
    'Tanguile' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Shorea' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Shorea polysperma' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Shorea almon' as scientific_name,
    'Almon' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Shorea' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Shorea almon' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Shorea palosapis' as scientific_name,
    'Mayapis' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Shorea' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Shorea palosapis' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Anisoptera thurifera' as scientific_name,
    'Palosapis' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Anisoptera' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Anisoptera thurifera' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Parashorea malaanonan' as scientific_name,
    'Bagtikan' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Parashorea' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Parashorea malaanonan' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Shorea guiso' as scientific_name,
    'Guijo' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Shorea' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Shorea guiso' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Hopea acuminata' as scientific_name,
    'Manggachapui' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Hopea' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Hopea acuminata' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Tectona philippinensis' as scientific_name,
    'Philippine Teak' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Tectona' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Tectona philippinensis' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Diospyros blancoi' as scientific_name,
    'Kamagong' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Diospyros' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Diospyros blancoi' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Diospyros pilosanthera' as scientific_name,
    'Bolong Eta' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Diospyros' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Diospyros pilosanthera' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Xanthostemon verdugonianus' as scientific_name,
    'Philippine Ironwood' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Xanthostemon' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Xanthostemon verdugonianus' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Wallaceodendron celebicum' as scientific_name,
    'Banuyo' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Wallaceodendron' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Wallaceodendron celebicum' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Dillenia philippinensis' as scientific_name,
    'Katmon' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Dillenia' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Dillenia philippinensis' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Tristaniopsis decorticata' as scientific_name,
    'Malabayabas' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Tristaniopsis' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Tristaniopsis decorticata' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Afzelia rhomboidea' as scientific_name,
    'Tindalo' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Afzelia' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Afzelia rhomboidea' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Toona calantas' as scientific_name,
    'Kalantas' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Toona' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Toona calantas' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Palaquium philippense' as scientific_name,
    'Nato' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Palaquium' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Palaquium philippense' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Sandoricum vidalii' as scientific_name,
    'Malasantol' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Sandoricum' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Sandoricum vidalii' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Intsia bijuga' as scientific_name,
    'Ipil' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Intsia' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Intsia bijuga' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Diospyros ferrea' as scientific_name,
    'Batulinau' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Diospyros' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Diospyros ferrea' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Dipterocarpus grandiflorus' as scientific_name,
    'Apitong' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Dipterocarpus' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Dipterocarpus grandiflorus' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Dipterocarpus gracilis' as scientific_name,
    'Panau' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Dipterocarpus' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Dipterocarpus gracilis' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Polyscias nodosa' as scientific_name,
    'Malapapaya' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Polyscias' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Polyscias nodosa' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Lagerstroemia speciosa' as scientific_name,
    'Banaba' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Lagerstroemia' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Lagerstroemia speciosa' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Agathis philippinensis' as scientific_name,
    'Almaciga' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Agathis' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Agathis philippinensis' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Astronia cumingiana' as scientific_name,
    'Udling' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Astronia' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Astronia cumingiana' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Litsea philippinensis' as scientific_name,
    'Bakan' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Litsea' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Litsea philippinensis' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Celtis philippensis' as scientific_name,
    'Celtis' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Celtis' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Celtis philippensis' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Ficus benjamina' as scientific_name,
    'Balete' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Ficus' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Ficus benjamina' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Calophyllum blancoi' as scientific_name,
    'Bitanghol' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Calophyllum' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Calophyllum blancoi' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Cinnamomum mercadoi' as scientific_name,
    'Kalingag' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Cinnamomum' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Cinnamomum mercadoi' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Calophyllum inophyllum' as scientific_name,
    'Bitaog' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Calophyllum' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Calophyllum inophyllum' AND user_id = (SELECT id FROM auth_user LIMIT 1));

INSERT INTO app_treespecies (scientific_name, common_name, genus_id, description, is_endemic, user_id)
SELECT 
    'Clethra sp.' as scientific_name,
    'Clethra sp' as common_name,
    (SELECT id FROM app_treegenus WHERE name = 'Clethra' AND user_id = (SELECT id FROM auth_user LIMIT 1) LIMIT 1) as genus_id,
    '' as description,
    true as is_endemic,
    (SELECT id FROM auth_user LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM app_treespecies WHERE scientific_name = 'Clethra sp.' AND user_id = (SELECT id FROM auth_user LIMIT 1));

