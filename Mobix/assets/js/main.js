// ===== Mobix Store - Main JavaScript =====

// متغیرهای سراسری
let currentUser = null;
let cartItems = [];
let wishlistItems = [];

// ===== User Management =====

// بررسی وضعیت لاگین کاربر
function checkUserLogin() {
    const userId = localStorage.getItem('userId');
    const userToken = localStorage.getItem('userToken');
    
    if (userId && userToken) {
        // بررسی اعتبار توکن
        validateToken(userToken).then(valid => {
            if (valid) {
                loadUserProfile();
            } else {
                logoutUser();
            }
        });
    }
}

// بارگذاری پروفایل کاربر
async function loadUserProfile() {
    const userId = localStorage.getItem('userId');
    
    try {
        const response = await fetch(`api/users.php?id=${userId}`);
        const result = await response.json();
        
        if (result.success) {
            currentUser = result.user;
            updateUserInterface();
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

// به‌روزرسانی رابط کاربری بر اساس وضعیت کاربر
function updateUserInterface() {
    const userMenu = document.querySelector('.user-menu');
    const loginBtn = document.querySelector('.login-btn');
    const registerBtn = document.querySelector('.register-btn');
    
    if (currentUser) {
        if (userMenu) {
            userMenu.innerHTML = `
                <div class="dropdown">
                    <button class="btn btn-outline dropdown-toggle" type="button" data-bs-toggle="dropdown">
                        <i class="fas fa-user"></i> ${currentUser.name}
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="profile.html">پروفایل</a></li>
                        <li><a class="dropdown-item" href="orders.html">سفارشات</a></li>
                        <li><a class="dropdown-item" href="wishlist.html">علاقه‌مندی‌ها</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" onclick="logoutUser()">خروج</a></li>
                    </ul>
                </div>
            `;
        }
        
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
    } else {
        if (userMenu) {
            userMenu.innerHTML = `
                <a href="login.html" class="btn btn-outline me-2">ورود</a>
                <a href="signup.html" class="btn btn-primary">ثبت نام</a>
            `;
        }
    }
}

// خروج کاربر
function logoutUser() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    currentUser = null;
    cartItems = [];
    wishlistItems = [];
    
    updateUserInterface();
    updateCartCount();
    
    // ریدایرکت به صفحه اصلی
    if (window.location.pathname.includes('profile.html') || 
        window.location.pathname.includes('orders.html') ||
        window.location.pathname.includes('wishlist.html')) {
        window.location.href = 'index.html';
    }
}

// اعتبارسنجی توکن
async function validateToken(token) {
    try {
        const response = await fetch('api/auth.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'validate',
                token: token
            })
        });
        
        const result = await response.json();
        return result.success;
    } catch (error) {
        return false;
    }
}

// ===== Cart Management =====

// بارگذاری سبد خرید
async function loadCart() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    try {
        const response = await fetch(`api/cart.php?user_id=${userId}`);
        const result = await response.json();
        
        if (result.success) {
            cartItems = result.items;
            updateCartCount();
            updateCartTotal();
        }
    } catch (error) {
        console.error('Error loading cart:', error);
    }
}

// افزودن به سبد خرید
async function addToCart(productId, quantity = 1) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        showLoginModal();
        return false;
    }
    
    try {
        const response = await fetch('api/cart.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                product_id: productId,
                quantity: quantity,
                action: 'add'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('محصول با موفقیت به سبد خرید اضافه شد', 'success');
            loadCart();
            return true;
        } else {
            showNotification('خطا در افزودن محصول: ' + result.error, 'error');
            return false;
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('خطا در ارتباط با سرور', 'error');
        return false;
    }
}

// حذف از سبد خرید
async function removeFromCart(productId) {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    try {
        const response = await fetch('api/cart.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                product_id: productId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('محصول از سبد خرید حذف شد', 'success');
            loadCart();
        }
    } catch (error) {
        console.error('Error removing from cart:', error);
    }
}

// به‌روزرسانی تعداد سبد خرید
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = cartItems.length;
    }
}

