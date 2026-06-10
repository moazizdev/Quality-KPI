-- Quality KPI System - SQL Dump
-- Generated: 2026-06-10T11:24:44.828461
-- Engine: postgresql

SET session_replication_role = 'replica';


-- Table: customer_complaints
-- 0 rows exported

-- Table: halls
INSERT INTO halls (id, name) VALUES (4, 'صالة إنتاج 1');
INSERT INTO halls (id, name) VALUES (5, 'صالة إنتاج 2');
INSERT INTO halls (id, name) VALUES (6, 'صالة إنتاج 3');
-- 3 rows exported

-- Table: machines
INSERT INTO machines (id, hall_id, machine_code, machine_name, assigned_user_id) VALUES (13, 4, 'M1', 'Production Line 1', NULL);
INSERT INTO machines (id, hall_id, machine_code, machine_name, assigned_user_id) VALUES (14, 4, 'M2', 'Production Line 2', NULL);
INSERT INTO machines (id, hall_id, machine_code, machine_name, assigned_user_id) VALUES (15, 4, 'M3', 'Production Line 3', NULL);
INSERT INTO machines (id, hall_id, machine_code, machine_name, assigned_user_id) VALUES (16, 4, 'M4', 'Production Line 4', NULL);
INSERT INTO machines (id, hall_id, machine_code, machine_name, assigned_user_id) VALUES (17, 5, 'M5', 'Production Line 5', NULL);
INSERT INTO machines (id, hall_id, machine_code, machine_name, assigned_user_id) VALUES (18, 5, 'M6', 'Production Line 6', NULL);
INSERT INTO machines (id, hall_id, machine_code, machine_name, assigned_user_id) VALUES (19, 5, 'M7', 'Production Line 7', NULL);
INSERT INTO machines (id, hall_id, machine_code, machine_name, assigned_user_id) VALUES (20, 5, 'M8', 'Production Line 8', NULL);
INSERT INTO machines (id, hall_id, machine_code, machine_name, assigned_user_id) VALUES (21, 6, 'M9', 'Production Line 9', NULL);
INSERT INTO machines (id, hall_id, machine_code, machine_name, assigned_user_id) VALUES (22, 6, 'M10', 'Production Line 10', NULL);
INSERT INTO machines (id, hall_id, machine_code, machine_name, assigned_user_id) VALUES (23, 6, 'M10-PK2', 'Production Line 10 PK2', NULL);
INSERT INTO machines (id, hall_id, machine_code, machine_name, assigned_user_id) VALUES (24, 6, 'M18', 'Production Line 18', NULL);
-- 12 rows exported

-- Table: users
INSERT INTO users (id, username, password_hash, role, full_name, is_active) VALUES (2, 'admin', '$2b$12$OrBlUSqXUTD/kQidOlEOQuTG9Gt4sa1/2Gilbcx1fUOwHOeeJYggS', 'admin', 'System Admin', 1);
-- 1 rows exported

-- Table: production_records
-- 0 rows exported

