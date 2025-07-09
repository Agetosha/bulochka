<?php
$new_password = 'ваш_новый_сложный_пароль';
$hash = password_hash($new_password, PASSWORD_BCRYPT);

file_put_contents('admin_credentials.php', 
    "<?php\n\$admin_credentials = [\n    'username' => 'admin',\n    'password_hash' => '$hash'\n];");

echo "Пароль изменен на: $new_password";
?>