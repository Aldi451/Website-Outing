<?php
declare(strict_types=1);

/**
 * Small PHP/MySQL API for the Outing SPA.
 * Deploy this file and index.html to InfinityFree; copy config.example.php to config.php.
 */
ini_set('display_errors', '0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

const SESSION_COOKIE = 'outing_session';
const SESSION_LIFETIME = 43200; // 12 hours
const MAX_BODY_BYTES = 20971520; // 20 MB

$route = trim((string)($_GET['route'] ?? ''), '/');
$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));

function jsonResponse(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, max-age=0');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function jsResponse(array $state, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/javascript; charset=utf-8');
    header('Cache-Control: no-store, max-age=0');
    $json = json_encode(
        $state,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
    );
    echo "window.__OUTING_SERVER_MODE__ = true;\nwindow.__OUTING_SERVER_STATE__ = " . ($json === false ? '{}' : $json) . ";\n";
    exit;
}

function defaultState(): array
{
    return [
        'outing_current_info' => [
            'id' => 'hosted-outing',
            'name' => 'Outing Bersama',
            'start_date' => '',
            'end_date' => '',
            'event_date' => '',
            'location' => '',
            'address' => '',
            'description' => '',
            'status' => 'PLANNING',
        ],
        'outing_rundowns' => [],
        'outing_transactions' => [],
        'outing_purchases' => [],
        'outing_tasks' => [],
        'outing_consumptions' => [],
        'outing_announcements' => [],
        'outing_participants' => [],
        'outing_archives' => [],
        'outing_local_users' => [],
    ];
}

