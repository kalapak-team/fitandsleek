<?php
// ✅ FILE: backend/routes/api.php
// ✅ Single, clean, full version (no duplicates, correct homepage route placement)

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AuthSessionController;
use App\Http\Controllers\Api\SocialAuthController;
use App\Http\Controllers\Api\BakongPaymentController;

// Storefront
use App\Http\Controllers\Api\Storefront\CategoryController;
use App\Http\Controllers\Api\Storefront\ProductController;
use App\Http\Controllers\Api\Storefront\CartController;
use App\Http\Controllers\Api\Storefront\OrderController;
use App\Http\Controllers\Api\Storefront\PaymentController;
use App\Http\Controllers\Api\Storefront\BannerController;
use App\Http\Controllers\Api\Storefront\CollectionController as StorefrontCollectionController;
use App\Http\Controllers\Api\Admin\ShipmentQrController;
use App\Http\Controllers\Api\Storefront\BrandController as StorefrontBrandController;
use App\Http\Controllers\Api\Storefront\MenuController as StorefrontMenuController;
use App\Http\Controllers\Api\Storefront\ImageSearchController;
use App\Http\Controllers\Api\Storefront\ShipmentTrackingController;
use App\Http\Controllers\Api\Storefront\NotificationController;
use App\Http\Controllers\Api\Storefront\CustomerProfileController;
use App\Http\Controllers\Api\Storefront\ReplacementCaseController as StorefrontReplacementCaseController;
use App\Http\Controllers\Api\Storefront\ChatbotController;
use App\Http\Controllers\Api\Storefront\LegalContentController;
use App\Http\Controllers\Api\Admin\ChatbotSettingsController;
use App\Http\Controllers\Api\ProductSearchController;

// Admin
use App\Http\Controllers\Api\Admin\HomepageAdminController;
use App\Http\Controllers\Api\Admin\HomepageSettingsController;
use App\Http\Controllers\Api\Admin\CategoryAdminController;
use App\Http\Controllers\Api\Admin\ProductAdminController;
use App\Http\Controllers\Api\Admin\OrderAdminController;
use App\Http\Controllers\Api\Admin\InvoiceAdminController;
use App\Http\Controllers\Api\Admin\CustomerAdminController;
use App\Http\Controllers\Api\Admin\BannerAdminController;
use App\Http\Controllers\Api\Admin\CollectionAdminController;
use App\Http\Controllers\Api\Admin\SettingAdminController;
use App\Http\Controllers\Api\Admin\ReportController;
use App\Http\Controllers\Api\Admin\BrandAdminController;
use App\Http\Controllers\Api\Admin\MenuAdminController;
use App\Http\Controllers\Api\Admin\PaymentAdminController;
use App\Http\Controllers\Api\Admin\PaymentSettingsController;
use App\Http\Controllers\Api\Admin\ShipmentAdminController;
use App\Http\Controllers\Api\Admin\ReplacementCaseAdminController;
use App\Http\Controllers\Api\Admin\SuperAdminController;
use App\Http\Controllers\Api\Driver\ShipmentDriverController;

// Admin - Search & Notifications
use App\Http\Controllers\Api\Admin\AdminSearchController;
use App\Http\Controllers\Api\Admin\AdminNotificationController;
use App\Http\Controllers\Api\Admin\ContactController;
use App\Http\Controllers\Api\Admin\ProfileController;
use App\Http\Controllers\Api\Admin\FooterHeaderController;
use App\Http\Controllers\Api\Admin\SaleAdminController;
use App\Http\Controllers\Api\Admin\DriverAdminController;

Route::get('/health', fn() => response()->json(['ok' => true]));

// Current user
Route::get('/me', function (Request $request) {
    return response()->json($request->user());
})->middleware(['auth:sanctum', 'device.bound']);