// به‌روزرسانی مجموع سبد خرید
function updateCartTotal() {
    const cartTotal = document.getElementById('cartTotal');
    if (cartTotal) {
        const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = formatPrice(total);
    }
}

// ===== Wishlist Management =====

// بارگذاری علاقه‌مندی‌ها
async function loadWishlist() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    try {
        const response = await fetch(`api/wishlist.php?user_id=${userId}`);
        const result = await response.json();
        
        if (result.success) {
            wishlistItems = result.items;
            updateWishlistCount();
        }
    } catch (error) {
        console.error('Error loading wishlist:', error);
    }
}

// افزودن به علاقه‌مندی‌ها
async function addToWishlist(productId) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        showLoginModal();
        return false;
    }
    
    try {
        const response = await fetch('api/wishlist.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                product_id: productId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('محصول به علاقه‌مندی‌ها اضافه شد', 'success');
            loadWishlist();
            return true;
        } else {
            showNotification('خطا در افزودن به علاقه‌مندی‌ها: ' + result.error, 'error');
            return false;
        }
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        showNotification('خطا در ارتباط با سرور', 'error');
        return false;
    }
}

// حذف از علاقه‌مندی‌ها
async function removeFromWishlist(productId) {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    try {
        const response = await fetch('api/wishlist.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                product_id: productId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('محصول از علاقه‌مندی‌ها حذف شد', 'success');
            loadWishlist();
        }
    } catch (error) {
        console.error('Error removing from wishlist:', error);
    }
}

// به‌روزرسانی تعداد علاقه‌مندی‌ها
function updateWishlistCount() {
    const wishlistCount = document.getElementById('wishlistCount');
    if (wishlistCount) {
        wishlistCount.textContent = wishlistItems.length;
    }
}

// ===== Product Functions =====

// مشاهده جزئیات محصول
function viewProduct(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

// تولید ستاره‌های امتیاز
function generateStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star text-warning"></i>';
        } else if (i - rating < 1) {
            stars += '<i class="fas fa-star-half-alt text-warning"></i>';
        } else {
            stars += '<i class="far fa-star text-warning"></i>';
        }
    }
    return stars;
}

// فرمت کردن قیمت
function formatPrice(price) {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
}

// ===== Search and Filter =====

// جستجو در محصولات
function searchProducts() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput ? searchInput.value.trim() : '';
    
    if (query) {
        const currentUrl = new URL(window.location);
        currentUrl.searchParams.set('search', query);
        currentUrl.searchParams.delete('page');
        window.location.href = currentUrl.toString();
    }
}

// اعمال فیلترها
function applyFilters() {
    const filters = {
        category: document.getElementById('categoryFilter')?.value || '',
        brand: document.getElementById('brandFilter')?.value || '',
        min_price: document.getElementById('minPrice')?.value || '',
        max_price: document.getElementById('maxPrice')?.value || '',
        rating: document.getElementById('ratingFilter')?.value || '',
        in_stock: document.getElementById('inStockFilter')?.checked || false
    };
    
    const currentUrl = new URL(window.location);
    
    Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== '') {
            currentUrl.searchParams.set(key, filters[key]);
        } else {
            currentUrl.searchParams.delete(key);
        }
    });
    
    currentUrl.searchParams.delete('page');
    window.location.href = currentUrl.toString();
}

// پاک کردن فیلترها
function clearFilters() {
    const filterInputs = [
        'searchInput', 'categoryFilter', 'brandFilter', 
        'minPrice', 'maxPrice', 'ratingFilter', 'inStockFilter'
    ];
    
    filterInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = false;
            } else {
                element.value = '';
            }
        }
    });
    
    const currentUrl = new URL(window.location);
    currentUrl.search = '';
    window.location.href = currentUrl.toString();
}

// ===== UI Functions =====

// نمایش اعلان
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // حذف خودکار بعد از 5 ثانیه
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// نمایش مودال لاگین
function showLoginModal() {
    const modal = new bootstrap.Modal(document.getElementById('loginModal'));
    modal.show();
}