function appConfig(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }
    $file = __DIR__ . '/config.php';
    if (!is_file($file)) {
        throw new RuntimeException('Berkas config.php belum dibuat dari config.example.php.');
    }
    $loaded = require $file;
    if (!is_array($loaded)) {
        throw new RuntimeException('Format config.php tidak valid.');
    }
    $required = [
        'db_host', 'db_name', 'db_user', 'db_password',
        'admin_username', 'admin_password', 'member_username', 'member_password', 'app_secret'
    ];
    foreach ($required as $key) {
        if (!isset($loaded[$key]) || trim((string)$loaded[$key]) === '' || str_starts_with((string)$loaded[$key], 'REPLACE_') || str_starts_with((string)$loaded[$key], 'CHANGE_THIS_')) {
            throw new RuntimeException('Nilai konfigurasi belum lengkap: ' . $key);
        }
    }
    if (strlen((string)$loaded['app_secret']) < 32) {
        throw new RuntimeException('app_secret harus berisi sedikitnya 32 karakter acak.');
    }
    $admin = strtolower(trim((string)$loaded['admin_username']));
    $member = strtolower(trim((string)$loaded['member_username']));
    if ($admin === '' || $member === '' || $admin === $member) {
        throw new RuntimeException('Username Admin dan Member harus berbeda.');
    }
    $loaded['admin_username'] = $admin;
    $loaded['member_username'] = $member;
    $config = $loaded;
    return $config;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $config = appConfig();
    $dsn = 'mysql:host=' . $config['db_host'] . ';dbname=' . $config['db_name'] . ';charset=utf8mb4';
    $pdo = new PDO($dsn, (string)$config['db_user'], (string)$config['db_password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    // Tables are initialized by PHP inside the database selected in InfinityFree.
    $pdo->exec("CREATE TABLE IF NOT EXISTS outing_app_state (
        state_key VARCHAR(100) NOT NULL PRIMARY KEY,
        state_value LONGTEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec("CREATE TABLE IF NOT EXISTS outing_app_sessions (
        token_hash CHAR(64) NOT NULL PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        role ENUM('ADMIN','MEMBER') NOT NULL,
        expires_at BIGINT UNSIGNED NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_outing_sessions_expiry (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec("CREATE TABLE IF NOT EXISTS outing_login_attempts (
        ip_hash CHAR(64) NOT NULL PRIMARY KEY,
        window_started BIGINT UNSIGNED NOT NULL,
        attempts SMALLINT UNSIGNED NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    return $pdo;
}

function readJsonBody(): array
{
    $length = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($length < 0 || $length > MAX_BODY_BYTES) {
        throw new InvalidArgumentException('Ukuran request terlalu besar.');
    }
    $raw = file_get_contents('php://input');
    if ($raw === false || strlen($raw) > MAX_BODY_BYTES) {
        throw new InvalidArgumentException('Body request tidak valid atau terlalu besar.');
    }
    try {
        $body = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $error) {
        throw new InvalidArgumentException('Body JSON tidak valid.');
    }
    if (!is_array($body) || array_is_list($body)) {
        throw new InvalidArgumentException('Body harus berupa object JSON.');
    }
    return $body;
}

function currentUser(PDO $pdo): ?array
{
    $token = (string)($_COOKIE[SESSION_COOKIE] ?? '');
    if ($token === '' || !preg_match('/^[a-f0-9]{64}$/', $token)) {
        return null;
    }
    $hash = hash('sha256', $token);
    $query = $pdo->prepare('SELECT username, role, expires_at FROM outing_app_sessions WHERE token_hash = ? LIMIT 1');
    $query->execute([$hash]);
    $row = $query->fetch();
    if (!$row) {
        return null;
    }
    if ((int)$row['expires_at'] <= time()) {
        $delete = $pdo->prepare('DELETE FROM outing_app_sessions WHERE token_hash = ?');
        $delete->execute([$hash]);
        return null;
    }
    $admin = $row['role'] === 'ADMIN';
    return [
        'id' => $admin ? 'hosted-admin' : 'hosted-member',
        'username' => (string)$row['username'],
        'full_name' => $admin ? 'Admin Outing' : 'Member Outing',
        'role' => (string)$row['role'],
        'section' => $admin ? 'INISIATOR' : 'PUBLIC',
        'department' => $admin ? 'Panitia' : 'Peserta',
        'phone' => '',
    ];
}

function stateSnapshot(PDO $pdo): array
{
    $state = defaultState();
    $rows = $pdo->query('SELECT state_key, state_value FROM outing_app_state')->fetchAll();
    foreach ($rows as $row) {
        $value = json_decode((string)$row['state_value'], true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $state[(string)$row['state_key']] = $value;
        }
    }
    return $state;
}

function secureCookie(): bool
{
    return (!empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off')
        || strtolower((string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';
}

function setSessionCookie(string $token, int $expires): void
{
    setcookie(SESSION_COOKIE, $token, [
        'expires' => $expires,
        'path' => '/',
        'secure' => secureCookie(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function clearSessionCookie(): void
{
    setcookie(SESSION_COOKIE, '', [
        'expires' => time() - 3600,
        'path' => '/',
        'secure' => secureCookie(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function normalizedOrigin(string $url): ?string
{
    $parts = parse_url($url);
    if (!is_array($parts) || empty($parts['scheme']) || empty($parts['host'])) {
        return null;
    }
    $scheme = strtolower((string)$parts['scheme']);
    if ($scheme !== 'https' && $scheme !== 'http') {
        return null;
    }
    $host = strtolower((string)$parts['host']);
    $port = (int)($parts['port'] ?? ($scheme === 'https' ? 443 : 80));
    return $scheme . '://' . $host . ':' . $port;
}

function requireSameOrigin(): void
{
    $origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($origin === '') {
        return;
    }
    $requestScheme = secureCookie() ? 'https' : 'http';
    $requestOrigin = $requestScheme . '://' . (string)($_SERVER['HTTP_HOST'] ?? '');
    $originValue = normalizedOrigin($origin);
    $requestValue = normalizedOrigin($requestOrigin);
    if ($originValue === null || $requestValue === null || !hash_equals($requestValue, $originValue)) {
        jsonResponse(['error' => 'Origin request tidak diizinkan.'], 403);
    }
}

function verifyConfiguredPassword(string $provided, string $configured): bool
{
    if (str_starts_with($configured, '$2y$') || str_starts_with($configured, '$argon2')) {
        return password_verify($provided, $configured);
    }
    return hash_equals($configured, $provided);
}

function loginIpHash(): string
{
    $config = appConfig();
    return hash_hmac('sha256', (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown'), (string)$config['app_secret']);
}

function loginIsThrottled(PDO $pdo, string $ipHash): bool
{
    $query = $pdo->prepare('SELECT window_started, attempts FROM outing_login_attempts WHERE ip_hash = ? LIMIT 1');
    $query->execute([$ipHash]);
    $row = $query->fetch();
    if (!$row) {
        return false;
    }
    if (time() - (int)$row['window_started'] >= 900) {
        $delete = $pdo->prepare('DELETE FROM outing_login_attempts WHERE ip_hash = ?');
        $delete->execute([$ipHash]);
        return false;
    }
    return (int)$row['attempts'] >= 10;
}

function recordLoginFailure(PDO $pdo, string $ipHash): void
{
    $now = time();
    $cutoff = $now - 900;
    $query = $pdo->prepare('INSERT INTO outing_login_attempts (ip_hash, window_started, attempts) VALUES (?, ?, 1)
        ON DUPLICATE KEY UPDATE
        attempts = IF(window_started < ?, 1, attempts + 1),
        window_started = IF(window_started < ?, VALUES(window_started), window_started)');
    $query->execute([$ipHash, $now, $cutoff, $cutoff]);
}

function cleanParticipantState($value): array
{
    if (!is_array($value) || count($value) > 5000) {
        throw new InvalidArgumentException('Data peserta harus berupa daftar maksimal 5000 orang.');
    }
    $clean = [];
    foreach ($value as $item) {
        if (!is_array($item)) {
            continue;
        }
        $name = trim((string)($item['name'] ?? $item['full_name'] ?? ''));
        if ($name === '') {
            continue;
        }
        $limitedName = preg_replace('/^(.{0,150}).*$/us', '$1', $name);
        $name = $limitedName === null ? substr($name, 0, 600) : $limitedName;
        $phone = substr(trim((string)($item['phone'] ?? '')), 0, 120);
        $status = strtoupper(trim((string)($item['status'] ?? 'PENDING')));
        if (!in_array($status, ['CONFIRMED', 'PENDING', 'CANCELLED'], true)) {
            $status = 'PENDING';
        }
        $id = substr(trim((string)($item['id'] ?? '')), 0, 100);
        if ($id === '') {
            $id = bin2hex(random_bytes(12));
        }
        // Keep only the participant fields requested by the outing workflow.
        $clean[] = ['id' => $id, 'name' => $name, 'phone' => $phone, 'status' => $status];
    }
    return $clean;
}

try {
    $config = appConfig();
    $pdo = db();

    if ($route === 'bootstrap.js' && $method === 'GET') {
        $user = currentUser($pdo);
        jsResponse($user ? stateSnapshot($pdo) : defaultState());
    }

    if ($route === 'login' && $method === 'POST') {
        requireSameOrigin();
        $ipHash = loginIpHash();
        if (loginIsThrottled($pdo, $ipHash)) {
            jsonResponse(['error' => 'Terlalu banyak percobaan login. Tunggu 15 menit lalu coba lagi.'], 429);
        }
        $body = readJsonBody();
        $username = strtolower(trim((string)($body['username'] ?? '')));
        $password = (string)($body['password'] ?? '');
        $role = null;
        $expectedPassword = '';
        if ($username === $config['admin_username']) {
            $role = 'ADMIN';
            $expectedPassword = (string)$config['admin_password'];
        } elseif ($username === $config['member_username']) {
            $role = 'MEMBER';
            $expectedPassword = (string)$config['member_password'];
        }
        $valid = $role !== null && strlen($password) <= 256 && verifyConfiguredPassword($password, $expectedPassword);
        if (!$valid) {
            recordLoginFailure($pdo, $ipHash);
            jsonResponse(['error' => 'User ID atau password salah.'], 401);
        }

        $clear = $pdo->prepare('DELETE FROM outing_login_attempts WHERE ip_hash = ?');
        $clear->execute([$ipHash]);
        $pdo->prepare('DELETE FROM outing_app_sessions WHERE expires_at <= ?')->execute([time()]);
        $token = bin2hex(random_bytes(32));
        $expires = time() + SESSION_LIFETIME;
        $insert = $pdo->prepare('INSERT INTO outing_app_sessions (token_hash, username, role, expires_at) VALUES (?, ?, ?, ?)');
        $insert->execute([hash('sha256', $token), $username, $role, $expires]);
        setSessionCookie($token, $expires);
        $admin = $role === 'ADMIN';
        jsonResponse(['user' => [
            'id' => $admin ? 'hosted-admin' : 'hosted-member',
            'username' => $username,
            'full_name' => $admin ? 'Admin Outing' : 'Member Outing',
            'role' => $role,
            'section' => $admin ? 'INISIATOR' : 'PUBLIC',
            'department' => $admin ? 'Panitia' : 'Peserta',
            'phone' => '',
        ]]);
    }

    if ($route === 'session' && $method === 'GET') {
        $user = currentUser($pdo);
        if (!$user) {
            jsonResponse(['error' => 'Sesi login tidak ditemukan.'], 401);
        }
        jsonResponse(['user' => $user]);
    }

    if ($route === 'logout' && $method === 'POST') {
        requireSameOrigin();
        $token = (string)($_COOKIE[SESSION_COOKIE] ?? '');
        if (preg_match('/^[a-f0-9]{64}$/', $token)) {
            $delete = $pdo->prepare('DELETE FROM outing_app_sessions WHERE token_hash = ?');
            $delete->execute([hash('sha256', $token)]);
        }
        clearSessionCookie();
        jsonResponse(['ok' => true]);
    }

    if ($route === 'state' && $method === 'GET') {
        if (!currentUser($pdo)) {
            jsonResponse(['error' => 'Silakan login.'], 401);
        }
        jsonResponse(['state' => stateSnapshot($pdo)]);
    }

    if ($route === 'state' && $method === 'PUT') {
        requireSameOrigin();
        $user = currentUser($pdo);
        if (!$user) {
            jsonResponse(['error' => 'Sesi login berakhir. Silakan login ulang.'], 401);
        }
        if ($user['role'] !== 'ADMIN') {
            jsonResponse(['error' => 'Hanya Admin yang dapat mengubah data.'], 403);
        }
        $key = rawurldecode((string)($_GET['key'] ?? ''));
        if (!preg_match('/^outing_[a-z0-9_]{1,80}$/D', $key)) {
            jsonResponse(['error' => 'Nama penyimpanan tidak valid.'], 400);
        }
        $body = readJsonBody();
        if (!array_key_exists('value', $body)) {
            jsonResponse(['error' => 'Field value wajib diisi.'], 400);
        }
        $value = $body['value'];
        if ($key === 'outing_participants') {
            $value = cleanParticipantState($value);
        }
        $encoded = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
        if ($encoded === false) {
            jsonResponse(['error' => 'Data tidak dapat disimpan sebagai JSON.'], 400);
        }
        $save = $pdo->prepare('INSERT INTO outing_app_state (state_key, state_value) VALUES (?, ?)
            ON DUPLICATE KEY UPDATE state_value = VALUES(state_value), updated_at = CURRENT_TIMESTAMP');
        $save->execute([$key, $encoded]);
        jsonResponse(['ok' => true]);
    }

    jsonResponse(['error' => 'Endpoint tidak ditemukan.'], 404);
} catch (InvalidArgumentException $error) {
    jsonResponse(['error' => $error->getMessage()], 400);
} catch (Throwable $error) {
    error_log('[Outing API] ' . $error->getMessage());
    $message = $route === 'bootstrap.js'
        ? 'window.__OUTING_SERVER_MODE__ = true; window.__OUTING_SERVER_STATE__ = {};'
        : null;
    if ($message !== null) {
        http_response_code(503);
        header('Content-Type: application/javascript; charset=utf-8');
        header('Cache-Control: no-store, max-age=0');
        echo $message;
        exit;
    }
    jsonResponse(['error' => 'Server/database belum siap. Periksa config.php dan koneksi MySQL.'], 503);
}
