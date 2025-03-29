CREATE DATABASE IF NOT EXISTS carstyle;
USE carstyle;

CREATE TABLE IF NOT EXISTS `users` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
    `phone` VARCHAR(20),
    `email` VARCHAR(255),
    `password` VARCHAR(255),
    `lastname` VARCHAR(255),
    `firstname` VARCHAR(255),
    `middlename` VARCHAR(255),
    `avatar_url` VARCHAR(255),
    `role` VARCHAR(20) DEFAULT 'client',
    PRIMARY KEY(`user_id`)
);

CREATE TABLE IF NOT EXISTS `clients` (
    `client_id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
    `driver_license` INTEGER,
    `passport_series` INTEGER,
    `passport_number` INTEGER,
    `status` BOOLEAN,
    PRIMARY KEY(`client_id`),
    FOREIGN KEY(`client_id`) REFERENCES `users`(`user_id`)
);

CREATE TABLE IF NOT EXISTS `brands` (
    `id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
    `name` VARCHAR(255) NOT NULL,
    PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `models` (
    `id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
    `brand_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    PRIMARY KEY(`id`),
    FOREIGN KEY(`brand_id`) REFERENCES `brands`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `colors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
    `name` VARCHAR(255) NOT NULL,
    PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `fuel_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
    `name` VARCHAR(255) NOT NULL,
    PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `transmission_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
    `name` VARCHAR(255) NOT NULL,
    PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `cars` (
    `car_id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
    `brand_id` INTEGER NOT NULL,
    `model_id` INTEGER NOT NULL,
    `year` INTEGER,
    `color_id` INTEGER NOT NULL,
    `price` DECIMAL(10,2),
    `mileage` INTEGER,
    `status` VARCHAR(20) DEFAULT 'available',
    `description` TEXT,
    `fuel_type_id` INTEGER NOT NULL,
    `transmission_id` INTEGER NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`car_id`),
    FOREIGN KEY(`brand_id`) REFERENCES `brands`(`id`),
    FOREIGN KEY(`model_id`) REFERENCES `models`(`id`),
    FOREIGN KEY(`color_id`) REFERENCES `colors`(`id`),
    FOREIGN KEY(`fuel_type_id`) REFERENCES `fuel_types`(`id`),
    FOREIGN KEY(`transmission_id`) REFERENCES `transmission_types`(`id`)
);

CREATE TABLE IF NOT EXISTS `car_images` (
    `image_id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
    `car_id` INTEGER NOT NULL,
    `image_url` VARCHAR(255) NOT NULL,
    `is_primary` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(`image_id`),
    FOREIGN KEY(`car_id`) REFERENCES `cars`(`car_id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `positions` (
    `position_id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
    `position_name` VARCHAR(255),
    PRIMARY KEY(`position_id`)
);

CREATE TABLE IF NOT EXISTS `employees` (
    `employee_id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
    `position_id` INTEGER,
    `user_id` INTEGER,
    PRIMARY KEY(`employee_id`),
    FOREIGN KEY(`position_id`) REFERENCES `positions`(`position_id`),
    FOREIGN KEY(`user_id`) REFERENCES `users`(`user_id`)
);

CREATE TABLE IF NOT EXISTS `statuses` (
    `status_id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
    `status_name` VARCHAR(255),
    PRIMARY KEY(`status_id`)
);

CREATE TABLE IF NOT EXISTS `orders` (
    `order_id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
    `employee_id` INTEGER,
    `car_id` INTEGER NOT NULL,
    `client_id` INTEGER NOT NULL,
    `status_id` INTEGER,
    `return_date` DATE,
    `price` FLOAT,
    `issue_date` DATE NOT NULL,
    PRIMARY KEY(`order_id`),
    FOREIGN KEY(`employee_id`) REFERENCES `employees`(`employee_id`),
    FOREIGN KEY(`car_id`) REFERENCES `cars`(`car_id`),
    FOREIGN KEY(`client_id`) REFERENCES `clients`(`client_id`),
    FOREIGN KEY(`status_id`) REFERENCES `statuses`(`status_id`)
);

CREATE TABLE IF NOT EXISTS `reviews` (
    `review_id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
    `user_id` INTEGER NOT NULL,
    `car_id` INTEGER NULL,
    `rating` INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    `comment` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(`review_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
    FOREIGN KEY (`car_id`) REFERENCES `cars`(`car_id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_user_general_review` (`user_id`, `car_id`)
);

CREATE TABLE IF NOT EXISTS `review_likes` (
    `like_id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
    `review_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(`like_id`),
    FOREIGN KEY (`review_id`) REFERENCES `reviews`(`review_id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_user_review_like` (`user_id`, `review_id`)
);

CREATE INDEX idx_user_email ON `users`(`email`);
CREATE INDEX idx_car_brand ON `cars`(`brand_id`);
CREATE INDEX idx_car_model ON `cars`(`model_id`);
CREATE INDEX idx_car_images_car_id ON `car_images`(`car_id`);
CREATE INDEX idx_car_images_primary ON `car_images`(`is_primary`);
CREATE INDEX idx_orders_dates ON `orders`(`issue_date`, `return_date`);
CREATE INDEX idx_orders_status ON `orders`(`status_id`);
CREATE INDEX idx_reviews_user ON `reviews`(`user_id`);
CREATE INDEX idx_reviews_car ON `reviews`(`car_id`);
CREATE INDEX idx_reviews_created ON `reviews`(`created_at`);
CREATE INDEX idx_review_likes_review_id ON `review_likes`(`review_id`);
CREATE INDEX idx_review_likes_user_id ON `review_likes`(`user_id`);