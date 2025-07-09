<?php
header('Content-Type: application/json');

// Получаем токен из заголовка
$token = str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION'] ?? '');

// Удаляем токен
$tokens_file = __DIR__ . '/admin_tokens.json';
if (file_exists($tokens_file)) {
    $tokens = json_decode(file_get_contents($tokens_file), true);
    unset($tokens[$token]);
    file_put_contents($tokens_file, json_encode($tokens, JSON_PRETTY_PRINT));
}

echo json_encode(['success' => true]);
?>