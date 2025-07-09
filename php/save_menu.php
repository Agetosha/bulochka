<?php
header('Content-Type: application/json');

// Логирование
file_put_contents('telegram_debug.log', date('Y-m-d H:i:s') . " - Save menu request\n", FILE_APPEND);

// Получаем токен из заголовков
$headers = getallheaders();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : '';

file_put_contents('telegram_debug.log', "Token: $token\n", FILE_APPEND);

$tokens_file = __DIR__ . '/admin_tokens.json';
if (!file_exists($tokens_file)) {
    file_put_contents('telegram_debug.log', "Tokens file not found\n", FILE_APPEND);
    http_response_code(401);
    die(json_encode(['success' => false, 'error' => 'Tokens file not found']));
}

$tokens = json_decode(file_get_contents($tokens_file), true);
if (!isset($tokens[$token])) {
    file_put_contents('telegram_debug.log', "Invalid token\n", FILE_APPEND);
    http_response_code(401);
    die(json_encode(['success' => false, 'error' => 'Unauthorized']));
}

// Получаем данные
$data = json_decode(file_get_contents('php://input'), true);
if (json_last_error() !== JSON_ERROR_NONE) {
    file_put_contents('telegram_debug.log', "Invalid JSON: " . json_last_error_msg() . "\n", FILE_APPEND);
    http_response_code(400);
    die(json_encode(['success' => false, 'error' => 'Invalid JSON']));
}

// Сохраняем меню
$result = file_put_contents(__DIR__ . '/menu.json', json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
if ($result === false) {
    $error = error_get_last();
    file_put_contents('telegram_debug.log', "Save failed: " . $error['message'] . "\n", FILE_APPEND);
    http_response_code(500);
    die(json_encode(['success' => false, 'error' => 'Failed to save menu']));
}

file_put_contents('telegram_debug.log', "Menu saved successfully\n", FILE_APPEND);
echo json_encode(['success' => true]);
?>