<?php
header('Content-Type: application/json');

// Включим базовые меры безопасности
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Конфигурация безопасности
$security_config = [
    'max_attempts' => 8,        // Максимум попыток входа
    'block_time' => 300,        // Блокировка на 5 минут
    'min_password_length' => 8  // Минимальная длина пароля
];

// Проверка HTTP метода
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Метод не поддерживается']));
}

// Подключение к базе данных или файлу блокировок
$block_file = __DIR__ . '/admin_auth_blocked.json';

// Проверка блокировки
function isBlocked($ip, $block_file) {
    if (!file_exists($block_file)) return false;
    
    $data = json_decode(file_get_contents($block_file), true);
    return isset($data[$ip]) && $data[$ip]['attempts'] >= 5 && 
           (time() - $data[$ip]['last_attempt']) < 300;
}

// Обработка блокировки
function recordAttempt($ip, $block_file) {
    $data = file_exists($block_file) ? json_decode(file_get_contents($block_file), true) : [];
    
    if (!isset($data[$ip])) {
        $data[$ip] = ['attempts' => 1, 'last_attempt' => time()];
    } else {
        $data[$ip]['attempts']++;
        $data[$ip]['last_attempt'] = time();
    }
    
    file_put_contents($block_file, json_encode($data, JSON_PRETTY_PRINT));
}

// Получаем IP клиента
$ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'];

// Проверяем блокировку
if (isBlocked($ip, $block_file)) {
    http_response_code(429);
    die(json_encode(['success' => false, 'message' => 'Слишком много попыток. Попробуйте позже.']));
}

// Получаем данные из запроса
$data = json_decode(file_get_contents('php://input'), true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Неверный формат данных']));
}

$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

// Валидация ввода
if (empty($username) || empty($password)) {
    recordAttempt($ip, $block_file);
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Логин и пароль обязательны']));
}

// Загружаем учетные данные из защищенного файла
$credentials_file = __DIR__ . '/admin_credentials.php';
if (!file_exists($credentials_file)) {
    // Создаем файл с учетными данными при первом запуске
    $default_hash = password_hash('admin123', PASSWORD_BCRYPT);
    file_put_contents($credentials_file, 
        "<?php\n\$admin_credentials = [\n    'username' => 'admin',\n    'password_hash' => '$default_hash'\n];");
}

include $credentials_file;

// Проверяем учетные данные
if (!isset($admin_credentials)) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Ошибка сервера']));
}

if ($username === $admin_credentials['username'] && 
    password_verify($password, $admin_credentials['password_hash'])) {
    
    // Генерируем безопасный токен
    $token = bin2hex(random_bytes(32));
    $expires = time() + 3600; // 1 час
    
    // Сохраняем токен в файл (вместо БД)
    $tokens_file = __DIR__ . '/admin_tokens.json';
    $tokens = file_exists($tokens_file) ? json_decode(file_get_contents($tokens_file), true) : [];
    $tokens[$token] = [
        'ip' => $ip,
        'expires' => $expires,
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
    ];
    file_put_contents($tokens_file, json_encode($tokens, JSON_PRETTY_PRINT));
    
    // Удаляем предыдущие неудачные попытки
    if (file_exists($block_file)) {
        $block_data = json_decode(file_get_contents($block_file), true);
        unset($block_data[$ip]);
        file_put_contents($block_file, json_encode($block_data, JSON_PRETTY_PRINT));
    }
    
    echo json_encode([
        'success' => true,
        'token' => $token,
        'expires' => $expires
    ]);
} else {
    recordAttempt($ip, $block_file);
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Неверные учетные данные']);
}
?>