// نمایش لودینگ
function showLoading(element) {
    if (element) {
        element.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">در حال بارگذاری...</span></div>';
    }
}

// مخفی کردن لودینگ
function hideLoading(element, originalContent) {
    if (element) {
        element.innerHTML = originalContent;
    }
}

// ===== Form Validation =====

// اعتبارسنجی ایمیل
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// اعتبارسنجی شماره موبایل
function validatePhone(phone) {
    const re = /^09[0-9]{9}$/;
    return re.test(phone);
}

// اعتبارسنجی رمز عبور
function validatePassword(password) {
    return password.length >= 6;
}

// ===== Utility Functions =====

// تاخیر
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// تولید ID تصادفی
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// کپی کردن متن
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('متن کپی شد', 'success');
    }).catch(() => {
        showNotification('خطا در کپی کردن متن', 'error');
    });
}

// ===== Event Listeners =====

// جستجو با Enter
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchProducts();
            }
        });
    }
    
    // بررسی وضعیت لاگین
    checkUserLogin();
    
    // بارگذاری سبد خرید
    loadCart();
    
    // بارگذاری علاقه‌مندی‌ها
    loadWishlist();
    
    // اضافه کردن event listener برای دکمه‌های افزودن به سبد
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart-btn')) {
            e.preventDefault();
            const productId = e.target.dataset.productId;
            addToCart(productId);
        }
        
        if (e.target.classList.contains('add-to-wishlist-btn')) {
            e.preventDefault();
            const productId = e.target.dataset.productId;
            addToWishlist(productId);
        }
    });
});

// ===== Responsive Functions =====

// بررسی اندازه صفحه
function isMobile() {
    return window.innerWidth <= 768;
}

// تنظیم منو برای موبایل
function setupMobileMenu() {
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    if (navbarToggler && navbarCollapse) {
        navbarToggler.addEventListener('click', function() {
            navbarCollapse.classList.toggle('show');
        });
        
        // بستن منو با کلیک روی لینک
        const navLinks = navbarCollapse.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navbarCollapse.classList.remove('show');
            });
        });
    }
    
    // تنظیم انیمیشن‌های منو
    setupNavbarAnimations();
}

// تنظیم انیمیشن‌های منو
function setupNavbarAnimations() {
    const navbar = document.querySelector('.glass-navbar');
    
    // تغییر استایل منو هنگام اسکرول
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // انیمیشن لینک‌های منو
    const navLinks = document.querySelectorAll('.nav-item-custom');
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.05)';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // انیمیشن دکمه‌های اکشن
    const actionBtns = document.querySelectorAll('.action-btn');
    actionBtns.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.1)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // انیمیشن جستجو
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.05)';
        });
        
        searchInput.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    }
}

// تنظیم اسکرول نرم
function setupSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ===== Performance Functions =====

// Lazy loading تصاویر
function setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// کش کردن داده‌ها
const cache = new Map();

function getCachedData(key) {
    return cache.get(key);
}

function setCachedData(key, data, ttl = 300000) { // 5 دقیقه
    cache.set(key, {
        data: data,
        timestamp: Date.now(),
        ttl: ttl
    });
}

function isCacheValid(key) {
    const cached = cache.get(key);
    if (!cached) return false;
    
    return (Date.now() - cached.timestamp) < cached.ttl;
}

// ===== Responsive Functions =====

// تشخیص اندازه صفحه
function getScreenSize() {
    const width = window.innerWidth;
    if (width >= 1400) return 'xl';
    if (width >= 1200) return 'lg';
    if (width >= 992) return 'md';
    if (width >= 768) return 'sm';
    if (width >= 576) return 'xs';
    return 'mobile';
}

