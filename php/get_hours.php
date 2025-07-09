<?php
header('Content-Type: application/json');

// Включим вывод ошибок для отладки
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Проверим существование auth.php
if (!file_exists('admin_auth.php')) {
    die(json_encode(['success' => false, 'error' => 'Файл auth.php не найден']));
}

require_once 'admin_auth.php';

$filePath = __DIR__.'/working_hours.json';
$defaultHours = [
    'hero' => 'Каждый день с 8:00 до 21:00',
    'about' => 'Каждое утро свежая выпечка и ароматный кофе ждут вас с 8:00 до 21:00.',
    'contacts' => 'Ежедневно с 8:00 до 21:00'
];

try {
    if (!file_exists($filePath)) {
        file_put_contents($filePath, json_encode($defaultHours, JSON_UNESCAPED_UNICODE));
        echo json_encode($defaultHours);
        exit;
    }

    $content = file_get_contents($filePath);
    if ($content === false) {
        throw new Exception('Ошибка чтения файла');
    }

    $hours = json_decode($content, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Ошибка декодирования JSON: '.json_last_error_msg());
    }

    // Проверяем структуру данных
    foreach ($defaultHours as $key => $value) {
        if (!isset($hours[$key])) {
            $hours[$key] = $value;
        }
    }

    echo json_encode($hours);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode($defaultHours);
}
?>