// -------------------------
// AUTH
// -------------------------
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/otp/verify', [AuthController::class, 'verifyOtp']);
Route::post('/auth/otp/resend', [AuthController::class, 'resendOtp']);
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware(['auth:sanctum', 'device.bound']);
Route::post('/auth/driver/token', [AuthController::class, 'driverToken'])->middleware(['auth:sanctum', 'device.bound']);
Route::get('/auth/sessions', [AuthSessionController::class, 'index'])->middleware(['auth:sanctum', 'device.bound']);
Route::delete('/auth/sessions/{session}', [AuthSessionController::class, 'destroy'])->middleware(['auth:sanctum', 'device.bound']);
Route::get('/auth/facebook/redirect-direct', [AuthController::class, 'redirectToFacebook']);
Route::get('/auth/facebook/callback-direct', [AuthController::class, 'handleFacebookCallback']);
Route::get('/auth/{provider}/redirect', [SocialAuthController::class, 'redirect']);
Route::get('/auth/{provider}/callback', [SocialAuthController::class, 'callback']);
Route::get('/auth/social/exchange/{ticket}', [SocialAuthController::class, 'exchange']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:10,1');

// -------------------------
// PUBLIC STOREFRONT
// -------------------------
Route::get('/menus', [StorefrontMenuController::class, 'index']); // header WOMEN/MEN mega menu
Route::get('/homepage', [HomepageAdminController::class, 'show']); // public homepage data (optional)

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/discounts', [ProductController::class, 'discounts']);
Route::get('/products/{slug}', [ProductController::class, 'show']);

Route::get('/banners', [BannerController::class, 'all']);
Route::get('/banners/{position}', [BannerController::class, 'index']);

Route::get('/collections', [StorefrontCollectionController::class, 'index']);
Route::get('/collections/{slug}', [StorefrontCollectionController::class, 'show']);

Route::get('/brands', [StorefrontBrandController::class, 'index']);
Route::get('/brands/{slug}', [StorefrontBrandController::class, 'show']);

// Public chatbot (guests + customers)
Route::post('/chatbot/message', [ChatbotController::class, 'message']);
Route::get('/chatbot/settings', [ChatbotController::class, 'settings']);

// Bakong KHQR webhook (optional)
Route::post('/payments/khqr/webhook', [PaymentController::class, 'khqrWebhook']);

// Public notifications (guests)
Route::get('/notifications/public', [NotificationController::class, 'index']);

// Image Search (vector similarity)
Route::post('/image-search', [ImageSearchController::class, 'search']);
Route::post('/vision/search', [ImageSearchController::class, 'search']);
Route::post('/scan', [ImageSearchController::class, 'search']);
Route::post('/products/search-image', [ProductSearchController::class, 'searchByImage']);

// Public shipment tracking
Route::get('/shipments/track', [ShipmentTrackingController::class, 'track']);

// Contact Form (public)
Route::post('/contact', [ContactController::class, 'store']);
Route::get('/legal-content', [LegalContentController::class, 'index']);

// Public footer & header content
Route::get('/footer-header', [FooterHeaderController::class, 'index']);
Route::get('/homepage-settings', [HomepageSettingsController::class, 'getSettings']);

// -------------------------
// AUTH STOREFRONT
// -------------------------
Route::middleware(['auth:sanctum', 'device.bound'])->group(function () {
    Route::get('/cart', [CartController::class, 'show']);
    Route::post('/cart/items', [CartController::class, 'addItem']);
    Route::patch('/cart/items/{itemId}', [CartController::class, 'updateItem']);
    Route::delete('/cart/items/{itemId}', [CartController::class, 'removeItem']);

    Route::post('/checkout', [OrderController::class, 'checkout']);
    Route::get('/orders', [OrderController::class, 'myOrders']);
    Route::get('/orders/{orderNumber}/track', [OrderController::class, 'trackOrder']);
    Route::get('/orders/{order}', [PaymentController::class, 'show']);

    Route::post('/driver/update-status', [ShipmentDriverController::class, 'updateStatus'])
        ->middleware('driver');
    Route::post('/driver/scan', [ShipmentDriverController::class, 'scan'])
        ->middleware(['driver', 'throttle:30,1']);
    Route::get('/driver/receipt', [ShipmentDriverController::class, 'receipt'])
        ->middleware(['driver', 'throttle:30,1']);

    // Payment Processing
    Route::post('/payments/{order}/verify-bkash', [PaymentController::class, 'verifyBKash']);
    Route::post('/payments/{order}/process-card', [PaymentController::class, 'processCard']);

    // KHQR Payments
    Route::post('/payments/khqr/create', [PaymentController::class, 'createKhqr']);
    Route::get('/payments/khqr/status/{orderId}', [PaymentController::class, 'khqrStatus'])
        ->middleware('throttle:20,1');

    // Bakong KHQR (Node generated)
    Route::post('/payments/bakong/create', [BakongPaymentController::class, 'create']);
    Route::get('/payments/bakong/status/{payment}', [BakongPaymentController::class, 'status'])
        ->whereNumber('payment')
        ->middleware('throttle:30,1');

    // User Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // User Profile
    Route::get('/user/profile', [CustomerProfileController::class, 'getProfile']);
    Route::put('/user/profile', [CustomerProfileController::class, 'updateProfile']);
    Route::post('/user/profile/image', [CustomerProfileController::class, 'uploadProfileImage']);
    Route::get('/user/orders', [CustomerProfileController::class, 'getOrders']);
    Route::get('/user/addresses', [CustomerProfileController::class, 'getAddresses']);
    Route::post('/user/addresses', [CustomerProfileController::class, 'addAddress']);
    Route::put('/user/addresses/{id}', [CustomerProfileController::class, 'updateAddress']);
    Route::delete('/user/addresses/{id}', [CustomerProfileController::class, 'deleteAddress']);
    Route::get('/user/wishlist', [CustomerProfileController::class, 'getWishlist']);
    Route::get('/user/activity', [CustomerProfileController::class, 'getActivity']);

    // Replacement Cases (Customer)
    Route::get('/replacement-cases', [StorefrontReplacementCaseController::class, 'index']);
    Route::get('/replacement-cases/order/{orderId}', [StorefrontReplacementCaseController::class, 'byOrder']);
    Route::post('/replacement-cases', [StorefrontReplacementCaseController::class, 'store']);
});

// -------------------------
// ADMIN
// -------------------------
Route::middleware(['auth:sanctum', 'device.bound', 'admin'])->prefix('admin')->group(function () {
    // Home Page Manager (banners + collections + categories + brands + menus)
    Route::get('/homepage', [HomepageAdminController::class, 'show']);

    // Homepage Settings Management
    Route::get('/homepage-settings', [HomepageSettingsController::class, 'getSettings']);
    Route::put('/homepage-settings/sections', [HomepageSettingsController::class, 'updateSections']);
    Route::put('/homepage-settings/header', [HomepageSettingsController::class, 'updateHeader']);
    Route::put('/homepage-settings/footer', [HomepageSettingsController::class, 'updateFooter']);
    Route::put('/homepage-settings/footer-sections', [HomepageSettingsController::class, 'updateFooterSections']);
    Route::post('/homepage-settings/save-all', [HomepageSettingsController::class, 'saveAll']);

    // Extended Homepage Settings (NEW IN, WOMEN, MEN, BOYS, Hero Banner)
    Route::put('/homepage-settings/hero', [HomepageSettingsController::class, 'updateHero']);
    Route::put('/homepage-settings/sections-extended', [HomepageSettingsController::class, 'updateSectionsExtended']);
    Route::put('/homepage-settings/header-extended', [HomepageSettingsController::class, 'updateHeaderExtended']);
    Route::put('/homepage-settings/footer-extended', [HomepageSettingsController::class, 'updateFooterExtended']);
    Route::post('/homepage-settings/logo-upload', [HomepageSettingsController::class, 'uploadLogo']);
    Route::post('/homepage-settings/menu-image-upload', [HomepageSettingsController::class, 'uploadMenuImage']);

    // Product gallery image upload
    Route::post('/products/gallery-upload', [ProductAdminController::class, 'uploadGalleryImage']);

    // CRUD
    Route::apiResource('categories', CategoryAdminController::class);
    Route::apiResource('brands', BrandAdminController::class);
    Route::apiResource('products', ProductAdminController::class);
    Route::apiResource('banners', BannerAdminController::class);
    Route::apiResource('collections', CollectionAdminController::class);
    Route::apiResource('menus', MenuAdminController::class);

    // Settings (bulk must be BEFORE apiResource to avoid conflict with {setting})
    Route::put('/settings/bulk', [SettingAdminController::class, 'bulkUpdate']);
    Route::apiResource('settings', SettingAdminController::class);

    // Orders
    Route::get('orders', [OrderAdminController::class, 'index']);
    Route::post('orders/invoices/bulk-pdf', [InvoiceAdminController::class, 'bulkDownloadPdf']);
    Route::get('orders/{order}', [OrderAdminController::class, 'show']);
    Route::get('orders/{order}/invoice', [InvoiceAdminController::class, 'show']);
    Route::get('orders/{order}/invoice/pdf', [InvoiceAdminController::class, 'downloadPdf']);
    Route::patch('orders/{order}', [OrderAdminController::class, 'update']);
    Route::delete('orders/{order}', [OrderAdminController::class, 'destroy']);

    // Customers (full CRUD) - Using explicit routes to avoid implicit model binding
    Route::get('customers', [CustomerAdminController::class, 'index']);
    Route::post('customers', [CustomerAdminController::class, 'store']);
    Route::get('customers/{customer}', [CustomerAdminController::class, 'show']);
    Route::patch('customers/{customer}', [CustomerAdminController::class, 'update']);
    Route::delete('customers/{customer}', [CustomerAdminController::class, 'destroy']);

    // Reports
    Route::get('/reports/dashboard', [ReportController::class, 'dashboard']);
    Route::get('/reports/sales', [ReportController::class, 'sales']);
    Route::get('/reports/monthly-driver-performance', [ReportController::class, 'monthlyDriverPerformance']);
    Route::get('/reports/top-products', [ReportController::class, 'topProducts']);
    Route::get('/reports/categories', [ReportController::class, 'categoryPerformance']);
    Route::get('/reports/recent-orders', [ReportController::class, 'recentOrders']);
    Route::get('/reports/generate', [ReportController::class, 'generate']);
    Route::get('/reports/download-pdf', [ReportController::class, 'downloadPdf']);

    // Admin Search & Notifications
    Route::get('/search', [AdminSearchController::class, 'search']);
    Route::get('/notifications', [AdminNotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [AdminNotificationController::class, 'markAsRead']);
    Route::post('/notifications/mark-all-read', [AdminNotificationController::class, 'markAllRead']);
    Route::delete('/notifications/{id}', [AdminNotificationController::class, 'destroy']);

    // Contacts Management
    Route::apiResource('contacts', ContactController::class);
    Route::post('/contacts/bulk-update', [ContactController::class, 'bulkUpdate']);
    Route::post('/contacts/bulk-delete', [ContactController::class, 'bulkDelete']);

    // Profile Management
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
    Route::post('/profile/upload-image', [ProfileController::class, 'uploadImage']);

    // Footer & Header Management
    Route::get('/footer-header', [FooterHeaderController::class, 'index']);
    Route::get('/shipments/{shipment}/qr', [ShipmentQrController::class, 'png']);
    Route::put('/footer', [FooterHeaderController::class, 'updateFooter']);
    Route::put('/header', [FooterHeaderController::class, 'updateHeader']);
    Route::put('/social', [FooterHeaderController::class, 'updateSocial']);
    Route::post('/footer-header/seed', [FooterHeaderController::class, 'seedDefaults']);

    // Messages Management
    Route::apiResource('messages', \App\Http\Controllers\Api\Admin\AdminMessageController::class);
    Route::patch('/messages/{message}/toggle-active', [\App\Http\Controllers\Api\Admin\AdminMessageController::class, 'toggleActive']);
    Route::post('/messages/media-upload', [\App\Http\Controllers\Api\Admin\AdminMessageController::class, 'uploadMedia']);

    // Chatbot Settings
    Route::get('/chatbot/settings', [ChatbotSettingsController::class, 'show']);
    Route::put('/chatbot/settings', [ChatbotSettingsController::class, 'update']);

    // Sales Management
    Route::apiResource('sales', SaleAdminController::class);
    Route::post('/sales/bulk-toggle', [SaleAdminController::class, 'bulkToggle']);
    Route::get('/sales/active/all', [SaleAdminController::class, 'getActiveSales']);

    // Payments Management
    Route::get('/payments', [PaymentAdminController::class, 'index']);
    Route::get('/payments/{payment}', [PaymentAdminController::class, 'show']);
    Route::post('/payments/{payment}/verify', [PaymentAdminController::class, 'verify']);
    Route::post('/payments/{payment}/reject', [PaymentAdminController::class, 'reject']);
    Route::get('/payments/statistics', [PaymentAdminController::class, 'statistics']);

    // Shipments Management
    Route::get('/shipments', [ShipmentAdminController::class, 'index']);
    Route::get('/shipments/order/{orderId}', [ShipmentAdminController::class, 'byOrder']);
    Route::post('/shipments', [ShipmentAdminController::class, 'store']);
    Route::patch('/shipments/{shipment}/status', [ShipmentAdminController::class, 'updateStatus']);
    Route::post('/shipments/{shipment}/tracking-events', [ShipmentAdminController::class, 'addTrackingEvent']);
    Route::get('/shipments/providers', [ShipmentAdminController::class, 'providers']);

    // Drivers Management
    Route::get('/drivers', [DriverAdminController::class, 'index']);
    Route::post('/drivers', [DriverAdminController::class, 'store']);
    Route::match(['put', 'patch'], '/drivers/{driver}', [DriverAdminController::class, 'update']);
    Route::get('/drivers/{driver}/scans', [DriverAdminController::class, 'scans']);

    // Replacement Cases Management
    Route::get('/replacement-cases', [ReplacementCaseAdminController::class, 'index']);
    Route::post('/replacement-cases', [ReplacementCaseAdminController::class, 'store']);
    Route::get('/replacement-cases/order/{orderId}', [ReplacementCaseAdminController::class, 'byOrder']);
    Route::patch('/replacement-cases/{case}', [ReplacementCaseAdminController::class, 'update']);
    Route::post('/replacement-cases/{case}/approve', [ReplacementCaseAdminController::class, 'approve']);
    Route::post('/replacement-cases/{case}/reject', [ReplacementCaseAdminController::class, 'reject']);
    Route::post('/replacement-cases/{case}/complete', [ReplacementCaseAdminController::class, 'complete']);
    Route::get('/replacement-cases/statistics', [ReplacementCaseAdminController::class, 'statistics']);

    // Superadmin Routes (only accessible by superadmin)
    Route::middleware('superadmin')->group(function () {
        Route::get('/superadmin/users', [SuperAdminController::class, 'allUsers']);
        Route::post('/superadmin/admin-users', [SuperAdminController::class, 'createAdmin']);
        Route::patch('/superadmin/users/{user}/role', [SuperAdminController::class, 'updateRole']);
        Route::patch('/superadmin/users/{user}/status', [SuperAdminController::class, 'updateStatus']);
        Route::get('/superadmin/users/{user}/sessions', [SuperAdminController::class, 'userSessions']);
        Route::delete('/superadmin/users/{user}/sessions/{session}', [SuperAdminController::class, 'revokeUserSession']);
        Route::get('/superadmin/statistics', [SuperAdminController::class, 'systemStatistics']);
        Route::get('/superadmin/user-logs', [SuperAdminController::class, 'userLogs']);

        // Payment Settings Management (superadmin only)
        Route::get('/superadmin/payment-settings', [PaymentSettingsController::class, 'index']);
        Route::put('/superadmin/payment-settings', [PaymentSettingsController::class, 'update']);
    });
});
