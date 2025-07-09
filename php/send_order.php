<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: text/plain; charset=utf-8");

$log_file = '/var/www/telegram_debug.log';

// Принудительная очистка буфера
ob_start();
var_dump($_POST);
$post_dump = ob_get_clean();

file_put_contents($log_file, "\n\n[".date('Y-m-d H:i:s')."] Новый запрос:\n".$post_dump, FILE_APPEND);

// Проверка данных
if (empty($_POST)) {
    $input = file_get_contents('php://input');
    file_put_contents($log_file, "\nRaw input: ".$input, FILE_APPEND);
    die("Error: No POST data");
}

// Формируем сообщение
$text = "🛒 НОВЫЙ ЗАКАЗ:\n\n";
$text .= "👤 Имя: ".htmlspecialchars($_POST['name'] ?? 'не указано')."\n";
$text .= "📞 Телефон: ".htmlspecialchars($_POST['phone'] ?? 'не указано')."\n";
$text .= "💳 Способ оплаты: ".htmlspecialchars($_POST['payment_method'] ?? 'не указан')."\n";
$text .= "💰 Сумма: ".htmlspecialchars($_POST['total'] ?? '0')." руб.\n";
$text .= "💬 Комментарий: ".htmlspecialchars($_POST['comment'] ?? 'нет')."\n\n";
$text .= "📦 Заказ:\n".htmlspecialchars($_POST['order'] ?? 'не указано');

file_put_contents($log_file, "\nТекст сообщения: ".$text, FILE_APPEND);

// Отправка в Telegram через cURL
$token = "8051825474:AAFQ6HtUxtJjR6xECcqhJ1IutFoMiBrhuCo";
$chat_id = "1512193467";
$url = "https://api.telegram.org/bot$token/sendMessage";

$post_data = [
    'chat_id' => $chat_id,
    'text' => $text
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post_data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Для теста, в продакшене лучше true
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);

curl_close($ch);

file_put_contents($log_file, "\nОтвет Telegram (cURL): HTTP $http_code\n$response", FILE_APPEND);

if ($http_code != 200 || strpos($response, '"ok":true') === false) {
    file_put_contents($log_file, "\nОшибка cURL: $curl_error", FILE_APPEND);
    echo "ERROR";
} else {
    echo "OK";
}
?>