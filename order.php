<?php
// 1. Данные
$token = "8051825474:AAFQ6HtUxtJjR6xECcqhJ1IutFoMiBrhuCo";
$chat_id = "1512193467";

// 2. Получить данные формы
$name = $_POST['name'] ?? '';
$phone = $_POST['phone'] ?? '';
$comment = $_POST['comment'] ?? '';

$text = "🛒 Новый заказ с сайта:\n";
$text .= "👤 Имя: $name\n";
$text .= "📞 Контакт: $phone\n";
$text .= "💬 Комментарий: $comment";

// 3. Отправка в Telegram
$url = "https://api.telegram.org/bot$token/sendMessage";
$params = [
    'chat_id' => $chat_id,
    'text' => $text,
    'parse_mode' => 'HTML'
];
file_get_contents($url . "?" . http_build_query($params));

// 4. Ответ клиенту (перенаправление)
echo "Спасибо, заказ отправлен!";
exit;
?>