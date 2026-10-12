@echo off
mysql -u root -e "DROP DATABASE IF EXISTS ggcm_ocms_v2; CREATE DATABASE ggcm_ocms_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root ggcm_ocms_v2 < ggcm_ocms_v2_data_utf8.sql
cd server
php artisan migrate --force
