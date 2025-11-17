 USE `uni_database`;

CREATE TABLE IF NOT EXISTS `ip_addresses` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `location` VARCHAR(100) NOT NULL,
  `department_name` VARCHAR(100) NOT NULL,
  `ip_3_octets` VARCHAR(15) NOT NULL,
  `ip_4_octet` INT UNSIGNED NOT NULL,
  `room_number` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_ip` (`ip_3_octets`, `ip_4_octet`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
