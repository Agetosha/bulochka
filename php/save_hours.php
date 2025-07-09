<?php
header('Content-Type: application/json');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Логирование в /tmp
file_put_contents('/tmp/bulochka.log', "Start at ".date('Y-m-d H:i:s')."\n", FILE_APPEND);

// Проверка токена
$token = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (empty($token)) {
    http_response_code(401);
    die(json_encode(['success' => false, 'error' => 'No token provided']));
}

// Упрощенная проверка без file_get_contents
$tokens_file = __DIR__ . '/admin_tokens.json';
if (!file_exists($tokens_file)) {
    http_response_code(401);
    die(json_encode(['success' => false, 'error' => 'No tokens file']));
}

$tokens = json_decode(file_get_contents($tokens_file), true);
if (!isset($tokens[$token]) || $tokens[$token]['expires'] < time()) {
    http_response_code(401);
    die(json_encode(['success' => false, 'error' => 'Invalid token']));
}

// Основная логика
try {
    $input = file_get_contents('php://input');
    file_put_contents('/tmp/bulochka.log', "Input: $input\n", FILE_APPEND);
    
    $data = json_decode($input, true);
    if (!$data) {
        throw new Exception("Invalid JSON data");
    }

    $open = (int)($data['open'] ?? 8);
    $close = (int)($data['close'] ?? 21);
    
    $hours = [
        'hero' => "Каждый день с $open:00 до $close:00",
        'about' => "Каждое утро свежая выпечка и ароматный кофе ждут вас с $open:00 до $close:00.",
        'contacts' => "Ежедневно с $open:00 до $close:00"
    ];
    
    $filePath = __DIR__.'/working_hours.json';
    if (file_put_contents($filePath, json_encode($hours)) === false) {
        throw new Exception("Failed to write file");
    }
    
    echo json_encode(['success' => true]);
    
} catch (Exception $e) {
    file_put_contents('/tmp/bulochka.log', "Error: ".$e->getMessage()."\n", FILE_APPEND);
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>