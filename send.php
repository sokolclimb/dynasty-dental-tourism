<?php
// Приём заявок: почта + Telegram. Настройте константы ниже. PHP 7.4+.
// Токены храните здесь (на сервере), а не в config.js.
const MAIL_TO      = 'coordinator@example.ru';   // TODO
const TG_BOT_TOKEN = '';                          // TODO: токен бота (@BotFather)
const TG_CHAT_ID   = '';                          // TODO: chat_id координатора/группы
const UPLOAD_DIR   = __DIR__ . '/../ct_private';  // ВНЕ публичной папки сайта!
const MAX_BYTES    = 50 * 1024 * 1024;
const ALLOWED_EXT  = ['zip','dcm','jpg','jpeg','png','pdf'];

header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit('{}'); }
if (!empty($_POST['company'])) { echo '{"ok":true}'; exit; }           // honeypot

// простой лимит: не чаще 1 заявки в 30 сек с одного IP
$flag = sys_get_temp_dir() . '/lead_' . md5($_SERVER['REMOTE_ADDR'] ?? '');
if (file_exists($flag) && time() - filemtime($flag) < 30) { http_response_code(429); exit('{"ok":false}'); }
touch($flag);

$clean = fn($k) => trim(strip_tags($_POST[$k] ?? ''));
$phone = $clean('phone');
if (strlen(preg_replace('/\D/', '', $phone)) < 10 || ($_POST['consent'] ?? '') !== 'yes') { http_response_code(422); exit('{"ok":false}'); }

$file = '';
if (!empty($_FILES['ctfile']['tmp_name']) && $_FILES['ctfile']['error'] === UPLOAD_ERR_OK) {
  $ext = strtolower(pathinfo($_FILES['ctfile']['name'], PATHINFO_EXTENSION));
  if (in_array($ext, ALLOWED_EXT, true) && $_FILES['ctfile']['size'] <= MAX_BYTES) {
    if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0700, true);
    $name = date('Ymd_His') . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
    if (move_uploaded_file($_FILES['ctfile']['tmp_name'], UPLOAD_DIR . '/' . $name)) $file = $name;
  }
}

$text = "Новая заявка (стоматологический туризм)\n"
  . "Имя: " . $clean('name') . "\nТелефон: $phone\n"
  . "Лечение: " . $clean('treatment') . "\nЧелюсть: " . $clean('jaw') . "\nКТ: " . $clean('ct')
  . ($file ? "\nФайл КТ на сервере: $file" : '')
  . ($clean('calc') ? "\nРасчёт: " . $clean('calc') : '')
  . "\nСтраница: " . $clean('page') . "\nСогласие на обработку ПДн: да";

$ok = @mail(MAIL_TO, '=?UTF-8?B?' . base64_encode('Новая заявка с лендинга') . '?=', $text,
  "Content-Type: text/plain; charset=utf-8\r\nFrom: noreply@" . ($_SERVER['HTTP_HOST'] ?? 'localhost'));
if (TG_BOT_TOKEN && TG_CHAT_ID) {
  $ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => 'Content-Type: application/x-www-form-urlencoded',
    'content' => http_build_query(['chat_id' => TG_CHAT_ID, 'text' => $text]), 'timeout' => 8]]);
  $ok = (@file_get_contents('https://api.telegram.org/bot' . TG_BOT_TOKEN . '/sendMessage', false, $ctx) !== false) || $ok;
}
http_response_code($ok ? 200 : 500);
echo json_encode(['ok' => $ok]);
