<?php
header('Content-Type: application/json');

// Упрощенная проверка токена
$token = str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION'] ?? '');

if (empty($token)) {
    http_response_code(401);
    die(json_encode(['valid' => false, 'error' => 'Token missing']));
}

$tokens_file = __DIR__ . '/admin_tokens.json';

// Если файла нет - сразу ошибка
if (!file_exists($tokens_file)) {
    http_response_code(401);
    die(json_encode(['valid' => false, 'error' => 'No tokens file']));
}

$tokens = json_decode(file_get_contents($tokens_file), true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(500);
    die(json_encode(['valid' => false, 'error' => 'Invalid tokens file']));
}

// Проверяем токен без проверки IP и User-Agent (для упрощения)
if (isset($tokens[$token]) && $tokens[$token]['expires'] > time()) {
    echo json_encode(['valid' => true]);
} else {
    http_response_code(401);
    echo json_encode(['valid' => false, 'error' => 'Invalid or expired token']);
}
?>