-- Table: products
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (29, 'Five Chocolate', 'شيكوالتة فايف جي', 12, 95.5, 6.5, 7.5, 107.0, 112.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (30, 'Cookies Five', 'كوكيز فايف جي', 12, 95.5, 6.5, 7.5, 107.0, 112.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (31, 'Strawberry Five', 'فراولة فايف جي', 12, 95.5, 10.5, NULL, 104.0, 108.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (32, 'Biscuit Caramel Five', 'بسكويت كراميل فايف جي', 12, 95.5, 6.5, 7.5, 107.0, 112.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (33, 'Yogurt Five', 'زبادي فايف جي', 12, 82.5, 11.0, NULL, 90.0, 97.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (34, 'Go On Chocolate', 'جو اون شيكوالته', 12, 83.5, 4.5, 4.5, 90.0, 95.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (35, 'Go On Strawberry', 'جو فراولة / جو اون فراولة', 12, 83.5, 8.5, NULL, 90.0, 94.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (36, 'Go On Biscuit', 'جو اون بسكويت', 12, 83.5, 4.5, 4.5, 90.0, 95.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (37, 'Marbello Vanilla', 'ماربيلو فانيليا', 24, 49.0, 4.5, NULL, 52.0, 55.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (38, 'Marbello Chocolate', 'ماربيلو شيكوالتة', 24, 49.0, 4.5, NULL, 52.0, 55.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (39, 'Free Good Vanilla', 'فري جود فانيليا', 18, 59.0, 9.5, NULL, 67.0, 70.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (40, 'Free Good Chocolate', 'فري جود شيكوالتة', 18, 59.0, 7.5, 4.5, 69.0, 73.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (41, 'Free Good Cono', 'فري جود كونو / هاب الند كونو', 30, 28.0, 2.5, 15.0, 42.0, 49.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (42, 'Free Good Cake', 'فري جود كيك', 18, 59.0, 7.5, 4.5, 69.0, 73.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (43, 'Froop Milk', 'فروبي ميلك', 24, 62.5, 24.5, NULL, 82.0, 92.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (44, 'Royal Chocolate Cono', 'رويال شيكوالته كونو', 20, 38.0, 6.5, 16.75, 58.5, 64.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (45, 'Volcano Vanilla Cono', 'فولكانو فانيليا كونو', 12, 43.0, 7.5, 15.75, 63.5, 69.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (46, 'Cookies and Cream Cono', 'كوكيز اند كريم كونو', 20, 41.0, 6.5, 16.5, 61.0, 67.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (47, 'Best Cono', 'بيست كونو فانيليا / شيكوالتة', 20, 38.0, 5.75, 15.5, 57.0, 61.5);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (48, 'Joker Vanilla Cono', 'جوكر فانيليا كونو', 25, 38.0, 5.75, 14.5, 56.0, 60.5);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (49, 'Snickers Chocolate', 'اسنيكرز شيكوالتة', 18, 42.5, 4.5, 24.0, 67.0, 75.5);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (50, 'Snickers Cookies', 'اسنيكرز كوكيز', 18, 42.5, 4.5, 21.0, 65.0, 71.5);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (51, 'Volcano Chocolate', 'فولكانو شيكوالتة', 18, 47.0, 19.0, 2.5, 66.0, 71.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (52, 'Volcano Vanilla', 'فولكانو فانيليا', 18, 47.0, 19.0, 2.5, 66.0, 71.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (53, 'Volcano Dark Mocha', 'فولكانو دارك / موكا', 18, 47.0, 18.0, NULL, 63.0, 67.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (54, 'Volcano Coconut', 'فولكانو جوز هند', 18, 47.0, 19.0, 1.5, 65.0, 70.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (55, 'Royal Double Stick', 'رويال / دابل استيك', 18, 39.0, 15.5, 2.5, 55.0, 59.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (56, 'Volcano XIA Pistachio', 'فولكانو اكسيا بيستاشيو', 12, 50.5, 20.0, 4.5, 72.0, 78.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (57, 'Fraichage Hazelnut Stick', 'فرايتاج شيكوالته بندق استيك', 12, 50.5, 19.5, 3.5, 71.0, 76.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (58, 'Mango Cup', 'مانجو زبدية', 24, 76.0, NULL, NULL, 75.0, 77.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (59, 'Watermelon', 'بطيخ', 24, 56.0, NULL, NULL, 55.0, 57.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (60, 'Pop Cantaloupe', 'بوب كنتالوب / كيك / جوافة', 24, 56.0, NULL, NULL, 55.0, 57.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (61, 'Switch Mix', 'سويتش / سويتش ميكس', 12, 49.0, 16.5, 19.0, 81.0, 88.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (62, 'Mini Tart', 'ميني تارت', 8, 112.5, 12.0, 7.5, 143.0, 152.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (63, 'Combo Vanilla Caramel', 'كومبو فانيليا & كراميل', 18, 46.0, 7.5, 15.5, 80.0, 87.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (64, 'Combo Cookies', 'كومبو كوكيز', 18, 46.0, 7.5, 15.5, 80.0, 87.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (65, 'Combo XIA', 'كومبو اكسيا فانيليا / شيكوالتة', 18, 49.5, 7.5, 16.5, 83.0, 92.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (66, 'Fraichage Hazelnut Cono', 'فرايتاج شيكوالته بندق كونو', 18, 49.5, 7.5, 15.5, 83.0, 91.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (67, 'Frisco Vanilla Caramel', 'فريسكو فانيليا & كراميل', 16, 43.0, 11.0, 16.0, 81.0, 97.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (68, 'Gowali', 'جوالي (فانيليا - شيكوالتة)', 2, 1750.0, NULL, NULL, 1740.0, 1760.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (69, 'Mizaj', 'مزاج خوخ / جوافة / نعناع / توت', 24, 66.5, NULL, NULL, 64.0, 69.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (70, 'Mizaj Mango XL', 'مزاج مانجو XL', 12, 97.5, NULL, NULL, 95.0, 100.0);
INSERT INTO products (id, product_name, product_name_ar, default_pieces, default_ice_weight, default_sauce_weight, default_biscuit_weight, default_min_weight, default_max_weight) VALUES (71, 'Dewoo', 'ديوو (مانجو / فراولة)', 18, 104.0, NULL, NULL, 102.0, 106.0);
-- 43 rows exported

-- Table: deviations
-- 0 rows exported

-- Table: defect_categories
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (1, 'AD01', 'تكتل الإضافات في جزء واحد', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (2, 'AD02', 'إضافات رطبة/مكسورة زيادة', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (3, 'AD03', 'نوع إضافات غير مطابق للوصفة', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (4, 'AD04', 'عدم وجود إضافة / إنسداد فى كل العيون', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (5, 'AD05', 'عدم وجود إضافة / إنسداد فى بعض العيون', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (6, 'CHEM01', 'خطر كيميائى', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (7, 'LK01', 'تسريب من جسم الكوب/العبوة', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (8, 'LK02', 'تسريب من منطقة الغطاء', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (9, 'LK03', 'تسريب بعد التجميد', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (10, 'LK04', 'تسريب أثناء النقل الداخلي', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (11, 'LK05', 'تسريب بسبب تشقق العبوة', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (12, 'LK06', 'تسريب من اللحام بعد الفحص', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (13, 'MIC01', 'حدوث تلوث ميكروبى', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (14, 'PH01', 'تلوث/شوائب في الإضافات', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (15, 'PH02', 'جسم غريب (بلاستيك/معدن)', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (16, 'PH03', 'شعر/ألياف', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (17, 'PH04', 'أتربة/رمل', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (18, 'PH05', 'تلوث المنتج بمواد خام', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (19, 'PH06', 'تلوث المنتج بآفات حشرية ومواد سامة', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (20, 'PH07', 'حدوث تلوث خلطى', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (21, 'PH08', 'اكسسورات', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (22, 'PH09', 'بقايا ورق/كرتون', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (23, 'PK01', 'اعوجاج/تشوه الكوب', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (24, 'PK02', 'كوب مكسور/مشقوق', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (25, 'PK03', 'اتساخ الكوب من الداخل قبل التعبئة', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (26, 'PK04', 'تجعد/تمزق في ورق التغليف', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (27, 'PK05', 'زيادة عدد الكراتين', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (28, 'PK06', 'نقص عدد الكراتين', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (29, 'PK07', 'تجميع كراتين غير محكم', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (30, 'PK08', 'عدم إحكام غلق الغطاء', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (31, 'PK09', 'غطاء مكسور/مشقوق', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (32, 'PK10', 'عدم وجود غطاء', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (33, 'PK11', 'غطاء غير مطابق للمقاس', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (34, 'PK12', 'تراكب/ميل في الغطاء', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (35, 'PK13', 'مضارب الأغطية (خبطات/خدوش)', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (36, 'PK14', 'اتساخ الغطاء', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (37, 'PK15', 'تشوه حافة الغطاء', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (38, 'PK16', 'عصا مكسورة', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (39, 'PK17', 'عصا غير في المنتصف', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (40, 'PK18', 'عصا طالعة زيادة/غاطسة زيادة', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (41, 'PK19', 'مضارب العصا (خبطات/تكسرات)', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (42, 'PK20', 'خشونة/شوائب بالعصا', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (43, 'PK21', 'ضعف لحام الغطاء/الفويل', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (44, 'PK22', 'لحام غير مكتمل (جزء مفتوح)', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (45, 'PK23', 'احتراق/اسوداد في منطقة اللحام', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (46, 'PK24', 'تجعيد الفويل داخل خط اللحام', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (47, 'PK25', 'انحراف القطعة داخل الرول', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (48, 'PK26', 'تلوث في خط اللحام (شوكولاتة/ثلج)', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (49, 'PK27', 'ضغط لحام عالي يعمل قطع للفويل', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (50, 'PK28', 'عيوب الكرتون', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (51, 'PK29', 'كرتونة ضعيفة/مبللة', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (52, 'PK30', 'سوء رص داخل الكرتونة', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (53, 'PK31', 'عدم لصق/تلزيق الكرتونة', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (54, 'PK32', 'مكونات غير مدونة/خطأ حساسية', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (55, 'PK34', 'عطل / توقف روبوتات الماكينة', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (56, 'PK35', 'اتساخ الكوب من الخارج', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (57, 'PK36', 'باركود كرتونة غير صحيح/غير مقروء', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (58, 'PR01', 'خطأ فى طباعة الرسالة', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (59, 'PR02', 'عدم وضوح الطباعة', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (60, 'PR03', 'انعدام الطباعة', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (61, 'PR04', 'طباعة مقلوبة/في مكان غلط', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (62, 'PR05', 'خطأ في اسم المنتج/الباركود', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (63, 'Q01', 'قوام ناعم زيادة (ذوبان/ضعف تجميد/سيولة)', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (64, 'Q02', 'قوام متصلب', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (65, 'Q03', 'بلورات ثلجية واضحة', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (66, 'Q04', 'انفصال دهني/تزييت', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (67, 'Q05', 'طعم/رائحة غير طبيعية', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (68, 'Q06', 'لون غير مطابق', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (69, 'Q07', 'تكتل/تحبب في المنتج', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (70, 'Q08', 'فقاعات/فراغات داخل المنتج', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (71, 'Q09', 'شكل غير متناسق', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (72, 'T01', 'ارتفاع حرارة الفريزر', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (73, 'T02', 'انخفاض حرارة شديد (تجمد زائد)', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (74, 'T03', 'وقت تجميد غير كافي', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (75, 'T04', 'تذبذب الحرارة أثناء التشغيل', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (76, 'T05', 'تكوّن ثلج زائد على المعدات', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (77, 'T06', 'انسداد هواء/مراوح ضعيفة', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (78, 'VA01', 'تكسير/سحق أثناء النقل الداخلي', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (79, 'VA02', 'تعرض لحرارة أثناء التحميل', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (80, 'VA03', 'تكديس خاطئ يسبب تلف العبوات', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (81, 'VA04', 'اختلاط دفعات/عدم تتبع', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (82, 'W01', 'نقص وزن', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (83, 'W02', 'زيادة وزن', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (84, 'W03', 'تذبذب وزن', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (85, 'W04', 'نقص الإضافات (مكسرات/بسكوت/شوكولاتة)', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (86, 'W05', 'زيادة الإضافات', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (87, 'W06', 'توزيع غير منتظم للإضافات', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (88, 'W07', 'عدم تفعيل ميزان العد', NULL);
INSERT INTO defect_categories (id, defect_code, defect_name, description) VALUES (89, 'X01', 'منتج غير مطابق بدون سبب واضح (يحتاج تحقيق)', NULL);
-- 89 rows exported

-- Table: capa_cases
-- 0 rows exported

-- Table: _test
-- 0 rows exported

SET session_replication_role = 'origin';
