<?php
// تنظیمات دیتابیس Mobix
$host = 'localhost';
$dbname = 'mobix_store';
$username = 'root';
$password = '';

// تنظیمات امنیتی
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', '../logs/error.log');

// تنظیمات timezone
date_default_timezone_set('Asia/Tehran');

// تنظیمات charset
ini_set('default_charset', 'utf8mb4');

// تابع اتصال به دیتابیس
function getDBConnection() {
    global $host, $dbname, $username, $password;
    
    try {
        $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ];
        
        $pdo = new PDO($dsn, $username, $password, $options);
        return $pdo;
    } catch(PDOException $e) {
        // در محیط production، خطا را لاگ کنید
        error_log("Database connection failed: " . $e->getMessage());
        die("خطا در اتصال به دیتابیس");
    }
}

// تابع برای ایجاد جداول دیتابیس
function createTables() {
    $pdo = getDBConnection();
    
    // جدول کاربران
    $sql_users = "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        avatar_url TEXT,
        is_admin BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    
    // جدول دسته‌بندی‌ها
    $sql_categories = "CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        image_url TEXT,
        parent_id INT NULL,
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
    )";
    
    // جدول محصولات
    $sql_products = "CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        short_description VARCHAR(500),
        price DECIMAL(10,2) NOT NULL,
        sale_price DECIMAL(10,2) NULL,
        cost_price DECIMAL(10,2) NULL,
        category_id INT NOT NULL,
        brand VARCHAR(100),
        model VARCHAR(100),
        sku VARCHAR(100) UNIQUE,
        stock_quantity INT DEFAULT 0,
        min_stock_alert INT DEFAULT 5,
        weight DECIMAL(8,2) DEFAULT 0,
        dimensions VARCHAR(100),
        color VARCHAR(50),
        warranty_months INT DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0.00,
        total_reviews INT DEFAULT 0,
        total_sales INT DEFAULT 0,
        is_featured BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        meta_title VARCHAR(255),
        meta_description TEXT,
        meta_keywords TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    )";
    
    // جدول تصاویر محصولات
    $sql_product_images = "CREATE TABLE IF NOT EXISTS product_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        image_url TEXT NOT NULL,
        alt_text VARCHAR(255),
        sort_order INT DEFAULT 0,
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )";
    
    // جدول سبد خرید
    $sql_cart = "CREATE TABLE IF NOT EXISTS cart (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_product (user_id, product_id)
    )";
    
    // جدول سفارشات
    $sql_orders = "CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        user_id INT NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        shipping_amount DECIMAL(10,2) DEFAULT 0,
        final_amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
        payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
        payment_method VARCHAR(50),
        payment_authority VARCHAR(255),
        payment_ref_id VARCHAR(255),
        shipping_method VARCHAR(50),
        tracking_number VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )";
    
    // جدول آیتم‌های سفارش
    $sql_order_items = "CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_sku VARCHAR(100),
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    )";
    
    // جدول آدرس‌های ارسال
    $sql_shipping_addresses = "CREATE TABLE IF NOT EXISTS shipping_addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        order_id INT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        country VARCHAR(100) DEFAULT 'ایران',
        province VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        postal_code VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    )";
    
    // جدول نظرات و امتیازها
    $sql_reviews = "CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        order_id INT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title VARCHAR(255),
        comment TEXT,
        is_verified_purchase BOOLEAN DEFAULT FALSE,
        is_approved BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
        UNIQUE KEY unique_user_product (user_id, product_id)
    )";
    
    // جدول کوپن‌های تخفیف
    $sql_coupons = "CREATE TABLE IF NOT EXISTS coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        discount_type ENUM('percentage', 'fixed') NOT NULL,
        discount_value DECIMAL(10,2) NOT NULL,
        min_order_amount DECIMAL(10,2) DEFAULT 0,
        max_discount_amount DECIMAL(10,2) NULL,
        usage_limit INT NULL,
        used_count INT DEFAULT 0,
        user_limit INT DEFAULT 1,
        starts_at TIMESTAMP NULL,
        expires_at TIMESTAMP NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    
    // جدول استفاده از کوپن‌ها
    $sql_coupon_usage = "CREATE TABLE IF NOT EXISTS coupon_usage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        coupon_id INT NOT NULL,
        user_id INT NOT NULL,
        order_id INT NOT NULL,
        discount_amount DECIMAL(10,2) NOT NULL,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )";
    
    // جدول آمار سایت
    $sql_site_stats = "CREATE TABLE IF NOT EXISTS site_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        total_users INT DEFAULT 0,
        total_orders INT DEFAULT 0,
        total_revenue DECIMAL(12,2) DEFAULT 0,
        total_products INT DEFAULT 0,
        total_reviews INT DEFAULT 0,
        avg_rating DECIMAL(3,2) DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    
    // جدول بازدیدها
    $sql_visits = "CREATE TABLE IF NOT EXISTS visits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page VARCHAR(100) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        referrer TEXT,
        session_id VARCHAR(255),
        user_id INT NULL,
        visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )";
    
    // جدول تنظیمات سایت
    $sql_settings = "CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    
    try {
        // ایجاد جداول
        $pdo->exec($sql_users);
        $pdo->exec($sql_categories);
        $pdo->exec($sql_products);
        $pdo->exec($sql_product_images);
        $pdo->exec($sql_cart);
        $pdo->exec($sql_orders);
        $pdo->exec($sql_order_items);
        $pdo->exec($sql_shipping_addresses);
        $pdo->exec($sql_reviews);
        $pdo->exec($sql_coupons);
        $pdo->exec($sql_coupon_usage);
        $pdo->exec($sql_site_stats);
        $pdo->exec($sql_visits);
        $pdo->exec($sql_settings);
        
        // ایجاد رکورد اولیه برای آمار
        $check_stats = $pdo->query("SELECT COUNT(*) FROM site_stats")->fetchColumn();
        if ($check_stats == 0) {
            $pdo->exec("INSERT INTO site_stats (total_users, total_orders, total_revenue, total_products, total_reviews, avg_rating) VALUES (0, 0, 0, 0, 0, 0)");
        }
        
        // ایجاد تنظیمات اولیه
        $default_settings = [
            ['site_name', 'Mobix - فروشگاه دیجیتال', 'string', 'نام سایت'],
            ['site_description', 'فروشگاه آنلاین وسایل دیجیتال', 'string', 'توضیحات سایت'],
            ['site_logo', 'assets/img/logo.png', 'string', 'لوگوی سایت'],
            ['currency', 'تومان', 'string', 'واحد پول'],
            ['currency_symbol', '₺', 'string', 'نماد پول'],
            ['tax_rate', '9', 'number', 'نرخ مالیات (درصد)'],
            ['shipping_cost', '50000', 'number', 'هزینه ارسال پیش‌فرض'],
            ['free_shipping_threshold', '500000', 'number', 'حد آستانه ارسال رایگان'],
            ['max_cart_items', '50', 'number', 'حداکثر تعداد آیتم در سبد خرید'],
            ['order_number_prefix', 'MOBIX', 'string', 'پیشوند شماره سفارش'],
            ['payment_gateway', 'zarinpal', 'string', 'درگاه پرداخت'],
            ['zarinpal_merchant_id', '', 'string', 'کد درگاه زرین‌پال'],
            ['email_notifications', 'true', 'boolean', 'اعلان‌های ایمیلی'],
            ['sms_notifications', 'false', 'boolean', 'اعلان‌های پیامکی'],
            ['maintenance_mode', 'false', 'boolean', 'حالت تعمیر و نگهداری']
        ];
        
        foreach ($default_settings as $setting) {
            $check_setting = $pdo->prepare("SELECT COUNT(*) FROM settings WHERE setting_key = ?");
            $check_setting->execute([$setting[0]]);
            if ($check_setting->fetchColumn() == 0) {
                $insert_setting = $pdo->prepare("INSERT INTO settings (setting_key, setting_value, setting_type, description) VALUES (?, ?, ?, ?)");
                $insert_setting->execute($setting);
            }
        }
        
        return true;
    } catch(PDOException $e) {
        error_log("Error creating tables: " . $e->getMessage());
        die("خطا در ایجاد جداول دیتابیس: " . $e->getMessage());
    }
}