// تنظیم responsive behavior
function setupResponsiveBehavior() {
    const screenSize = getScreenSize();
    
    // تنظیم تعداد ستون‌های محصولات بر اساس اندازه صفحه
    const productGrid = document.querySelector('.product-grid');
    if (productGrid) {
        switch (screenSize) {
            case 'xl':
                productGrid.style.gridTemplateColumns = 'repeat(5, 1fr)';
                break;
            case 'lg':
                productGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
                break;
            case 'md':
                productGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
                break;
            case 'sm':
                productGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
                break;
            default:
                productGrid.style.gridTemplateColumns = '1fr';
        }
    }
    
    // تنظیم اندازه فونت‌ها
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        switch (screenSize) {
            case 'xl':
                heroTitle.style.fontSize = '4rem';
                break;
            case 'lg':
                heroTitle.style.fontSize = '3.5rem';
                break;
            case 'md':
                heroTitle.style.fontSize = '3rem';
                break;
            case 'sm':
                heroTitle.style.fontSize = '2.5rem';
                break;
            case 'xs':
                heroTitle.style.fontSize = '2.2rem';
                break;
            default:
                heroTitle.style.fontSize = '1.8rem';
        }
    }
    
    // تنظیم منو برای موبایل
    if (screenSize === 'mobile' || screenSize === 'xs') {
        setupMobileOptimizations();
    }
}

// بهینه‌سازی‌های موبایل
function setupMobileOptimizations() {
    // کاهش انیمیشن‌ها برای موبایل
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        document.body.style.setProperty('--animation-duration', '0.1s');
    }
    
    // تنظیم touch targets
    const touchTargets = document.querySelectorAll('.btn, .nav-link, .dropdown-item');
    touchTargets.forEach(target => {
        target.style.minHeight = '44px';
        target.style.minWidth = '44px';
    });
    
    // بهبود اسکرول
    document.body.style.scrollBehavior = 'smooth';
    
    // تنظیم viewport برای موبایل
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
}

// تنظیم responsive images
function setupResponsiveImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
        
        // تنظیم srcset برای تصاویر مختلف
        if (img.src && !img.srcset) {
            const src = img.src;
            const baseName = src.substring(0, src.lastIndexOf('.'));
            const extension = src.substring(src.lastIndexOf('.'));
            
            img.srcset = `
                ${baseName}-small${extension} 480w,
                ${baseName}-medium${extension} 768w,
                ${baseName}-large${extension} 1200w,
                ${src} 1400w
            `;
            img.sizes = '(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw';
        }
    });
}

// تنظیم responsive tables
function setupResponsiveTables() {
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        const wrapper = document.createElement('div');
        wrapper.style.overflowX = 'auto';
        wrapper.style.width = '100%';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    });
}

// تنظیم responsive forms
function setupResponsiveForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (getScreenSize() === 'mobile' || getScreenSize() === 'xs') {
                input.style.fontSize = '16px'; // جلوگیری از zoom در iOS
            }
        });
    });
}

// Event listener برای تغییر اندازه صفحه
window.addEventListener('resize', debounce(() => {
    setupResponsiveBehavior();
    setupResponsiveImages();
    setupResponsiveTables();
    setupResponsiveForms();
}, 250));

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== Export Functions =====

// Export functions for use in other files
window.MobixStore = {
    addToCart,
    removeFromCart,
    addToWishlist,
    removeFromWishlist,
    viewProduct,
    searchProducts,
    applyFilters,
    clearFilters,
    showNotification,
    formatPrice,
    generateStarRating,
    validateEmail,
    validatePhone,
    validatePassword,
    checkUserLogin,
    logoutUser,
    getScreenSize,
    setupResponsiveBehavior,
    setupMobileOptimizations
};

// ===== Initialize =====

// اجرای توابع اولیه
document.addEventListener('DOMContentLoaded', function() {
    checkUserLogin();
    loadCart();
    loadWishlist();
    setupMobileMenu();
    setupSmoothScroll();
    setupLazyLoading();
    
    // تنظیم responsive behavior
    setupResponsiveBehavior();
    setupResponsiveImages();
    setupResponsiveTables();
    setupResponsiveForms();
    
    // تنظیم بهینه‌سازی‌های موبایل
    if (isMobile()) {
        setupMobileOptimizations();
    }
});
    setupMobileOptimizations
}; 