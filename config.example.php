<?php
/**
 * InfinityFree configuration template.
 * Copy this file to config.php, then fill values from InfinityFree Control Panel.
 * Never commit or share config.php; it contains database and login secrets.
 */
return [
    // MySQL Database details from VistaPanel > MySQL Databases.
    'db_host' => 'REPLACE_WITH_MYSQL_HOSTNAME',
    'db_name' => 'REPLACE_WITH_DATABASE_NAME',
    'db_user' => 'REPLACE_WITH_DATABASE_USERNAME',
    'db_password' => 'REPLACE_WITH_INFINITYFREE_DATABASE_PASSWORD',

    // Use two distinct strong passwords before making the site public.
    // You may enter plain text here, or a password_hash() result (bcrypt/argon2).
    'admin_username' => 'admin',
    'admin_password' => 'CHANGE_THIS_ADMIN_PASSWORD',
    'member_username' => 'member',
    'member_password' => 'CHANGE_THIS_MEMBER_PASSWORD',

    // Generate a random secret of at least 32 characters.
    'app_secret' => 'REPLACE_WITH_A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARS',
];