// تابع دریافت تنظیمات
function getSetting($key, $default = null) {
    try {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("SELECT setting_value, setting_type FROM settings WHERE setting_key = ?");
        $stmt->execute([$key]);
        $result = $stmt->fetch();
        
        if ($result) {
            switch ($result['setting_type']) {
                case 'number':
                    return floatval($result['setting_value']);
                case 'boolean':
                    return $result['setting_value'] === 'true';
                case 'json':
                    return json_decode($result['setting_value'], true);
                default:
                    return $result['setting_value'];
            }
        }
        
        return $default;
    } catch (Exception $e) {
        error_log("Error getting setting: " . $e->getMessage());
        return $default;
    }
}

// تابع ذخیره تنظیمات
function setSetting($key, $value, $type = 'string') {
    try {
        $pdo = getDBConnection();
        
        if ($type === 'json' && is_array($value)) {
            $value = json_encode($value);
        }
        
        $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value, setting_type) VALUES (?, ?, ?) 
                              ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), 
                              setting_type = VALUES(setting_type), 
                              updated_at = CURRENT_TIMESTAMP");
        return $stmt->execute([$key, $value, $type]);
    } catch (Exception $e) {
        error_log("Error setting setting: " . $e->getMessage());
        return false;
    }
}

// تابع تولید شماره سفارش
function generateOrderNumber() {
    $prefix = getSetting('order_number_prefix', 'MOBIX');
    $timestamp = time();
    $random = mt_rand(1000, 9999);
    return $prefix . $timestamp . $random;
}

// تابع اعتبارسنجی ایمیل
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// تابع اعتبارسنجی شماره موبایل
function validatePhone($phone) {
    return preg_match('/^09[0-9]{9}$/', $phone);
}

// تابع هش کردن رمز عبور
function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

// تابع بررسی رمز عبور
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

// تابع تولید توکن تصادفی
function generateToken($length = 32) {
    return bin2hex(random_bytes($length));
}

// تابع فرمت کردن قیمت
function formatPrice($price) {
    $currency = getSetting('currency_symbol', '₺');
    return number_format($price) . ' ' . $currency;
}

// تابع محاسبه مالیات
function calculateTax($amount) {
    $taxRate = getSetting('tax_rate', 9);
    return ($amount * $taxRate) / 100;
}

// تابع محاسبه هزینه ارسال
function calculateShipping($subtotal) {
    $freeThreshold = getSetting('free_shipping_threshold', 500000);
    $defaultCost = getSetting('shipping_cost', 50000);
    
    return $subtotal >= $freeThreshold ? 0 : $defaultCost;
}

// ایجاد جداول در اولین بارگذاری
createTables();
?> 