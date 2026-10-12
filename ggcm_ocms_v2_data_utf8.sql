-- MySQL dump 10.13  Distrib 8.4.3, for Win64 (x86_64)
--
-- Host: localhost    Database: ggcm_ocms_v2
-- ------------------------------------------------------
-- Server version	8.4.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `academic_sessions`
--

DROP TABLE IF EXISTS `academic_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `academic_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_year` year NOT NULL,
  `end_year` year NOT NULL,
  `shift` enum('morning','evening') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'morning',
  `is_current` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `academic_sessions_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `academic_sessions`
-- Dumping data for table `academic_sessions`
--

LOCK TABLES `academic_sessions` WRITE;
/*!40000 ALTER TABLE `academic_sessions` DISABLE KEYS */;
INSERT INTO `academic_sessions` VALUES (1,'2022-2026',2022,2026,'morning',0),(2,'2023-2027',2023,2027,'evening',0),(3,'2024-2026',2024,2026,'morning',0),(4,'2025-2027',2025,2027,'evening',0),(5,'2026-2030',2026,2030,'morning',1),(6,'2026-2028',2026,2028,'morning',0);
/*!40000 ALTER TABLE `academic_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admission_cycles`
--

DROP TABLE IF EXISTS `admission_cycles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admission_cycles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `academic_session_id` int NOT NULL,
  `level` enum('intermediate','bs') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_at` datetime(3) NOT NULL,
  `end_at` datetime(3) NOT NULL,
  `merit_w_matric` decimal(4,2) DEFAULT NULL,
  `merit_w_inter` decimal(4,2) DEFAULT NULL,
  `hafiz_bonus` tinyint DEFAULT NULL,
  `challan_due_days` tinyint NOT NULL DEFAULT '7',
  `status` enum('draft','open','closed','merit','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `admission_cycles_academic_session_id_fkey` (`academic_session_id`),
  CONSTRAINT `admission_cycles_academic_session_id_fkey` FOREIGN KEY (`academic_session_id`) REFERENCES `academic_sessions` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admission_cycles`
-- Dumping data for table `admission_cycles`
--

LOCK TABLES `admission_cycles` WRITE;
/*!40000 ALTER TABLE `admission_cycles` DISABLE KEYS */;
INSERT INTO `admission_cycles` VALUES (1,5,'bs','BS Admissions 2026 (Session 2026ÔÇô2030)','2026-06-30 19:00:00.000','2026-08-15 18:59:00.000',NULL,NULL,NULL,7,'open','2026-08-18 19:53:15.516','2026-08-18 19:53:15.516'),(2,6,'intermediate','Intermediate Admissions 2026 (Session 2026ÔÇô2028)','2026-06-30 19:00:00.000','2026-08-20 18:59:00.000',NULL,NULL,NULL,7,'open','2026-08-18 19:53:15.526','2026-08-18 19:53:15.526');
/*!40000 ALTER TABLE `admission_cycles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `allocations`
--

DROP TABLE IF EXISTS `allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `allocations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `class_section_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `teacher_id` bigint NOT NULL,
  `academic_session_id` int NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `allocations_class_section_id_subject_id_key` (`class_section_id`,`subject_id`),
  KEY `allocations_subject_id_fkey` (`subject_id`),
  KEY `allocations_teacher_id_fkey` (`teacher_id`),
  KEY `allocations_academic_session_id_fkey` (`academic_session_id`),
  CONSTRAINT `allocations_academic_session_id_fkey` FOREIGN KEY (`academic_session_id`) REFERENCES `academic_sessions` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `allocations_class_section_id_fkey` FOREIGN KEY (`class_section_id`) REFERENCES `class_sections` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `allocations_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `allocations_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=243 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `allocations`
-- Dumping data for table `allocations`
--

LOCK TABLES `allocations` WRITE;
/*!40000 ALTER TABLE `allocations` DISABLE KEYS */;
INSERT INTO `allocations` VALUES (1,1,29,6,1,1),(2,1,30,14,1,1),(3,1,31,26,1,1),(4,1,32,37,1,1),(5,2,61,25,1,1),(6,2,62,33,1,1),(7,2,63,53,1,1),(8,2,64,82,1,1),(9,3,93,85,1,1),(10,3,94,85,1,1),(11,3,95,85,1,1),(12,3,96,85,1,1),(13,4,125,17,1,1),(14,4,126,23,1,1),(15,4,127,44,1,1),(16,4,128,45,1,1),(17,5,157,10,1,1),(18,5,158,15,1,1),(19,5,159,40,1,1),(20,5,160,52,1,1),(21,6,189,7,1,1),(22,6,190,30,1,1),(23,6,191,36,1,1),(24,6,192,38,1,1),(25,7,221,13,1,1),(26,7,222,32,1,1),(27,7,223,34,1,1),(28,7,224,35,1,1),(29,8,253,48,1,1),(30,8,254,49,1,1),(31,8,255,54,1,1),(32,8,256,73,1,1),(33,9,285,16,1,1),(34,9,286,29,1,1),(35,9,287,58,1,1),(36,9,288,58,1,1),(37,10,317,22,1,1),(38,10,318,31,1,1),(39,10,319,43,1,1),(40,10,320,61,1,1),(41,11,349,41,1,1),(42,11,350,72,1,1),(43,11,351,74,1,1),(44,11,352,81,1,1),(45,12,21,39,2,1),(46,12,22,55,2,1),(47,12,23,67,2,1),(48,12,24,68,2,1),(49,13,53,82,2,1),(50,13,54,53,2,1),(51,13,55,33,2,1),(52,13,56,25,2,1),(53,14,85,85,2,1),(54,14,86,85,2,1),(55,14,87,85,2,1),(56,14,88,85,2,1),(57,15,117,45,2,1),(58,15,118,44,2,1),(59,15,119,23,2,1),(60,15,120,17,2,1),(61,16,149,64,2,1),(62,16,150,65,2,1),(63,16,151,66,2,1),(64,16,152,69,2,1),(65,17,181,46,2,1),(66,17,182,47,2,1),(67,17,183,51,2,1),(68,17,184,60,2,1),(69,18,213,63,2,1),(70,18,214,79,2,1),(71,18,215,79,2,1),(72,18,216,63,2,1),(73,19,245,83,2,1),(74,19,246,83,2,1),(75,19,247,73,2,1),(76,19,248,54,2,1),(77,20,277,29,2,1),(78,20,278,16,2,1),(79,20,279,16,2,1),(80,20,280,29,2,1),(81,21,309,62,2,1),(82,21,310,76,2,1),(83,21,311,88,2,1),(84,21,312,88,2,1),(85,22,341,81,2,1),(86,22,342,74,2,1),(87,22,343,72,2,1),(88,22,344,41,2,1),(89,23,360,17,3,1),(90,23,361,70,3,1),(91,23,362,35,3,1),(92,23,363,77,3,1),(93,23,364,25,3,1),(94,23,365,58,3,1),(95,23,366,49,3,1),(96,24,360,23,3,1),(97,24,361,78,3,1),(98,24,362,34,3,1),(99,24,363,77,3,1),(100,24,364,33,3,1),(101,24,365,58,3,1),(102,24,366,48,3,1),(103,25,374,89,3,1),(104,25,375,78,3,1),(105,25,376,32,3,1),(106,25,377,68,3,1),(107,25,378,53,3,1),(108,25,379,29,3,1),(109,25,380,48,3,1),(110,26,374,89,3,1),(111,26,375,70,3,1),(112,26,376,13,3,1),(113,26,377,67,3,1),(114,26,378,82,3,1),(115,26,379,16,3,1),(116,26,380,49,3,1),(117,27,374,69,3,1),(118,27,375,60,3,1),(119,27,376,13,3,1),(120,27,377,55,3,1),(121,27,378,82,3,1),(122,27,379,16,3,1),(123,27,380,54,3,1),(124,28,388,85,3,1),(125,28,389,66,3,1),(126,28,390,51,3,1),(127,28,391,39,3,1),(128,28,392,53,3,1),(129,28,393,29,3,1),(130,28,394,73,3,1),(131,29,388,85,3,1),(132,29,389,65,3,1),(133,29,390,47,3,1),(134,29,391,37,3,1),(135,29,392,33,3,1),(136,29,393,58,3,1),(137,29,394,83,3,1),(138,30,388,85,3,1),(139,30,389,64,3,1),(140,30,390,46,3,1),(141,30,391,26,3,1),(142,30,392,25,3,1),(143,30,393,58,3,1),(144,30,394,83,3,1),(145,31,388,85,3,1),(146,31,389,52,3,1),(147,31,390,38,3,1),(148,31,391,14,3,1),(149,31,392,25,3,1),(150,31,393,29,3,1),(151,31,394,73,3,1),(152,32,388,85,3,1),(153,32,389,40,3,1),(154,32,390,36,3,1),(155,32,391,6,3,1),(156,32,392,33,3,1),(157,32,393,16,3,1),(158,32,394,54,3,1),(159,33,402,16,3,1),(160,33,403,29,3,1),(161,33,404,49,3,1),(162,33,405,6,3,1),(163,33,406,53,3,1),(164,33,407,58,3,1),(165,33,408,48,3,1),(166,34,353,44,4,1),(167,34,354,30,4,1),(168,34,355,32,4,1),(169,34,356,14,4,1),(170,34,357,82,4,1),(171,34,358,48,4,1),(172,34,359,49,4,1),(173,35,353,45,4,1),(174,35,354,7,4,1),(175,35,355,34,4,1),(176,35,356,26,4,1),(177,35,357,82,4,1),(178,35,358,54,4,1),(179,35,359,73,4,1),(180,36,367,15,4,1),(181,36,368,7,4,1),(182,36,369,35,4,1),(183,36,370,37,4,1),(184,36,371,53,4,1),(185,36,372,83,4,1),(186,36,373,83,4,1),(187,37,367,10,4,1),(188,37,368,30,4,1),(189,37,369,63,4,1),(190,37,370,39,4,1),(191,37,371,33,4,1),(192,37,372,73,4,1),(193,37,373,54,4,1),(194,38,367,10,4,1),(195,38,368,36,4,1),(196,38,369,79,4,1),(197,38,370,55,4,1),(198,38,371,25,4,1),(199,38,372,49,4,1),(200,38,373,48,4,1),(201,39,381,85,4,1),(202,39,382,15,4,1),(203,39,383,38,4,1),(204,39,384,67,4,1),(205,39,385,25,4,1),(206,39,386,48,4,1),(207,39,387,49,4,1),(208,40,381,85,4,1),(209,40,382,40,4,1),(210,40,383,46,4,1),(211,40,384,68,4,1),(212,40,385,33,4,1),(213,40,386,54,4,1),(214,40,387,73,4,1),(215,41,381,85,4,1),(216,41,382,52,4,1),(217,41,383,47,4,1),(218,41,384,77,4,1),(219,41,385,53,4,1),(220,41,386,83,4,1),(221,41,387,83,4,1),(222,42,381,85,4,1),(223,42,382,64,4,1),(224,42,383,51,4,1),(225,42,384,77,4,1),(226,42,385,82,4,1),(227,42,386,73,4,1),(228,42,387,54,4,1),(229,43,381,85,4,1),(230,43,382,65,4,1),(231,43,383,60,4,1),(232,43,384,68,4,1),(233,43,385,82,4,1),(234,43,386,49,4,1),(235,43,387,48,4,1),(236,44,395,58,4,1),(237,44,396,29,4,1),(238,44,397,48,4,1),(239,44,398,67,4,1),(240,44,399,53,4,1),(241,44,400,49,4,1),(242,44,401,54,4,1);
/*!40000 ALTER TABLE `allocations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `application_documents`
--

DROP TABLE IF EXISTS `application_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `application_documents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `application_id` bigint NOT NULL,
  `document_type_id` int NOT NULL,
  `file_path` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `remarks` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified_by` bigint DEFAULT NULL,
  `verified_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `application_documents_application_id_document_type_id_key` (`application_id`,`document_type_id`),
  KEY `application_documents_document_type_id_fkey` (`document_type_id`),
  CONSTRAINT `application_documents_application_id_fkey` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `application_documents_document_type_id_fkey` FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=235 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `application_documents`
-- Table structure for table `applications`
--

DROP TABLE IF EXISTS `applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `applications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `application_no` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  `admission_cycle_id` int NOT NULL,
  `program_id` int NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `father_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cnic_bform` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gender` enum('male','female') COLLATE utf8mb4_unicode_ci NOT NULL,
  `dob` date NOT NULL,
  `province` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `domicile_district` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guardian_phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo_path` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `religion` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `marital_status` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `blood_group` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `has_disability` tinyint(1) NOT NULL DEFAULT '0',
  `disability_details` text COLLATE utf8mb4_unicode_ci,
  `medical_conditions` text COLLATE utf8mb4_unicode_ci,
  `is_hafiz` tinyint(1) NOT NULL DEFAULT '0',
  `matric_board` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `matric_year` year NOT NULL,
  `matric_roll_no` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `matric_obtained` int NOT NULL,
  `matric_total` int NOT NULL,
  `inter_group_id` int DEFAULT NULL,
  `inter_board` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inter_year` year DEFAULT NULL,
  `inter_roll_no` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inter_obtained` int DEFAULT NULL,
  `inter_total` int DEFAULT NULL,
  `merit_score` decimal(6,3) DEFAULT NULL,
  `eligibility_override` tinyint(1) NOT NULL DEFAULT '0',
  `override_reason` text COLLATE utf8mb4_unicode_ci,
  `status` enum('draft','submitted','docs_rejected','verified','rejected','selected','waitlisted','challan_issued','fee_submitted','enrolled','forfeited','not_selected','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'submitted',
  `remarks` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified_by` bigint DEFAULT NULL,
  `verified_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `applications_application_no_key` (`application_no`),
  UNIQUE KEY `applications_admission_cycle_id_program_id_cnic_bform_key` (`admission_cycle_id`,`program_id`,`cnic_bform`),
  KEY `applications_program_id_fkey` (`program_id`),
  KEY `applications_inter_group_id_fkey` (`inter_group_id`),
  CONSTRAINT `applications_admission_cycle_id_fkey` FOREIGN KEY (`admission_cycle_id`) REFERENCES `admission_cycles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `applications_inter_group_id_fkey` FOREIGN KEY (`inter_group_id`) REFERENCES `inter_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `applications_program_id_fkey` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `applications`
-- Table structure for table `assessment_marks`
--

DROP TABLE IF EXISTS `assessment_marks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assessment_marks` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `assessment_id` bigint NOT NULL,
  `student_id` bigint NOT NULL,
  `obtained` decimal(6,2) DEFAULT NULL,
  `remarks` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `assessment_marks_assessment_id_student_id_key` (`assessment_id`,`student_id`),
  KEY `assessment_marks_student_id_fkey` (`student_id`),
  CONSTRAINT `assessment_marks_assessment_id_fkey` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `assessment_marks_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23755 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assessment_marks`
-- Table structure for table `assessments`
--

DROP TABLE IF EXISTS `assessments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assessments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `allocation_id` bigint NOT NULL,
  `type` enum('midterm','sessional','other','final','practical') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_marks` smallint NOT NULL,
  `held_on` date DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `assessments_allocation_id_fkey` (`allocation_id`),
  CONSTRAINT `assessments_allocation_id_fkey` FOREIGN KEY (`allocation_id`) REFERENCES `allocations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=309 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assessments`
-- Table structure for table `asset_categories`
--

DROP TABLE IF EXISTS `asset_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_categories`
-- Dumping data for table `asset_categories`
--

LOCK TABLES `asset_categories` WRITE;
/*!40000 ALTER TABLE `asset_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `asset_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assets`
--

DROP TABLE IF EXISTS `assets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint unsigned NOT NULL,
  `department_id` int DEFAULT NULL,
  `building_id` bigint unsigned DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `assets_code_unique` (`code`),
  KEY `assets_category_id_foreign` (`category_id`),
  KEY `assets_department_id_foreign` (`department_id`),
  KEY `assets_building_id_foreign` (`building_id`),
  CONSTRAINT `assets_building_id_foreign` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`) ON DELETE SET NULL,
  CONSTRAINT `assets_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `asset_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `assets_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assets`
-- Dumping data for table `assets`
--

LOCK TABLES `assets` WRITE;
/*!40000 ALTER TABLE `assets` DISABLE KEYS */;
/*!40000 ALTER TABLE `assets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_records`
--

DROP TABLE IF EXISTS `attendance_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_records` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `attendance_sheet_id` bigint NOT NULL,
  `student_id` bigint NOT NULL,
  `status` enum('present','absent','leave') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `attendance_records_attendance_sheet_id_student_id_key` (`attendance_sheet_id`,`student_id`),
  KEY `attendance_records_student_id_fkey` (`student_id`),
  CONSTRAINT `attendance_records_attendance_sheet_id_fkey` FOREIGN KEY (`attendance_sheet_id`) REFERENCES `attendance_sheets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `attendance_records_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=150386 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_records`
-- Table structure for table `attendance_sheets`
--

DROP TABLE IF EXISTS `attendance_sheets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_sheets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `allocation_id` bigint NOT NULL,
  `date` date NOT NULL,
  `marked_by` bigint NOT NULL,
  `locked_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `attendance_sheets_allocation_id_date_key` (`allocation_id`,`date`),
  CONSTRAINT `attendance_sheets_allocation_id_fkey` FOREIGN KEY (`allocation_id`) REFERENCES `allocations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1938 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_sheets`
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `user_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_roles` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `method` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `path` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` int NOT NULL,
  `summary` json DEFAULT NULL,
  `ip` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `audit_logs_user_id_idx` (`user_id`),
  KEY `audit_logs_created_at_idx` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=10963 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
-- Table structure for table `blocks`
--

DROP TABLE IF EXISTS `blocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blocks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `blocks_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blocks`
-- Dumping data for table `blocks`
--

LOCK TABLES `blocks` WRITE;
/*!40000 ALTER TABLE `blocks` DISABLE KEYS */;
INSERT INTO `blocks` VALUES (1,'Main Block',1,'2026-08-18 19:53:19.325'),(2,'Science Block',1,'2026-08-18 19:53:19.337'),(3,'IT Block',1,'2026-08-18 19:53:19.349'),(4,'Arts Block',1,'2026-08-18 19:53:19.357');
/*!40000 ALTER TABLE `blocks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `book_categories`
--

DROP TABLE IF EXISTS `book_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `book_categories_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `book_categories`
-- Dumping data for table `book_categories`
--

LOCK TABLES `book_categories` WRITE;
/*!40000 ALTER TABLE `book_categories` DISABLE KEYS */;
INSERT INTO `book_categories` VALUES (4,'Chemistry'),(1,'Computer Science'),(10,'Economics & Statistics'),(6,'English Literature'),(11,'General'),(8,'Islamic Studies'),(2,'Mathematics'),(3,'Physics'),(9,'Social Sciences'),(7,'Urdu Adab'),(5,'Zoology');
/*!40000 ALTER TABLE `book_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `book_issues`
--

DROP TABLE IF EXISTS `book_issues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book_issues` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `book_id` int NOT NULL,
  `student_id` bigint NOT NULL,
  `book_request_id` bigint DEFAULT NULL,
  `issued_by` bigint NOT NULL,
  `issued_on` date NOT NULL,
  `due_date` date NOT NULL,
  `returned_on` date DEFAULT NULL,
  `received_by` bigint DEFAULT NULL,
  `fine_per_day` decimal(6,2) NOT NULL,
  `fine_amount` decimal(8,2) NOT NULL DEFAULT '0.00',
  `fine_status` enum('none','pending','paid','waived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'none',
  PRIMARY KEY (`id`),
  UNIQUE KEY `book_issues_book_request_id_key` (`book_request_id`),
  KEY `book_issues_book_id_fkey` (`book_id`),
  KEY `book_issues_student_id_fkey` (`student_id`),
  CONSTRAINT `book_issues_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `book_issues_book_request_id_fkey` FOREIGN KEY (`book_request_id`) REFERENCES `book_requests` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `book_issues_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=110 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `book_issues`
-- Table structure for table `book_requests`
--

DROP TABLE IF EXISTS `book_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `book_id` int NOT NULL,
  `student_id` bigint NOT NULL,
  `days_requested` tinyint NOT NULL,
  `status` enum('pending','approved','rejected','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `remarks` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `decided_by` bigint DEFAULT NULL,
  `decided_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `book_requests_book_id_fkey` (`book_id`),
  KEY `book_requests_student_id_fkey` (`student_id`),
  CONSTRAINT `book_requests_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `book_requests_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `book_requests`
-- Table structure for table `books`
--

DROP TABLE IF EXISTS `books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `books` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `author` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isbn` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `publisher` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `edition` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_id` int NOT NULL,
  `shelf_location` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_copies` smallint NOT NULL,
  `available_copies` smallint NOT NULL,
  `cover_path` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `books_category_id_fkey` (`category_id`),
  CONSTRAINT `books_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `book_categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `books`
-- Dumping data for table `books`
--

LOCK TABLES `books` WRITE;
/*!40000 ALTER TABLE `books` DISABLE KEYS */;
INSERT INTO `books` VALUES (1,'Introduction to Algorithms','Cormen, Leiserson, Rivest',NULL,'McGraw-Hill',NULL,1,'COM-7',2,0,NULL,1,'2026-08-18 19:53:38.643'),(2,'Clean Code','Robert C. Martin',NULL,'Ilmi Kitab Khana',NULL,1,'COM-9',3,2,NULL,1,'2026-08-18 19:53:38.643'),(3,'Database System Concepts','Silberschatz & Korth',NULL,'Oxford University Press',NULL,1,'COM-6',6,5,NULL,1,'2026-08-18 19:53:38.643'),(4,'Operating System Concepts','Silberschatz & Galvin',NULL,'Majeed Book Depot',NULL,1,'COM-7',5,4,NULL,1,'2026-08-18 19:53:38.643'),(5,'Computer Networking: A Top-Down Approach','Kurose & Ross',NULL,'McGraw-Hill',NULL,1,'COM-1',6,5,NULL,1,'2026-08-18 19:53:38.643'),(6,'Artificial Intelligence: A Modern Approach','Russell & Norvig',NULL,'Caravan Book House',NULL,1,'COM-9',5,0,NULL,1,'2026-08-18 19:53:38.643'),(7,'Calculus: Early Transcendentals','James Stewart',NULL,'Ilmi Kitab Khana',NULL,2,'MAT-7',6,5,NULL,1,'2026-08-18 19:53:38.656'),(8,'Linear Algebra and Its Applications','Gilbert Strang',NULL,'Pearson',NULL,2,'MAT-3',6,2,NULL,1,'2026-08-18 19:53:38.656'),(9,'Principles of Mathematical Analysis','Walter Rudin',NULL,'Oxford University Press',NULL,2,'MAT-7',2,0,NULL,1,'2026-08-18 19:53:38.656'),(10,'Topology','James Munkres',NULL,'Majeed Book Depot',NULL,2,'MAT-1',6,3,NULL,1,'2026-08-18 19:53:38.656'),(11,'University Physics','Young & Freedman',NULL,'Oxford University Press',NULL,3,'PHY-2',3,0,NULL,1,'2026-08-18 19:53:38.668'),(12,'Introduction to Electrodynamics','David Griffiths',NULL,'Caravan Book House',NULL,3,'PHY-6',2,0,NULL,1,'2026-08-18 19:53:38.668'),(13,'Concepts of Modern Physics','Arthur Beiser',NULL,'Majeed Book Depot',NULL,3,'PHY-7',5,2,NULL,1,'2026-08-18 19:53:38.668'),(14,'Organic Chemistry','Morrison & Boyd',NULL,'Oxford University Press',NULL,4,'CHE-2',2,1,NULL,1,'2026-08-18 19:53:38.679'),(15,'Physical Chemistry','Peter Atkins',NULL,'Pearson',NULL,4,'CHE-3',4,1,NULL,1,'2026-08-18 19:53:38.679'),(16,'Vogel\'s Qualitative Inorganic Analysis','G. Svehla',NULL,'McGraw-Hill',NULL,4,'CHE-4',5,3,NULL,1,'2026-08-18 19:53:38.679'),(17,'Integrated Principles of Zoology','Hickman et al.',NULL,'Majeed Book Depot',NULL,5,'ZOO-1',2,0,NULL,1,'2026-08-18 19:53:38.690'),(18,'Genetics: A Conceptual Approach','Benjamin Pierce',NULL,'Majeed Book Depot',NULL,5,'ZOO-5',3,1,NULL,1,'2026-08-18 19:53:38.690'),(19,'Animal Physiology','Hill, Wyse & Anderson',NULL,'Ilmi Kitab Khana',NULL,5,'ZOO-1',5,5,NULL,1,'2026-08-18 19:53:38.690'),(20,'Pride and Prejudice','Jane Austen',NULL,'Majeed Book Depot',NULL,6,'ENG-9',6,1,NULL,1,'2026-08-18 19:53:38.701'),(21,'A Glossary of Literary Terms','M.H. Abrams',NULL,'Ilmi Kitab Khana',NULL,6,'ENG-9',4,3,NULL,1,'2026-08-18 19:53:38.701'),(22,'The Norton Anthology of English Literature','Greenblatt (ed.)',NULL,'Oxford University Press',NULL,6,'ENG-9',3,2,NULL,1,'2026-08-18 19:53:38.701'),(23,'Things Fall Apart','Chinua Achebe',NULL,'Ilmi Kitab Khana',NULL,6,'ENG-9',3,3,NULL,1,'2026-08-18 19:53:38.701'),(24,'A Golden Treasury of Urdu Poetry','Various',NULL,'Ilmi Kitab Khana',NULL,7,'URD-1',3,0,NULL,1,'2026-08-18 19:53:38.718'),(25,'Aab-e-Hayat','Muhammad Husain Azad',NULL,'McGraw-Hill',NULL,7,'URD-5',3,2,NULL,1,'2026-08-18 19:53:38.718'),(26,'Kulliyat-e-Iqbal','Allama Muhammad Iqbal',NULL,'Oxford University Press',NULL,7,'URD-6',5,5,NULL,1,'2026-08-18 19:53:38.718'),(27,'Urdu Adab ki Tareekh','Dr. Anwar Sadeed',NULL,'Caravan Book House',NULL,7,'URD-8',6,4,NULL,1,'2026-08-18 19:53:38.718'),(28,'Seerat-un-Nabi','Shibli Nomani',NULL,'Majeed Book Depot',NULL,8,'ISL-4',6,3,NULL,1,'2026-08-18 19:53:38.728'),(29,'The Meaning of the Glorious Quran','Pickthall (tr.)',NULL,'Ilmi Kitab Khana',NULL,8,'ISL-7',3,1,NULL,1,'2026-08-18 19:53:38.728'),(30,'Riyad-us-Saliheen','Imam Nawawi',NULL,'Pearson',NULL,8,'ISL-5',6,6,NULL,1,'2026-08-18 19:53:38.728'),(31,'Political Science: An Introduction','Roskin et al.',NULL,'Majeed Book Depot',NULL,9,'SOC-9',6,4,NULL,1,'2026-08-18 19:53:38.737'),(32,'Constitutional and Political History of Pakistan','Hamid Khan',NULL,'Ilmi Kitab Khana',NULL,9,'SOC-2',5,3,NULL,1,'2026-08-18 19:53:38.737'),(33,'International Relations','Joshua Goldstein',NULL,'McGraw-Hill',NULL,9,'SOC-4',5,5,NULL,1,'2026-08-18 19:53:38.737'),(34,'Principles of Economics','N. Gregory Mankiw',NULL,'Caravan Book House',NULL,10,'ECO-8',4,3,NULL,1,'2026-08-18 19:53:38.748'),(35,'Economy of Pakistan','Khawaja Amjad Saeed',NULL,'Majeed Book Depot',NULL,10,'ECO-9',4,1,NULL,1,'2026-08-18 19:53:38.748'),(36,'Introduction to Statistical Theory','Sher Muhammad Chaudhry',NULL,'Ilmi Kitab Khana',NULL,10,'ECO-7',4,1,NULL,1,'2026-08-18 19:53:38.748'),(37,'Basic Econometrics','Damodar Gujarati',NULL,'Ilmi Kitab Khana',NULL,10,'ECO-9',5,3,NULL,1,'2026-08-18 19:53:38.748'),(38,'Wonders of the World Encyclopedia','Various',NULL,'Majeed Book Depot',NULL,11,'GEN-4',3,0,NULL,1,'2026-08-18 19:53:38.758'),(39,'A Brief History of Time','Stephen Hawking',NULL,'Caravan Book House',NULL,11,'GEN-1',6,6,NULL,1,'2026-08-18 19:53:38.758');
/*!40000 ALTER TABLE `books` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `buildings`
--

DROP TABLE IF EXISTS `buildings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `buildings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `buildings`
-- Dumping data for table `buildings`
--

LOCK TABLES `buildings` WRITE;
/*!40000 ALTER TABLE `buildings` DISABLE KEYS */;
/*!40000 ALTER TABLE `buildings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
-- Table structure for table `challan_items`
--

DROP TABLE IF EXISTS `challan_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `challan_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `challan_id` bigint NOT NULL,
  `label` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `challan_items_challan_id_fkey` (`challan_id`),
  CONSTRAINT `challan_items_challan_id_fkey` FOREIGN KEY (`challan_id`) REFERENCES `challans` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9463 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `challan_items`
-- Table structure for table `challans`
--

DROP TABLE IF EXISTS `challans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `challans` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `challan_no` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `application_id` bigint DEFAULT NULL,
  `student_id` bigint DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `purpose` enum('admission','department_fee','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admission',
  `total_amount` decimal(10,2) NOT NULL,
  `due_date` date NOT NULL,
  `status` enum('unpaid','fee_submitted','verified','rejected','expired') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `paid_copy_path` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_on` date DEFAULT NULL,
  `verified_by` bigint DEFAULT NULL,
  `verified_at` datetime(3) DEFAULT NULL,
  `remarks` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `challans_challan_no_key` (`challan_no`),
  KEY `challans_application_id_fkey` (`application_id`),
  KEY `challans_student_id_fkey` (`student_id`),
  KEY `challans_department_id_fkey` (`department_id`),
  CONSTRAINT `challans_application_id_fkey` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `challans_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `challans_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3140 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `challans`
-- Table structure for table `class_sections`
--

DROP TABLE IF EXISTS `class_sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_sections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `program_id` int NOT NULL,
  `academic_session_id` int NOT NULL,
  `term_no` tinyint NOT NULL,
  `name` char(2) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shift` enum('morning','evening') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'morning',
  `capacity` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `class_sections_program_id_academic_session_id_term_no_name_key` (`program_id`,`academic_session_id`,`term_no`,`name`),
  KEY `class_sections_academic_session_id_fkey` (`academic_session_id`),
  CONSTRAINT `class_sections_academic_session_id_fkey` FOREIGN KEY (`academic_session_id`) REFERENCES `academic_sessions` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `class_sections_program_id_fkey` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `class_sections`
-- Dumping data for table `class_sections`
--

LOCK TABLES `class_sections` WRITE;
/*!40000 ALTER TABLE `class_sections` DISABLE KEYS */;
INSERT INTO `class_sections` VALUES (1,1,1,8,'A','morning',50,1),(2,2,1,8,'A','morning',50,1),(3,3,1,8,'A','morning',50,1),(4,4,1,8,'A','morning',50,1),(5,5,1,8,'A','morning',50,1),(6,6,1,8,'A','morning',50,1),(7,7,1,8,'A','morning',50,1),(8,8,1,8,'A','morning',50,1),(9,9,1,8,'A','morning',50,1),(10,10,1,8,'A','morning',50,1),(11,11,1,8,'A','morning',50,1),(12,1,2,6,'A','evening',50,1),(13,2,2,6,'A','evening',50,1),(14,3,2,6,'A','evening',50,1),(15,4,2,6,'A','evening',50,1),(16,5,2,6,'A','evening',50,1),(17,6,2,6,'A','evening',50,1),(18,7,2,6,'A','evening',50,1),(19,8,2,6,'A','evening',50,1),(20,9,2,6,'A','evening',50,1),(21,10,2,6,'A','evening',50,1),(22,11,2,6,'A','evening',50,1),(23,12,3,2,'A','morning',100,1),(24,12,3,2,'B','morning',100,1),(25,13,3,2,'A','morning',100,1),(26,13,3,2,'B','morning',100,1),(27,13,3,2,'C','morning',100,1),(28,14,3,2,'A','morning',100,1),(29,14,3,2,'B','morning',100,1),(30,14,3,2,'C','morning',100,1),(31,14,3,2,'D','morning',100,1),(32,14,3,2,'E','morning',100,1),(33,15,3,2,'A','morning',50,1),(34,12,4,1,'A','evening',100,1),(35,12,4,1,'B','evening',100,1),(36,13,4,1,'A','evening',100,1),(37,13,4,1,'B','evening',100,1),(38,13,4,1,'C','evening',100,1),(39,14,4,1,'A','evening',100,1),(40,14,4,1,'B','evening',100,1),(41,14,4,1,'C','evening',100,1),(42,14,4,1,'D','evening',100,1),(43,14,4,1,'E','evening',100,1),(44,15,4,1,'A','evening',50,1);
/*!40000 ALTER TABLE `class_sections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classwork_submissions`
--

DROP TABLE IF EXISTS `classwork_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classwork_submissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `classwork_id` bigint NOT NULL,
  `student_id` bigint NOT NULL,
  `file_path` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `answers` json DEFAULT NULL,
  `submitted_at` datetime(3) NOT NULL,
  `obtained` decimal(6,2) DEFAULT NULL,
  `feedback` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `classwork_submissions_classwork_id_student_id_key` (`classwork_id`,`student_id`),
  KEY `classwork_submissions_student_id_fkey` (`student_id`),
  CONSTRAINT `classwork_submissions_classwork_id_fkey` FOREIGN KEY (`classwork_id`) REFERENCES `classworks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `classwork_submissions_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10292 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classwork_submissions`
-- Table structure for table `classworks`
--

DROP TABLE IF EXISTS `classworks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classworks` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `allocation_id` bigint NOT NULL,
  `type` enum('quiz','assignment') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `instructions` text COLLATE utf8mb4_unicode_ci,
  `attachment_path` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `questions` json DEFAULT NULL,
  `total_marks` smallint DEFAULT NULL,
  `due_at` datetime(3) DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `classworks_allocation_id_fkey` (`allocation_id`),
  CONSTRAINT `classworks_allocation_id_fkey` FOREIGN KEY (`allocation_id`) REFERENCES `allocations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=485 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classworks`
-- Table structure for table `committee_members`
--

DROP TABLE IF EXISTS `committee_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `committee_members` (
  `committee_id` int NOT NULL,
  `teacher_id` bigint NOT NULL,
  `position` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'member',
  PRIMARY KEY (`committee_id`,`teacher_id`),
  KEY `committee_members_teacher_id_fkey` (`teacher_id`),
  CONSTRAINT `committee_members_committee_id_fkey` FOREIGN KEY (`committee_id`) REFERENCES `committees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `committee_members_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `committee_members`
-- Dumping data for table `committee_members`
--

LOCK TABLES `committee_members` WRITE;
/*!40000 ALTER TABLE `committee_members` DISABLE KEYS */;
INSERT INTO `committee_members` VALUES (1,20,'secretary'),(1,27,'convener'),(1,39,'member'),(1,70,'member'),(2,5,'member'),(2,6,'convener'),(2,8,'member'),(2,40,'member'),(2,86,'secretary'),(3,45,'member'),(3,56,'convener'),(3,65,'secretary'),(4,11,'convener'),(4,55,'member'),(4,82,'secretary');
/*!40000 ALTER TABLE `committee_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `committee_student_members`
--

DROP TABLE IF EXISTS `committee_student_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `committee_student_members` (
  `committee_id` int NOT NULL,
  `student_id` bigint NOT NULL,
  `position` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'member',
  PRIMARY KEY (`committee_id`,`student_id`),
  KEY `committee_student_members_student_id_fkey` (`student_id`),
  CONSTRAINT `committee_student_members_committee_id_fkey` FOREIGN KEY (`committee_id`) REFERENCES `committees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `committee_student_members_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `committee_student_members`
-- Table structure for table `committees`
--

DROP TABLE IF EXISTS `committees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `committees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `committees_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `committees`
-- Dumping data for table `committees`
--

LOCK TABLES `committees` WRITE;
/*!40000 ALTER TABLE `committees` DISABLE KEYS */;
INSERT INTO `committees` VALUES (1,'Discipline Committee','Maintains discipline on campus and hears student conduct cases.','2026-08-18 19:53:39.976','2026-08-18 19:53:39.976'),(2,'Admission Committee','Oversees the admission process, merit lists, and seat allocation.','2026-08-18 19:53:39.986','2026-08-18 19:53:39.986'),(3,'Sports Committee','Organizes the annual sports week and inter-collegiate events.','2026-08-18 19:53:39.994','2026-08-18 19:53:39.994'),(4,'Library Committee','Advises on book procurement and library policy.','2026-08-18 19:53:40.001','2026-08-18 19:53:40.001');
/*!40000 ALTER TABLE `committees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `department_fee_items`
--

DROP TABLE IF EXISTS `department_fee_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `department_fee_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `department_id` int NOT NULL,
  `label` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `department_fee_items_department_id_fkey` (`department_id`),
  CONSTRAINT `department_fee_items_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=161 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `department_fee_items`
-- Dumping data for table `department_fee_items`
--

LOCK TABLES `department_fee_items` WRITE;
/*!40000 ALTER TABLE `department_fee_items` DISABLE KEYS */;
INSERT INTO `department_fee_items` VALUES (1,1,'Admission Fee',2000.00,1,'2026-08-18 19:53:15.420'),(2,1,'Tuition Fee',6000.00,1,'2026-08-18 19:53:15.420'),(3,1,'Registration Fee',1500.00,1,'2026-08-18 19:53:15.420'),(4,1,'Examination Fund',1500.00,1,'2026-08-18 19:53:15.420'),(5,1,'Library Fund',300.00,1,'2026-08-18 19:53:15.420'),(6,1,'Sports Fund',200.00,1,'2026-08-18 19:53:15.420'),(7,1,'ID Card & Magazine Fund',500.00,1,'2026-08-18 19:53:15.420'),(8,2,'Admission Fee',2000.00,1,'2026-08-18 19:53:15.420'),(9,2,'Tuition Fee',6000.00,1,'2026-08-18 19:53:15.420'),(10,2,'Registration Fee',1500.00,1,'2026-08-18 19:53:15.420'),(11,2,'Examination Fund',1500.00,1,'2026-08-18 19:53:15.420'),(12,2,'Library Fund',300.00,1,'2026-08-18 19:53:15.420'),(13,2,'Sports Fund',200.00,1,'2026-08-18 19:53:15.420'),(14,2,'ID Card & Magazine Fund',500.00,1,'2026-08-18 19:53:15.420'),(15,3,'Admission Fee',2000.00,1,'2026-08-18 19:53:15.420'),(16,3,'Tuition Fee',8000.00,1,'2026-08-18 19:53:15.420'),(17,3,'Registration Fee',1500.00,1,'2026-08-18 19:53:15.420'),(18,3,'Examination Fund',1500.00,1,'2026-08-18 19:53:15.420'),(19,3,'Library Fund',300.00,1,'2026-08-18 19:53:15.420'),(20,3,'Sports Fund',200.00,1,'2026-08-18 19:53:15.420'),(21,3,'ID Card & Magazine Fund',500.00,1,'2026-08-18 19:53:15.420'),(22,3,'Lab Maintenance Fund',800.00,1,'2026-08-18 19:53:15.420'),(23,4,'Admission Fee',2000.00,1,'2026-08-18 19:53:15.420'),(24,4,'Tuition Fee',8000.00,1,'2026-08-18 19:53:15.420'),(25,4,'Registration Fee',1500.00,1,'2026-08-18 19:53:15.420'),(26,4,'Examination Fund',1500.00,1,'2026-08-18 19:53:15.420'),(27,4,'Library Fund',300.00,1,'2026-08-18 19:53:15.420'),(28,4,'Sports Fund',200.00,1,'2026-08-18 19:53:15.420'),(29,4,'ID Card & Magazine Fund',500.00,1,'2026-08-18 19:53:15.420'),(30,4,'Lab Maintenance Fund',800.00,1,'2026-08-18 19:53:15.420'),(31,5,'Admission Fee',2000.00,1,'2026-08-18 19:53:15.420'),(32,5,'Tuition Fee',8000.00,1,'2026-08-18 19:53:15.420'),(33,5,'Registration Fee',1500.00,1,'2026-08-18 19:53:15.420'),(34,5,'Examination Fund',1500.00,1,'2026-08-18 19:53:15.420'),(35,5,'Library Fund',300.00,1,'2026-08-18 19:53:15.420'),(36,5,'Sports Fund',200.00,1,'2026-08-18 19:53:15.420'),(37,5,'ID Card & Magazine Fund',500.00,1,'2026-08-18 19:53:15.420'),(38,5,'Lab Maintenance Fund',800.00,1,'2026-08-18 19:53:15.420'),(39,6,'Admission Fee',2000.00,1,'2026-08-18 19:53:15.420'),(40,6,'Tuition Fee',8000.00,1,'2026-08-18 19:53:15.420'),(41,6,'Registration Fee',1500.00,1,'2026-08-18 19:53:15.420'),(42,6,'Examination Fund',1500.00,1,'2026-08-18 19:53:15.420'),(43,6,'Library Fund',300.00,1,'2026-08-18 19:53:15.420'),(44,6,'Sports Fund',200.00,1,'2026-08-18 19:53:15.420'),(45,6,'ID Card & Magazine Fund',500.00,1,'2026-08-18 19:53:15.420'),(46,6,'Lab Maintenance Fund',800.00,1,'2026-08-18 19:53:15.420'),(47,7,'Admission Fee',2000.00,1,'2026-08-18 19:53:15.420'),(48,7,'Tuition Fee',8000.00,1,'2026-08-18 19:53:15.420'),(49,7,'Registration Fee',1500.00,1,'2026-08-18 19:53:15.420'),(50,7,'Examination Fund',1500.00,1,'2026-08-18 19:53:15.420'),(51,7,'Library Fund',300.00,1,'2026-08-18 19:53:15.420'),(52,7,'Sports Fund',200.00,1,'2026-08-18 19:53:15.420'),(53,7,'ID Card & Magazine Fund',500.00,1,'2026-08-18 19:53:15.420'),(54,7,'Lab Maintenance Fund',800.00,1,'2026-08-18 19:53:15.420'),(55,8,'Admission Fee',2000.00,1,'2026-08-18 19:53:15.420'),(56,8,'Tuition Fee',6000.00,1,'2026-08-18 19:53:15.420'),(57,8,'Registration Fee',1500.00,1,'2026-08-18 19:53:15.420'),(58,8,'Examination Fund',1500.00,1,'2026-08-18 19:53:15.420'),(59,8,'Library Fund',300.00,1,'2026-08-18 19:53:15.420'),(60,8,'Sports Fund',200.00,1,'2026-08-18 19:53:15.420'),(61,8,'ID Card & Magazine Fund',500.00,1,'2026-08-18 19:53:15.420'),(62,9,'Admission Fee',2000.00,1,'2026-08-18 19:53:15.420'),(63,9,'Tuition Fee',6000.00,1,'2026-08-18 19:53:15.420'),(64,9,'Registration Fee',1500.00,1,'2026-08-18 19:53:15.420'),(65,9,'Examination Fund',1500.00,1,'2026-08-18 19:53:15.420'),(66,9,'Library Fund',300.00,1,'2026-08-18 19:53:15.420'),(67,9,'Sports Fund',200.00,1,'2026-08-18 19:53:15.420'),(68,9,'ID Card & Magazine Fund',500.00,1,'2026-08-18 19:53:15.420'),(69,10,'Admission Fee',2000.00,1,'2026-08-18 19:53:15.420'),(70,10,'Tuition Fee',6000.00,1,'2026-08-18 19:53:15.420'),(71,10,'Registration Fee',1500.00,1,'2026-08-18 19:53:15.420'),(72,10,'Examination Fund',1500.00,1,'2026-08-18 19:53:15.420'),(73,10,'Library Fund',300.00,1,'2026-08-18 19:53:15.420'),(74,10,'Sports Fund',200.00,1,'2026-08-18 19:53:15.420'),(75,10,'ID Card & Magazine Fund',500.00,1,'2026-08-18 19:53:15.420'),(76,11,'Admission Fee',2000.00,1,'2026-08-18 19:53:15.420'),(77,11,'Tuition Fee',8000.00,1,'2026-08-18 19:53:15.420'),(78,11,'Registration Fee',1500.00,1,'2026-08-18 19:53:15.420'),(79,11,'Examination Fund',1500.00,1,'2026-08-18 19:53:15.420'),(80,11,'Library Fund',300.00,1,'2026-08-18 19:53:15.420'),(81,11,'Sports Fund',200.00,1,'2026-08-18 19:53:15.420'),(82,11,'ID Card & Magazine Fund',500.00,1,'2026-08-18 19:53:15.420'),(83,11,'Lab Maintenance Fund',800.00,1,'2026-08-18 19:53:15.420'),(84,12,'Admission Fee',2000.00,1,'2026-08-18 19:53:15.420'),(85,12,'Tuition Fee',6000.00,1,'2026-08-18 19:53:15.420'),(86,12,'Registration Fee',1500.00,1,'2026-08-18 19:53:15.420'),(87,12,'Examination Fund',1500.00,1,'2026-08-18 19:53:15.420'),(88,12,'Library Fund',300.00,1,'2026-08-18 19:53:15.420'),(89,12,'Sports Fund',200.00,1,'2026-08-18 19:53:15.420'),(90,12,'ID Card & Magazine Fund',500.00,1,'2026-08-18 19:53:15.420'),(91,13,'Admission Fee',2000.00,1,'2026-08-18 19:53:15.420'),(92,13,'Tuition Fee',6000.00,1,'2026-08-18 19:53:15.420'),(93,13,'Registration Fee',1500.00,1,'2026-08-18 19:53:15.420'),(94,13,'Examination Fund',1500.00,1,'2026-08-18 19:53:15.420'),(95,13,'Library Fund',300.00,1,'2026-08-18 19:53:15.420'),(96,13,'Sports Fund',200.00,1,'2026-08-18 19:53:15.420'),(97,13,'ID Card & Magazine Fund',500.00,1,'2026-08-18 19:53:15.420'),(98,14,'Admission Fee',2000.00,1,'2026-08-18 19:53:15.420'),(99,14,'Tuition Fee',6000.00,1,'2026-08-18 19:53:15.420'),(100,14,'Registration Fee',1500.00,1,'2026-08-18 19:53:15.420'),(101,14,'Examination Fund',1500.00,1,'2026-08-18 19:53:15.420'),(102,14,'Library Fund',300.00,1,'2026-08-18 19:53:15.420'),(103,14,'Sports Fund',200.00,1,'2026-08-18 19:53:15.420'),(104,14,'ID Card & Magazine Fund',500.00,1,'2026-08-18 19:53:15.420'),(105,15,'Admission Fee',2000.00,1,'2026-08-18 19:53:15.420'),(106,15,'Tuition Fee',6000.00,1,'2026-08-18 19:53:15.420'),(107,15,'Registration Fee',1500.00,1,'2026-08-18 19:53:15.420'),(108,15,'Examination Fund',1500.00,1,'2026-08-18 19:53:15.420'),(109,15,'Library Fund',300.00,1,'2026-08-18 19:53:15.420'),(110,15,'Sports Fund',200.00,1,'2026-08-18 19:53:15.420'),(111,15,'ID Card & Magazine Fund',500.00,1,'2026-08-18 19:53:15.420'),(112,16,'Admission Fee',2000.00,1,'2026-08-18 19:53:15.420'),(113,16,'Tuition Fee',6000.00,1,'2026-08-18 19:53:15.420'),(114,16,'Registration Fee',1500.00,1,'2026-08-18 19:53:15.420'),(115,16,'Examination Fund',1500.00,1,'2026-08-18 19:53:15.420'),(116,16,'Library Fund',300.00,1,'2026-08-18 19:53:15.420'),(117,16,'Sports Fund',200.00,1,'2026-08-18 19:53:15.420'),(118,16,'ID Card & Magazine Fund',500.00,1,'2026-08-18 19:53:15.420'),(119,17,'Admission Fee',2000.00,1,'2026-08-18 19:53:15.420'),(120,17,'Tuition Fee',6000.00,1,'2026-08-18 19:53:15.420'),(121,17,'Registration Fee',1500.00,1,'2026-08-18 19:53:15.420'),(122,17,'Examination Fund',1500.00,1,'2026-08-18 19:53:15.420'),(123,17,'Library Fund',300.00,1,'2026-08-18 19:53:15.420'),(124,17,'Sports Fund',200.00,1,'2026-08-18 19:53:15.420'),(125,17,'ID Card & Magazine Fund',500.00,1,'2026-08-18 19:53:15.420'),(126,18,'Admission Fee',2000.00,1,'2026-08-18 19:53:15.420'),(127,18,'Tuition Fee',6000.00,1,'2026-08-18 19:53:15.420'),(128,18,'Registration Fee',1500.00,1,'2026-08-18 19:53:15.420'),(129,18,'Examination Fund',1500.00,1,'2026-08-18 19:53:15.420'),(130,18,'Library Fund',300.00,1,'2026-08-18 19:53:15.420'),(131,18,'Sports Fund',200.00,1,'2026-08-18 19:53:15.420'),(132,18,'ID Card & Magazine Fund',500.00,1,'2026-08-18 19:53:15.420'),(133,19,'Admission Fee',2000.00,1,'2026-08-18 19:53:15.420'),(134,19,'Tuition Fee',6000.00,1,'2026-08-18 19:53:15.420'),(135,19,'Registration Fee',1500.00,1,'2026-08-18 19:53:15.420'),(136,19,'Examination Fund',1500.00,1,'2026-08-18 19:53:15.420'),(137,19,'Library Fund',300.00,1,'2026-08-18 19:53:15.420'),(138,19,'Sports Fund',200.00,1,'2026-08-18 19:53:15.420'),(139,19,'ID Card & Magazine Fund',500.00,1,'2026-08-18 19:53:15.420'),(140,20,'Admission Fee',2000.00,1,'2026-08-18 19:53:15.420'),(141,20,'Tuition Fee',6000.00,1,'2026-08-18 19:53:15.420'),(142,20,'Registration Fee',1500.00,1,'2026-08-18 19:53:15.420'),(143,20,'Examination Fund',1500.00,1,'2026-08-18 19:53:15.420'),(144,20,'Library Fund',300.00,1,'2026-08-18 19:53:15.420'),(145,20,'Sports Fund',200.00,1,'2026-08-18 19:53:15.420'),(146,20,'ID Card & Magazine Fund',500.00,1,'2026-08-18 19:53:15.420'),(147,21,'Admission Fee',2000.00,1,'2026-08-18 19:53:15.420'),(148,21,'Tuition Fee',6000.00,1,'2026-08-18 19:53:15.420'),(149,21,'Registration Fee',1500.00,1,'2026-08-18 19:53:15.420'),(150,21,'Examination Fund',1500.00,1,'2026-08-18 19:53:15.420'),(151,21,'Library Fund',300.00,1,'2026-08-18 19:53:15.420'),(152,21,'Sports Fund',200.00,1,'2026-08-18 19:53:15.420'),(153,21,'ID Card & Magazine Fund',500.00,1,'2026-08-18 19:53:15.420'),(154,22,'Admission Fee',2000.00,1,'2026-08-18 19:53:15.420'),(155,22,'Tuition Fee',6000.00,1,'2026-08-18 19:53:15.420'),(156,22,'Registration Fee',1500.00,1,'2026-08-18 19:53:15.420'),(157,22,'Examination Fund',1500.00,1,'2026-08-18 19:53:15.420'),(158,22,'Library Fund',300.00,1,'2026-08-18 19:53:15.420'),(159,22,'Sports Fund',200.00,1,'2026-08-18 19:53:15.420'),(160,22,'ID Card & Magazine Fund',500.00,1,'2026-08-18 19:53:15.420');
/*!40000 ALTER TABLE `department_fee_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `department_gallery_images`
--

DROP TABLE IF EXISTS `department_gallery_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `department_gallery_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `department_id` int NOT NULL,
  `image_path` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `caption` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `department_gallery_images_department_id_fkey` (`department_id`),
  CONSTRAINT `department_gallery_images_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `department_gallery_images`
-- Dumping data for table `department_gallery_images`
--

LOCK TABLES `department_gallery_images` WRITE;
/*!40000 ALTER TABLE `department_gallery_images` DISABLE KEYS */;
INSERT INTO `department_gallery_images` VALUES (1,1,'/uploads/gallery/photo-24.jpg','English ÔÇö classroom session',1,'2026-08-18 19:53:40.051'),(2,1,'/uploads/gallery/photo-60.jpg','English ÔÇö student activities',2,'2026-08-18 19:53:40.051'),(3,2,'/uploads/gallery/photo-20.jpg','Urdu ÔÇö classroom session',1,'2026-08-18 19:53:40.051'),(4,2,'/uploads/gallery/photo-180.jpg','Urdu ÔÇö student activities',2,'2026-08-18 19:53:40.051'),(5,3,'/uploads/gallery/photo-42.jpg','Information Technology ÔÇö classroom session',1,'2026-08-18 19:53:40.051'),(6,3,'/uploads/gallery/photo-453.jpg','Information Technology ÔÇö student activities',2,'2026-08-18 19:53:40.051'),(7,4,'/uploads/gallery/photo-60.jpg','Zoology ÔÇö classroom session',1,'2026-08-18 19:53:40.051'),(8,4,'/uploads/gallery/photo-24.jpg','Zoology ÔÇö student activities',2,'2026-08-18 19:53:40.051'),(9,5,'/uploads/gallery/photo-180.jpg','Mathematics ÔÇö classroom session',1,'2026-08-18 19:53:40.051'),(10,5,'/uploads/gallery/photo-20.jpg','Mathematics ÔÇö student activities',2,'2026-08-18 19:53:40.051'),(11,6,'/uploads/gallery/photo-453.jpg','Physics ÔÇö classroom session',1,'2026-08-18 19:53:40.051'),(12,6,'/uploads/gallery/photo-42.jpg','Physics ÔÇö student activities',2,'2026-08-18 19:53:40.051'),(13,7,'/uploads/gallery/photo-24.jpg','Chemistry ÔÇö classroom session',1,'2026-08-18 19:53:40.051'),(14,7,'/uploads/gallery/photo-60.jpg','Chemistry ÔÇö student activities',2,'2026-08-18 19:53:40.051'),(15,8,'/uploads/gallery/photo-20.jpg','Islamiyat ÔÇö classroom session',1,'2026-08-18 19:53:40.051'),(16,8,'/uploads/gallery/photo-180.jpg','Islamiyat ÔÇö student activities',2,'2026-08-18 19:53:40.051'),(17,9,'/uploads/gallery/photo-42.jpg','Political Science ÔÇö classroom session',1,'2026-08-18 19:53:40.051'),(18,9,'/uploads/gallery/photo-453.jpg','Political Science ÔÇö student activities',2,'2026-08-18 19:53:40.051'),(19,10,'/uploads/gallery/photo-60.jpg','Economics ÔÇö classroom session',1,'2026-08-18 19:53:40.051'),(20,10,'/uploads/gallery/photo-24.jpg','Economics ÔÇö student activities',2,'2026-08-18 19:53:40.051'),(21,11,'/uploads/gallery/photo-180.jpg','Statistics ÔÇö classroom session',1,'2026-08-18 19:53:40.051'),(22,11,'/uploads/gallery/photo-20.jpg','Statistics ÔÇö student activities',2,'2026-08-18 19:53:40.051'),(23,12,'/uploads/gallery/photo-453.jpg','Arabic ÔÇö classroom session',1,'2026-08-18 19:53:40.051'),(24,12,'/uploads/gallery/photo-42.jpg','Arabic ÔÇö student activities',2,'2026-08-18 19:53:40.051'),(25,13,'/uploads/gallery/photo-24.jpg','Biology ÔÇö classroom session',1,'2026-08-18 19:53:40.051'),(26,13,'/uploads/gallery/photo-60.jpg','Biology ÔÇö student activities',2,'2026-08-18 19:53:40.051'),(27,14,'/uploads/gallery/photo-20.jpg','Botany ÔÇö classroom session',1,'2026-08-18 19:53:40.051'),(28,14,'/uploads/gallery/photo-180.jpg','Botany ÔÇö student activities',2,'2026-08-18 19:53:40.051'),(29,15,'/uploads/gallery/photo-42.jpg','Civics ÔÇö classroom session',1,'2026-08-18 19:53:40.051'),(30,15,'/uploads/gallery/photo-453.jpg','Civics ÔÇö student activities',2,'2026-08-18 19:53:40.051'),(31,16,'/uploads/gallery/photo-60.jpg','Education ÔÇö classroom session',1,'2026-08-18 19:53:40.051'),(32,16,'/uploads/gallery/photo-24.jpg','Education ÔÇö student activities',2,'2026-08-18 19:53:40.051'),(33,17,'/uploads/gallery/photo-180.jpg','General ÔÇö classroom session',1,'2026-08-18 19:53:40.051'),(34,17,'/uploads/gallery/photo-20.jpg','General ÔÇö student activities',2,'2026-08-18 19:53:40.051'),(35,18,'/uploads/gallery/photo-453.jpg','Geography ÔÇö classroom session',1,'2026-08-18 19:53:40.051'),(36,18,'/uploads/gallery/photo-42.jpg','Geography ÔÇö student activities',2,'2026-08-18 19:53:40.051'),(37,19,'/uploads/gallery/photo-24.jpg','Health & Physical Education ÔÇö classroom session',1,'2026-08-18 19:53:40.051'),(38,19,'/uploads/gallery/photo-60.jpg','Health & Physical Education ÔÇö student activities',2,'2026-08-18 19:53:40.051'),(39,20,'/uploads/gallery/photo-20.jpg','Journalism ÔÇö classroom session',1,'2026-08-18 19:53:40.051'),(40,20,'/uploads/gallery/photo-180.jpg','Journalism ÔÇö student activities',2,'2026-08-18 19:53:40.051'),(41,21,'/uploads/gallery/photo-42.jpg','Sociology ÔÇö classroom session',1,'2026-08-18 19:53:40.051'),(42,21,'/uploads/gallery/photo-453.jpg','Sociology ÔÇö student activities',2,'2026-08-18 19:53:40.051'),(43,22,'/uploads/gallery/photo-60.jpg','Saraiki ÔÇö classroom session',1,'2026-08-18 19:53:40.051'),(44,22,'/uploads/gallery/photo-24.jpg','Saraiki ÔÇö student activities',2,'2026-08-18 19:53:40.051');
/*!40000 ALTER TABLE `department_gallery_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `message` text COLLATE utf8mb4_unicode_ci,
  `hod_teacher_id` bigint DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `departments_name_key` (`name`),
  UNIQUE KEY `departments_code_key` (`code`),
  UNIQUE KEY `departments_hod_teacher_id_key` (`hod_teacher_id`),
  CONSTRAINT `departments_hod_teacher_id_fkey` FOREIGN KEY (`hod_teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'English','ENG','The Department of English offers a 4-year BS English program and supports intermediate classes with qualified, dedicated faculty.',NULL,6,'2026-08-18 19:53:15.114','2026-08-18 19:53:16.656'),(2,'Urdu','URD','The Department of Urdu offers a 4-year BS Urdu program and supports intermediate classes with qualified, dedicated faculty.',NULL,25,'2026-08-18 19:53:15.121','2026-08-18 19:53:16.837'),(3,'Information Technology','IT','The Department of Information Technology offers a 4-year BS Information Technology program and supports intermediate classes with qualified, dedicated faculty.',NULL,85,'2026-08-18 19:53:15.127','2026-08-18 19:53:16.918'),(4,'Zoology','ZOO','The Department of Zoology offers a 4-year BS Zoology program and supports intermediate classes with qualified, dedicated faculty.',NULL,17,'2026-08-18 19:53:15.132','2026-08-18 19:53:16.779'),(5,'Mathematics','MATH','The Department of Mathematics offers a 4-year BS Mathematics program and supports intermediate classes with qualified, dedicated faculty.',NULL,15,'2026-08-18 19:53:15.138','2026-08-20 11:04:48.000'),(6,'Physics','PHY','The Department of Physics offers a 4-year BS Physics program and supports intermediate classes with qualified, dedicated faculty.',NULL,7,'2026-08-18 19:53:15.142','2026-08-18 19:53:16.685'),(7,'Chemistry','CHEM','The Department of Chemistry offers a 4-year BS Chemistry program and supports intermediate classes with qualified, dedicated faculty.',NULL,13,'2026-08-18 19:53:15.148','2026-08-18 19:53:16.753'),(8,'Islamiyat','ISL','The Department of Islamiyat offers a 4-year BS Islamiyat program and supports intermediate classes with qualified, dedicated faculty.',NULL,48,'2026-08-18 19:53:15.153','2026-08-18 19:53:16.877'),(9,'Political Science','PS','The Department of Political Science offers a 4-year BS Political Science program and supports intermediate classes with qualified, dedicated faculty.',NULL,16,'2026-08-18 19:53:15.158','2026-08-18 19:53:16.766'),(10,'Economics','ECO','The Department of Economics offers a 4-year BS Economics program and supports intermediate classes with qualified, dedicated faculty.',NULL,22,'2026-08-18 19:53:15.163','2026-08-18 19:53:16.812'),(11,'Statistics','STAT','The Department of Statistics offers a 4-year BS Statistics program and supports intermediate classes with qualified, dedicated faculty.',NULL,41,'2026-08-18 19:53:15.168','2026-08-18 19:53:16.864'),(12,'Arabic','ARB','The Department of Arabic supports the college\'s intermediate and degree classes with qualified, dedicated faculty.',NULL,8,'2026-08-18 19:53:15.174','2026-08-18 19:53:16.699'),(13,'Biology','BIO','The Department of Biology supports the college\'s intermediate and degree classes with qualified, dedicated faculty.',NULL,19,'2026-08-18 19:53:15.180','2026-08-18 19:53:16.796'),(14,'Botany','BOT','The Department of Botany supports the college\'s intermediate and degree classes with qualified, dedicated faculty.',NULL,24,'2026-08-18 19:53:15.184','2026-08-18 19:53:16.824'),(15,'Civics','CIV','The Department of Civics supports the college\'s intermediate and degree classes with qualified, dedicated faculty.',NULL,90,'2026-08-18 19:53:15.189','2026-08-18 19:53:16.945'),(16,'Education','EDU','The Department of Education supports the college\'s intermediate and degree classes with qualified, dedicated faculty.',NULL,12,'2026-08-18 19:53:15.194','2026-08-18 19:53:16.740'),(17,'General','GEN','The Department of General supports the college\'s intermediate and degree classes with qualified, dedicated faculty.',NULL,NULL,'2026-08-18 19:53:15.199','2026-08-18 19:53:15.199'),(18,'Geography','GEOG','The Department of Geography supports the college\'s intermediate and degree classes with qualified, dedicated faculty.',NULL,28,'2026-08-18 19:53:15.204','2026-08-18 19:53:16.850'),(19,'Health & Physical Education','HPE','The Department of Health & Physical Education supports the college\'s intermediate and degree classes with qualified, dedicated faculty.',NULL,11,'2026-08-18 19:53:15.209','2026-08-18 19:53:16.725'),(20,'Journalism','JRN','The Department of Journalism supports the college\'s intermediate and degree classes with qualified, dedicated faculty.',NULL,56,'2026-08-18 19:53:15.215','2026-08-18 19:53:16.904'),(21,'Sociology','SOC','The Department of Sociology supports the college\'s intermediate and degree classes with qualified, dedicated faculty.',NULL,87,'2026-08-18 19:53:15.219','2026-08-18 19:53:16.932'),(22,'Saraiki','SRK','The Department of Saraiki supports the college\'s intermediate and degree classes with qualified, dedicated faculty.',NULL,50,'2026-08-18 19:53:15.226','2026-08-18 19:53:16.890');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `designations`
--

DROP TABLE IF EXISTS `designations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `designations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `designations_title_key` (`title`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `designations`
-- Dumping data for table `designations`
--

LOCK TABLES `designations` WRITE;
/*!40000 ALTER TABLE `designations` DISABLE KEYS */;
INSERT INTO `designations` VALUES (3,'Assistant Professor'),(2,'Associate Professor'),(5,'CTI Lecturer'),(4,'Lecturer'),(1,'Professor'),(6,'Visiting Lecturer');
/*!40000 ALTER TABLE `designations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_types`
--

DROP TABLE IF EXISTS `document_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applies_to` enum('intermediate','bs','both') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_types`
-- Dumping data for table `document_types`
--

LOCK TABLES `document_types` WRITE;
/*!40000 ALTER TABLE `document_types` DISABLE KEYS */;
INSERT INTO `document_types` VALUES (1,'Passport Size Photograph','both',1,1),(2,'CNIC / B-Form Copy','both',1,1),(3,'Matric Certificate / Result Card','both',1,1),(4,'Intermediate Result Card (DMC)','bs',1,1),(5,'Domicile Certificate','both',1,1),(6,'Character Certificate (last institution)','bs',1,1),(7,'Migration Certificate (other board)','bs',0,1),(8,'Hafiz-e-Quran Certificate','both',0,1),(9,'NOC (Non-Punjab Domicile)','both',0,1);
/*!40000 ALTER TABLE `document_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
-- Table structure for table `fee_heads`
--

DROP TABLE IF EXISTS `fee_heads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fee_heads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `fee_heads_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fee_heads`
-- Dumping data for table `fee_heads`
--

LOCK TABLES `fee_heads` WRITE;
/*!40000 ALTER TABLE `fee_heads` DISABLE KEYS */;
INSERT INTO `fee_heads` VALUES (1,'Admission Fee',1),(2,'Tuition Fee',1),(3,'Registration Fee',1),(4,'Examination Fund',1),(5,'Library & Lab Security (refundable)',1),(6,'ID Card & Magazine Fund',1);
/*!40000 ALTER TABLE `fee_heads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gallery_images`
--

DROP TABLE IF EXISTS `gallery_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gallery_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `image_path` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `caption` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gallery_images`
-- Dumping data for table `gallery_images`
--

LOCK TABLES `gallery_images` WRITE;
/*!40000 ALTER TABLE `gallery_images` DISABLE KEYS */;
INSERT INTO `gallery_images` VALUES (1,'/uploads/gallery/photo-24.jpg','College library ÔÇö reading hall',1,1,'2026-08-18 19:53:40.041'),(2,'/uploads/gallery/photo-20.jpg','Student study resources',2,1,'2026-08-18 19:53:40.041'),(3,'/uploads/gallery/photo-42.jpg','IT lab ÔÇö practical work',3,1,'2026-08-18 19:53:40.041'),(4,'/uploads/gallery/photo-60.jpg','Computer laboratory',4,1,'2026-08-18 19:53:40.041'),(5,'/uploads/gallery/photo-180.jpg','Annual cultural evening',5,1,'2026-08-18 19:53:40.041'),(6,'/uploads/gallery/photo-453.jpg','College cafeteria',6,1,'2026-08-18 19:53:40.041');
/*!40000 ALTER TABLE `gallery_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inter_groups`
--

DROP TABLE IF EXISTS `inter_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inter_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `inter_groups_name_key` (`name`),
  UNIQUE KEY `inter_groups_code_key` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inter_groups`
-- Dumping data for table `inter_groups`
--

LOCK TABLES `inter_groups` WRITE;
/*!40000 ALTER TABLE `inter_groups` DISABLE KEYS */;
INSERT INTO `inter_groups` VALUES (1,'Pre-Medical','PM'),(2,'Pre-Engineering','PE'),(3,'ICS','ICS'),(4,'Humanities','HUM');
/*!40000 ALTER TABLE `inter_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` smallint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
-- Table structure for table `lecture_progress`
--

DROP TABLE IF EXISTS `lecture_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lecture_progress` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `lecture_id` bigint NOT NULL,
  `student_id` bigint NOT NULL,
  `watched_sec` int NOT NULL DEFAULT '0',
  `furthest_sec` int NOT NULL DEFAULT '0',
  `last_pos_sec` int NOT NULL DEFAULT '0',
  `sessions` int NOT NULL DEFAULT '0',
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completed_at` datetime(3) DEFAULT NULL,
  `notified_skip` tinyint(1) NOT NULL DEFAULT '0',
  `last_seen_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lecture_progress_lecture_id_student_id_key` (`lecture_id`,`student_id`),
  KEY `lecture_progress_student_id_idx` (`student_id`),
  CONSTRAINT `lecture_progress_lecture_id_fkey` FOREIGN KEY (`lecture_id`) REFERENCES `lectures` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `lecture_progress_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lecture_progress`
-- Dumping data for table `lecture_progress`
--

LOCK TABLES `lecture_progress` WRITE;
/*!40000 ALTER TABLE `lecture_progress` DISABLE KEYS */;
INSERT INTO `lecture_progress` VALUES (3,3,99,11,1285,1285,1,'2026-08-22 10:19:17.161','2026-08-22 05:19:17.000',0,'2026-08-22 05:24:15.000'),(4,4,99,22,30,4,2,'2026-08-22 10:24:29.737','2026-08-22 05:24:29.000',0,'2026-08-22 06:07:49.000'),(5,5,99,139,101,101,1,'2026-08-22 10:34:10.252','2026-08-22 05:34:10.000',0,'2026-08-22 05:44:48.000');
/*!40000 ALTER TABLE `lecture_progress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lecture_sessions`
--

DROP TABLE IF EXISTS `lecture_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lecture_sessions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `lecture_id` bigint NOT NULL,
  `student_id` bigint NOT NULL,
  `session_number` int NOT NULL,
  `watched_sec` int NOT NULL DEFAULT '0',
  `furthest_sec` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lecture_sessions_lecture_id_foreign` (`lecture_id`),
  KEY `lecture_sessions_student_id_foreign` (`student_id`),
  CONSTRAINT `lecture_sessions_lecture_id_foreign` FOREIGN KEY (`lecture_id`) REFERENCES `lectures` (`id`) ON DELETE CASCADE,
  CONSTRAINT `lecture_sessions_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lecture_sessions`
-- Dumping data for table `lecture_sessions`
--

LOCK TABLES `lecture_sessions` WRITE;
/*!40000 ALTER TABLE `lecture_sessions` DISABLE KEYS */;
INSERT INTO `lecture_sessions` VALUES (1,4,99,1,0,25,'2026-08-22 00:30:39','2026-08-22 00:30:39'),(2,5,99,1,139,101,'2026-08-22 00:34:10','2026-08-22 00:36:17'),(3,4,99,2,10,26,'2026-08-22 00:44:50','2026-08-22 00:52:45');
/*!40000 ALTER TABLE `lecture_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lectures`
--

DROP TABLE IF EXISTS `lectures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lectures` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `allocation_id` bigint NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `youtube_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration_mins` int DEFAULT NULL,
  `duration_sec` int DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT '0',
  `strict_tracking` tinyint(1) NOT NULL DEFAULT '0',
  `quiz_id` bigint DEFAULT NULL,
  `posted_by` bigint NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `lectures_allocation_id_idx` (`allocation_id`),
  KEY `lectures_quiz_id_fkey` (`quiz_id`),
  CONSTRAINT `lectures_allocation_id_fkey` FOREIGN KEY (`allocation_id`) REFERENCES `allocations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `lectures_quiz_id_fkey` FOREIGN KEY (`quiz_id`) REFERENCES `classworks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lectures`
-- Dumping data for table `lectures`
--

LOCK TABLES `lectures` WRITE;
/*!40000 ALTER TABLE `lectures` DISABLE KEYS */;
INSERT INTO `lectures` VALUES (3,9,'ABC2',NULL,'tqpFu0fOn90',NULL,1289,1,0,NULL,90,'2026-08-22 05:18:35.000','2026-08-22 05:19:17.000'),(4,9,'I\'m under the Water Meme',NULL,'SfT4FMkh1-w',NULL,31,1,1,NULL,90,'2026-08-22 05:24:09.000','2026-08-22 05:52:33.000'),(5,9,'MEME',NULL,'tS92P9PWNfU',NULL,102,1,0,NULL,90,'2026-08-22 05:33:47.000','2026-08-22 05:34:10.000');
/*!40000 ALTER TABLE `lectures` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `merit_list_entries`
--

DROP TABLE IF EXISTS `merit_list_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `merit_list_entries` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `merit_list_id` int NOT NULL,
  `application_id` bigint NOT NULL,
  `position` int NOT NULL,
  `merit_score` decimal(6,3) NOT NULL,
  `status` enum('selected','waiting','forfeited','admitted') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `merit_list_entries_merit_list_id_application_id_key` (`merit_list_id`,`application_id`),
  KEY `merit_list_entries_application_id_fkey` (`application_id`),
  CONSTRAINT `merit_list_entries_application_id_fkey` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `merit_list_entries_merit_list_id_fkey` FOREIGN KEY (`merit_list_id`) REFERENCES `merit_lists` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `merit_list_entries`
-- Table structure for table `merit_lists`
--

DROP TABLE IF EXISTS `merit_lists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `merit_lists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admission_cycle_id` int NOT NULL,
  `program_id` int NOT NULL,
  `list_no` tinyint NOT NULL,
  `seats` int NOT NULL,
  `cutoff_score` decimal(6,3) DEFAULT NULL,
  `status` enum('draft','published','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `generated_by` bigint NOT NULL,
  `published_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `merit_lists_admission_cycle_id_program_id_list_no_key` (`admission_cycle_id`,`program_id`,`list_no`),
  KEY `merit_lists_program_id_fkey` (`program_id`),
  CONSTRAINT `merit_lists_admission_cycle_id_fkey` FOREIGN KEY (`admission_cycle_id`) REFERENCES `admission_cycles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `merit_lists_program_id_fkey` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `merit_lists`
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_08_18_185247_create_personal_access_tokens_table',1),(5,'2026_08_18_213153_create_assets_module_tables',2),(6,'2026_08_18_213319_create_staff_module_table',2),(7,'2026_08_18_213426_create_tasks_module_table',2),(8,'2026_08_22_050904_add_strict_tracking_to_lectures_table',3),(9,'2026_08_22_050922_add_notified_skip_to_lecture_progress_table',3),(10,'2026_08_22_052834_create_lecture_sessions_table',4);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notices`
--

DROP TABLE IF EXISTS `notices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notices` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `attachment_path` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `audience` enum('public','applicants','students','teachers','portal_all') COLLATE utf8mb4_unicode_ci NOT NULL,
  `program_id` int DEFAULT NULL,
  `merit_list_id` int DEFAULT NULL,
  `published_at` datetime(3) NOT NULL,
  `expires_at` datetime(3) DEFAULT NULL,
  `created_by` bigint NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `notices_program_id_fkey` (`program_id`),
  KEY `notices_merit_list_id_fkey` (`merit_list_id`),
  CONSTRAINT `notices_merit_list_id_fkey` FOREIGN KEY (`merit_list_id`) REFERENCES `merit_lists` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `notices_program_id_fkey` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notices`
-- Dumping data for table `notices`
--

LOCK TABLES `notices` WRITE;
/*!40000 ALTER TABLE `notices` DISABLE KEYS */;
INSERT INTO `notices` VALUES (1,'Merit List 1 ÔÇö BS English: Fee Submission Notice','Merit List 1 for BS English (BS Admissions 2026 (Session 2026ÔÇô2030)) has been published. Selected candidates must download their fee challan from the applicant portal, deposit the fee at the designated bank branch, and upload the paid copy before the due date. Seats of candidates who fail to pay in time will be offered to the next candidates on the waiting list.',NULL,'public',1,1,'2026-08-14 19:53:36.595',NULL,3,'2026-08-18 19:53:36.596','2026-08-18 19:53:36.596'),(2,'Merit List 1 ÔÇö BS Information Technology: Fee Submission Notice','Merit List 1 for BS Information Technology (BS Admissions 2026 (Session 2026ÔÇô2030)) has been published. Selected candidates must download their fee challan from the applicant portal, deposit the fee at the designated bank branch, and upload the paid copy before the due date. Seats of candidates who fail to pay in time will be offered to the next candidates on the waiting list.',NULL,'public',3,2,'2026-08-14 19:53:36.795',NULL,3,'2026-08-18 19:53:36.797','2026-08-18 19:53:36.797'),(3,'Admissions Open ÔÇö BS Programs (Session 2026ÔÇô2030)','Online applications are invited for admission to all BS (4-year) programs for the session 2026ÔÇô2030. Eligible candidates may apply through the college website. Candidates must upload scanned copies of all required documents before the closing date.',NULL,'public',NULL,NULL,'2026-08-17 19:53:40.058',NULL,2,'2026-08-18 19:53:40.059','2026-08-18 19:53:40.059'),(4,'Admissions Open ÔÇö Intermediate (Session 2026ÔÇô2028)','Applications are invited for admission to 1st Year (FSc Pre-Medical, FSc Pre-Engineering, ICS, FA) for the session 2026ÔÇô2028. Minimum 50% marks in Matriculation are required. Apply online through the college website.',NULL,'public',NULL,NULL,'2026-08-16 19:53:40.058',NULL,2,'2026-08-18 19:53:40.059','2026-08-18 19:53:40.059'),(5,'College Timings ÔÇö Summer Schedule','The college will observe summer timings from 08:00 AM to 01:00 PM (morning shift) and 02:00 PM to 05:40 PM (evening shift). All students and staff are directed to follow the schedule strictly.',NULL,'public',NULL,NULL,'2026-08-15 19:53:40.058',NULL,2,'2026-08-18 19:53:40.059','2026-08-18 19:53:40.059'),(6,'Merit Scholarship Applications','Students who secured top positions in the previous examinations may apply for merit scholarships at the college office. Bring attested copies of result cards along with the application form.',NULL,'public',NULL,NULL,'2026-08-14 19:53:40.058',NULL,2,'2026-08-18 19:53:40.059','2026-08-18 19:53:40.059'),(7,'Annual Sports Week','The Annual Sports Week will be held on the college grounds. Trials for cricket, football, volleyball, and athletics will be announced by the Sports Committee. All students are encouraged to participate.',NULL,'public',NULL,NULL,'2026-08-13 19:53:40.058',NULL,2,'2026-08-18 19:53:40.059','2026-08-18 19:53:40.059'),(8,'Anti-Dengue Awareness Walk','An anti-dengue awareness walk will be organized by the college. All students are encouraged to participate. Assembly at the main ground at 09:00 AM.',NULL,'public',NULL,NULL,'2026-08-12 19:53:40.058',NULL,2,'2026-08-18 19:53:40.059','2026-08-18 19:53:40.059'),(9,'Class Tests ÔÇö Mid Semester Schedule','Mid-semester class tests for all BS programs will be conducted as per the schedule notified by subject teachers. Students short of attendance will not be allowed to sit in the tests.',NULL,'students',NULL,NULL,'2026-08-11 19:53:40.058',NULL,2,'2026-08-18 19:53:40.059','2026-08-18 19:53:40.059'),(10,'Faculty Meeting ÔÇö Examination Duties','All faculty members are requested to attend the meeting regarding annual examination duties in the staff room on Friday at 11:00 AM.',NULL,'teachers',NULL,NULL,'2026-08-10 19:53:40.058',NULL,2,'2026-08-18 19:53:40.059','2026-08-18 19:53:40.059');
/*!40000 ALTER TABLE `notices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci,
  `link` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `read_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_read_at_idx` (`user_id`,`read_at`)
) ENGINE=InnoDB AUTO_INCREMENT=7394 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
-- Table structure for table `pages`
--

DROP TABLE IF EXISTS `pages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  `updated_by` bigint DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pages_slug_key` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pages`
-- Dumping data for table `pages`
--

LOCK TABLES `pages` WRITE;
/*!40000 ALTER TABLE `pages` DISABLE KEYS */;
INSERT INTO `pages` VALUES (1,'About the College','about','<p><strong>Govt. Graduate College Muzaffargarh</strong> is one of the oldest and most respected public-sector institutions of District Muzaffargarh, Punjab. For decades the college has served the region by providing quality education at the Intermediate and Graduate levels at an affordable cost.</p>\n<p>The college offers Intermediate programs (FSc Pre-Medical, FSc Pre-Engineering, ICS, FA) and 4-year BS degree programs across the sciences, information technology, humanities, and social sciences. Our faculty includes PhD professors, dedicated lecturers, and visiting specialists.</p>\n<p>Spread over a spacious campus, the college provides science laboratories, computer labs, a rich library, a mosque, playgrounds, and sports facilities. Co-curricular societies groom students in debates, dramatics, and community service.</p>\n<h3>Our Mission</h3>\n<p>To provide accessible, high-quality education that prepares the youth of Muzaffargarh for national development, professional excellence, and responsible citizenship.</p>\n<h3>Our Vision</h3>\n<p>To be the leading graduate college of southern Punjab ÔÇö a center of academic excellence, character building, and community service.</p>',1,2,'2026-08-18 19:53:40.007','2026-08-18 19:53:40.007'),(2,'Principal\'s Message','principal-message','<p>Welcome to Govt. Graduate College Muzaffargarh. Education is the most powerful instrument of social change, and our college has been serving this noble cause for decades.</p>\n<p>We are committed to providing our students not only with academic knowledge but also with the character, discipline, and confidence they need to succeed in life. I invite you to join our institution and become part of this proud tradition.</p>',1,2,'2026-08-18 19:53:40.016','2026-08-18 19:53:40.016');
/*!40000 ALTER TABLE `pages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `group` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'admissions.view','admissions','View applications & verification queue'),(2,'admissions.verify','admissions','Verify / reject application documents'),(3,'admissions.approve','admissions','Approve / reject applications (final decision)'),(4,'merit.view','merit','View merit lists'),(5,'merit.generate','merit','Generate merit lists'),(6,'merit.publish','merit','Publish merit lists & expire unpaid'),(7,'challans.view','challans','View fee challans'),(8,'challans.verify','challans','Verify / reject challan payments'),(9,'challans.manage','challans','Manage department fee types & issue department vouchers'),(10,'students.view','students','View student records'),(11,'students.update','students','Update students (shift section, status)'),(12,'students.promote','students','Promote batches & manage carry papers'),(13,'teachers.view','teachers','View teachers (department-wise)'),(14,'teachers.create','teachers','Add new teachers'),(15,'teachers.update','teachers','Edit teacher records'),(16,'teachers.delete','teachers','Delete teachers'),(17,'departments.manage','departments','Create / edit / delete departments'),(18,'academic.view','academic','View academic structure (read-only)'),(19,'academic.manage','academic','Manage programs, sessions, subjects, cycles & allocations'),(20,'timetable.view','timetable','View timetable, blocks & rooms, time slots (read-only)'),(21,'timetable.manage','timetable','Timetable builder, blocks & rooms, time slots'),(22,'attendance.reports','attendance','Attendance registers & short-attendance reports'),(23,'library.view','library','View library dashboard, requests & issues (read-only)'),(24,'library.manage','library','Library catalog, issues/returns, requests & fines'),(25,'notices.view','notices','View the notice manager'),(26,'notices.create','notices','Publish new notices'),(27,'notices.update','notices','Edit notices'),(28,'notices.delete','notices','Delete notices'),(29,'website.view','website','View the website content manager (read-only)'),(30,'website.manage','website','Edit website content (sliders, pages, gallery, principal message)'),(31,'settings.view','settings','View system settings'),(32,'settings.update','settings','Change system settings'),(33,'staff.manage','staff','Create staff accounts & reset passwords'),(34,'committee.view','committee','View committees and member rosters (read-only)'),(35,'committee.manage','committee','Create, edit & delete committees; manage members');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
-- Table structure for table `program_eligibilities`
--

DROP TABLE IF EXISTS `program_eligibilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `program_eligibilities` (
  `program_id` int NOT NULL,
  `inter_group_id` int NOT NULL,
  PRIMARY KEY (`program_id`,`inter_group_id`),
  KEY `program_eligibilities_inter_group_id_fkey` (`inter_group_id`),
  CONSTRAINT `program_eligibilities_inter_group_id_fkey` FOREIGN KEY (`inter_group_id`) REFERENCES `inter_groups` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `program_eligibilities_program_id_fkey` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `program_eligibilities`
-- Dumping data for table `program_eligibilities`
--

LOCK TABLES `program_eligibilities` WRITE;
/*!40000 ALTER TABLE `program_eligibilities` DISABLE KEYS */;
INSERT INTO `program_eligibilities` VALUES (1,1),(2,1),(4,1),(7,1),(8,1),(9,1),(1,2),(2,2),(3,2),(5,2),(6,2),(7,2),(8,2),(9,2),(10,2),(11,2),(1,3),(2,3),(3,3),(5,3),(6,3),(8,3),(9,3),(10,3),(11,3),(1,4),(2,4),(8,4),(9,4),(10,4);
/*!40000 ALTER TABLE `program_eligibilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `program_fee_items`
--

DROP TABLE IF EXISTS `program_fee_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `program_fee_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `program_id` int NOT NULL,
  `fee_head_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `program_fee_items_program_id_fee_head_id_key` (`program_id`,`fee_head_id`),
  KEY `program_fee_items_fee_head_id_fkey` (`fee_head_id`),
  CONSTRAINT `program_fee_items_fee_head_id_fkey` FOREIGN KEY (`fee_head_id`) REFERENCES `fee_heads` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `program_fee_items_program_id_fkey` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `program_fee_items`
-- Dumping data for table `program_fee_items`
--

LOCK TABLES `program_fee_items` WRITE;
/*!40000 ALTER TABLE `program_fee_items` DISABLE KEYS */;
INSERT INTO `program_fee_items` VALUES (1,1,1,2000.00),(2,1,2,6000.00),(3,1,3,1500.00),(4,1,4,1500.00),(5,1,5,1000.00),(6,1,6,500.00),(7,2,1,2000.00),(8,2,2,6000.00),(9,2,3,1500.00),(10,2,4,1500.00),(11,2,5,1000.00),(12,2,6,500.00),(13,3,1,2000.00),(14,3,2,6000.00),(15,3,3,1500.00),(16,3,4,1500.00),(17,3,5,1000.00),(18,3,6,500.00),(19,4,1,2000.00),(20,4,2,6000.00),(21,4,3,1500.00),(22,4,4,1500.00),(23,4,5,1000.00),(24,4,6,500.00),(25,5,1,2000.00),(26,5,2,6000.00),(27,5,3,1500.00),(28,5,4,1500.00),(29,5,5,1000.00),(30,5,6,500.00),(31,6,1,2000.00),(32,6,2,6000.00),(33,6,3,1500.00),(34,6,4,1500.00),(35,6,5,1000.00),(36,6,6,500.00),(37,7,1,2000.00),(38,7,2,6000.00),(39,7,3,1500.00),(40,7,4,1500.00),(41,7,5,1000.00),(42,7,6,500.00),(43,8,1,2000.00),(44,8,2,6000.00),(45,8,3,1500.00),(46,8,4,1500.00),(47,8,5,1000.00),(48,8,6,500.00),(49,9,1,2000.00),(50,9,2,6000.00),(51,9,3,1500.00),(52,9,4,1500.00),(53,9,5,1000.00),(54,9,6,500.00),(55,10,1,2000.00),(56,10,2,6000.00),(57,10,3,1500.00),(58,10,4,1500.00),(59,10,5,1000.00),(60,10,6,500.00),(61,11,1,2000.00),(62,11,2,6000.00),(63,11,3,1500.00),(64,11,4,1500.00),(65,11,5,1000.00),(66,11,6,500.00),(67,12,1,1200.00),(68,12,2,3600.00),(69,12,3,900.00),(70,12,4,900.00),(71,12,5,600.00),(72,12,6,300.00),(73,13,1,1200.00),(74,13,2,3600.00),(75,13,3,900.00),(76,13,4,900.00),(77,13,5,600.00),(78,13,6,300.00),(79,14,1,1200.00),(80,14,2,3600.00),(81,14,3,900.00),(82,14,4,900.00),(83,14,5,600.00),(84,14,6,300.00),(85,15,1,1200.00),(86,15,2,3600.00),(87,15,3,900.00),(88,15,4,900.00),(89,15,5,600.00),(90,15,6,300.00);
/*!40000 ALTER TABLE `program_fee_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `programs`
--

DROP TABLE IF EXISTS `programs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `programs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `department_id` int DEFAULT NULL,
  `inter_group_id` int DEFAULT NULL,
  `level` enum('intermediate','bs') COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration_years` tinyint NOT NULL,
  `total_semesters` tinyint DEFAULT NULL,
  `seats` int NOT NULL,
  `min_percentage` decimal(5,2) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `exam_system` enum('semester','annual') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'semester',
  PRIMARY KEY (`id`),
  UNIQUE KEY `programs_code_key` (`code`),
  KEY `programs_department_id_fkey` (`department_id`),
  KEY `programs_inter_group_id_fkey` (`inter_group_id`),
  CONSTRAINT `programs_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `programs_inter_group_id_fkey` FOREIGN KEY (`inter_group_id`) REFERENCES `inter_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `programs`
-- Dumping data for table `programs`
--

LOCK TABLES `programs` WRITE;
/*!40000 ALTER TABLE `programs` DISABLE KEYS */;
INSERT INTO `programs` VALUES (1,1,NULL,'bs','BS English','BSENG',4,8,50,60.00,1,'2026-08-18 19:53:15.286','2026-08-18 19:53:15.286','semester'),(2,2,NULL,'bs','BS Urdu','BSURD',4,8,50,60.00,1,'2026-08-18 19:53:15.294','2026-08-18 19:53:15.294','semester'),(3,3,NULL,'bs','BS Information Technology','BSIT',4,8,50,60.00,1,'2026-08-18 19:53:15.299','2026-08-18 19:53:15.299','semester'),(4,4,NULL,'bs','BS Zoology','BSZOO',4,8,50,60.00,1,'2026-08-18 19:53:15.305','2026-08-18 19:53:15.305','semester'),(5,5,NULL,'bs','BS Mathematics','BSMATH',4,8,50,60.00,1,'2026-08-18 19:53:15.310','2026-08-18 19:53:15.310','semester'),(6,6,NULL,'bs','BS Physics','BSPHY',4,8,50,60.00,1,'2026-08-18 19:53:15.315','2026-08-18 19:53:15.315','semester'),(7,7,NULL,'bs','BS Chemistry','BSCHEM',4,8,50,60.00,1,'2026-08-18 19:53:15.320','2026-08-18 19:53:15.320','semester'),(8,8,NULL,'bs','BS Islamiyat','BSISL',4,8,50,60.00,1,'2026-08-18 19:53:15.326','2026-08-18 19:53:15.326','semester'),(9,9,NULL,'bs','BS Political Science','BSPS',4,8,50,60.00,1,'2026-08-18 19:53:15.332','2026-08-18 19:53:15.332','semester'),(10,10,NULL,'bs','BS Economics','BSECO',4,8,50,60.00,1,'2026-08-18 19:53:15.338','2026-08-18 19:53:15.338','semester'),(11,11,NULL,'bs','BS Statistics','BSSTAT',4,8,50,60.00,1,'2026-08-18 19:53:15.345','2026-08-18 19:53:15.345','semester'),(12,NULL,1,'intermediate','FSc Pre-Medical','FSC-PM',2,2,200,50.00,1,'2026-08-18 19:53:15.351','2026-08-18 19:53:15.351','annual'),(13,NULL,2,'intermediate','FSc Pre-Engineering','FSC-PE',2,2,300,50.00,1,'2026-08-18 19:53:15.356','2026-08-18 19:53:15.356','annual'),(14,NULL,3,'intermediate','ICS','ICS',2,2,500,50.00,1,'2026-08-18 19:53:15.361','2026-08-18 19:53:15.361','annual'),(15,NULL,4,'intermediate','FA','FA',2,2,50,50.00,1,'2026-08-18 19:53:15.366','2026-08-18 19:53:15.366','annual'),(16,NULL,NULL,'intermediate','Diploma in Information Technology (DIT)','DIT',2,4,100,45.00,1,'2026-08-22 13:17:16.972','2026-08-22 13:17:16.000','semester');
/*!40000 ALTER TABLE `programs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_has_permissions`
--

DROP TABLE IF EXISTS `role_has_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_has_permissions` (
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `role_has_permissions_permission_id_fkey` (`permission_id`),
  CONSTRAINT `role_has_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `role_has_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_has_permissions`
-- Dumping data for table `role_has_permissions`
--

LOCK TABLES `role_has_permissions` WRITE;
/*!40000 ALTER TABLE `role_has_permissions` DISABLE KEYS */;
INSERT INTO `role_has_permissions` VALUES (3,1),(3,2),(3,3),(3,4),(3,5),(3,6),(3,7),(3,8),(3,9),(3,10),(3,11),(3,12),(3,13),(8,13),(3,14),(3,15),(3,16),(3,17),(3,18),(3,19),(8,20),(8,21),(3,22),(7,23),(7,24),(3,25),(3,26),(3,27),(3,28),(7,31),(7,32),(2,34),(2,35);
/*!40000 ALTER TABLE `role_has_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'admin'),(9,'applicant'),(3,'clerk'),(4,'hod'),(7,'librarian'),(2,'principal'),(6,'student'),(5,'teacher'),(8,'timetable');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `block_id` int DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('classroom','lab') COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` smallint DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `rooms_name_key` (`name`),
  KEY `rooms_block_id_fkey` (`block_id`),
  CONSTRAINT `rooms_block_id_fkey` FOREIGN KEY (`block_id`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (1,1,NULL,'Main Block - Room 1','classroom',100,1),(2,1,NULL,'Main Block - Room 2','classroom',100,1),(3,1,NULL,'Main Block - Room 3','classroom',100,1),(4,1,NULL,'Main Block - Room 4','classroom',100,1),(5,1,NULL,'Main Block - Room 5','classroom',100,1),(6,1,NULL,'Main Block - Room 6','classroom',100,1),(7,1,NULL,'Main Block - Room 7','classroom',100,1),(8,1,NULL,'Main Block - Room 8','classroom',100,1),(9,1,NULL,'Main Block - Room 9','classroom',100,1),(10,1,NULL,'Main Block - Room 10','classroom',100,1),(11,1,NULL,'Main Block - Room 11','classroom',100,1),(12,1,NULL,'Main Block - Room 12','classroom',100,1),(13,2,NULL,'Science Block - Room 1','classroom',100,1),(14,2,NULL,'Science Block - Room 2','classroom',100,1),(15,2,NULL,'Science Block - Room 3','classroom',100,1),(16,2,NULL,'Science Block - Room 4','classroom',100,1),(17,2,NULL,'Science Block - Room 5','classroom',100,1),(18,2,NULL,'Science Block - Room 6','classroom',100,1),(19,2,NULL,'Science Block - Room 7','classroom',100,1),(20,2,NULL,'Science Block - Room 8','classroom',100,1),(21,2,NULL,'Science Block - Lab 1','lab',50,1),(22,2,NULL,'Science Block - Lab 2','lab',50,1),(23,2,NULL,'Science Block - Lab 3','lab',50,1),(24,2,NULL,'Science Block - Lab 4','lab',50,1),(25,3,NULL,'IT Block - Room 1','classroom',100,1),(26,3,NULL,'IT Block - Room 2','classroom',100,1),(27,3,NULL,'IT Block - Room 3','classroom',100,1),(28,3,NULL,'IT Block - Lab 1','lab',50,1),(29,3,NULL,'IT Block - Lab 2','lab',50,1),(30,4,NULL,'Arts Block - Room 1','classroom',100,1),(31,4,NULL,'Arts Block - Room 2','classroom',100,1),(32,4,NULL,'Arts Block - Room 3','classroom',100,1),(33,4,NULL,'Arts Block - Room 4','classroom',100,1),(34,4,NULL,'Arts Block - Room 5','classroom',100,1),(35,4,NULL,'Arts Block - Room 6','classroom',100,1),(36,4,NULL,'Arts Block - Room 7','classroom',100,1),(37,4,NULL,'Arts Block - Room 8','classroom',100,1);
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci,
  `group` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general',
  PRIMARY KEY (`id`),
  UNIQUE KEY `settings_key_key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'site.college_name_en','Govt. Graduate College Muzaffargarh','site'),(2,'site.college_name_ur','┌»┘êÏ▒┘å┘à┘å┘╣ ┌»Ï▒█îÏ¼┘ê█î┘╣ ┌®Ïº┘äÏ¼ ┘àÏ©┘üÏ▒ ┌»┌æ┌¥','site'),(3,'site.logo','/uploads/site/1787156926_6a85d9be73397.png','site'),(4,'site.color_primary','#14532D','site'),(5,'site.color_accent','#9F1239','site'),(6,'site.color_gold','#B7791F','site'),(7,'site.address','Multan Road, Muzaffargarh, Punjab','site'),(8,'site.phone','066-2422191','site'),(9,'site.email','info@ggcm.edu.pk','site'),(10,'site.facebook','','site'),(11,'site.map_embed','','site'),(12,'site.principal_name','Prof. Dr. Ashraf Hussain','site'),(13,'site.principal_photo','/uploads/site/1787156909_6a85d9adc9529.webp','site'),(14,'site.mission','To provide accessible, high-quality education that prepares the youth of Muzaffargarh for national development, professional excellence, and responsible citizenship.','site'),(15,'site.vision','To be the leading graduate college of southern Punjab ÔÇö a center of academic excellence, character building, and community service.','site'),(16,'site.mission_image','/uploads/site/mission.jpg','site'),(17,'site.vision_image','/uploads/site/vision.jpg','site'),(18,'merit.w_matric','0.30','merit'),(19,'merit.w_inter','0.70','merit'),(20,'merit.hafiz_bonus','20','merit'),(21,'rollno.pattern','{YEAR}-{COLLEGE}-{DEPT}-{SEQ3}','rollno'),(22,'site.college_code','GGCM','site'),(23,'challan.bank_name','Bank of Punjab','challan'),(24,'challan.branch','Muzaffargarh Branch','challan'),(25,'challan.account_no','6580-0021-4457-0019','challan'),(26,'challan.due_days','7','challan'),(27,'promotion.max_carry','2','promotion'),(28,'attendance.short_pct','75','attendance'),(29,'library.fine_per_day','10','library'),(30,'library.max_books','2','library'),(31,'library.max_days','14','library'),(32,'library.grace_days','0','library'),(33,'uploads.max_kb','2048','uploads');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sliders`
--

DROP TABLE IF EXISTS `sliders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sliders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `image_path` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `heading` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subheading` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` tinyint NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sliders`
-- Dumping data for table `sliders`
--

LOCK TABLES `sliders` WRITE;
/*!40000 ALTER TABLE `sliders` DISABLE KEYS */;
INSERT INTO `sliders` VALUES (1,NULL,'Welcome to GGCM','Serving the education of District Muzaffargarh for decades',1,1),(2,NULL,'Admissions Open 2026','Apply online for Intermediate and BS programs',2,1),(3,NULL,'Excellence in Science & IT','Modern labs, qualified faculty, and a rich library',3,1);
/*!40000 ALTER TABLE `sliders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cnic` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `designation` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `staff_cnic_unique` (`cnic`),
  KEY `staff_user_id_foreign` (`user_id`),
  CONSTRAINT `staff_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
-- Table structure for table `student_carry_forwards`
--

DROP TABLE IF EXISTS `student_carry_forwards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_carry_forwards` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `student_id` bigint NOT NULL,
  `subject_id` int NOT NULL,
  `from_term_no` tinyint NOT NULL,
  `status` enum('pending','cleared') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `cleared_by` bigint DEFAULT NULL,
  `cleared_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_carry_forwards_student_id_subject_id_key` (`student_id`,`subject_id`),
  KEY `student_carry_forwards_subject_id_fkey` (`subject_id`),
  CONSTRAINT `student_carry_forwards_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_carry_forwards_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_carry_forwards`
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `application_id` bigint DEFAULT NULL,
  `roll_number` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `registration_no` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `program_id` int NOT NULL,
  `class_section_id` int DEFAULT NULL,
  `academic_session_id` int NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `father_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cnic_bform` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gender` enum('male','female') COLLATE utf8mb4_unicode_ci NOT NULL,
  `dob` date NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardian_phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo_path` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `matric_board` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `matric_year` year NOT NULL,
  `matric_obtained` int NOT NULL,
  `matric_total` int NOT NULL,
  `inter_group_id` int DEFAULT NULL,
  `inter_board` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inter_year` year DEFAULT NULL,
  `inter_obtained` int DEFAULT NULL,
  `inter_total` int DEFAULT NULL,
  `status` enum('active','inactive','passed_out','struck_off') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `admitted_on` date NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `students_user_id_key` (`user_id`),
  UNIQUE KEY `students_roll_number_key` (`roll_number`),
  UNIQUE KEY `students_cnic_bform_key` (`cnic_bform`),
  UNIQUE KEY `students_application_id_key` (`application_id`),
  KEY `students_program_id_fkey` (`program_id`),
  KEY `students_class_section_id_fkey` (`class_section_id`),
  CONSTRAINT `students_application_id_fkey` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `students_class_section_id_fkey` FOREIGN KEY (`class_section_id`) REFERENCES `class_sections` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `students_program_id_fkey` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `students_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3125 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (1,201,NULL,'2026-GGCM-DEMO-001','2026-mgh-10001',2,2,5,'Demo Student 1','Demo Parent 1','32302-2000001-1','male','2005-01-01','0301-0000001','0300-0000001','College Campus Hostel, Muzaffargarh',NULL,'BISE Multan',2022,950,1100,NULL,NULL,NULL,NULL,NULL,'active','2026-08-01',NOW(),NOW()),(2,202,NULL,'2026-GGCM-DEMO-002','2026-mgh-10002',3,3,5,'Demo Student 2','Demo Parent 2','32302-2000002-1','male','2005-01-01','0301-0000002','0300-0000002','College Campus Hostel, Muzaffargarh',NULL,'BISE Multan',2022,950,1100,NULL,NULL,NULL,NULL,NULL,'active','2026-08-01',NOW(),NOW()),(3,203,NULL,'2026-GGCM-DEMO-003','2026-mgh-10003',4,4,5,'Demo Student 3','Demo Parent 3','32302-2000003-1','male','2005-01-01','0301-0000003','0300-0000003','College Campus Hostel, Muzaffargarh',NULL,'BISE Multan',2022,950,1100,NULL,NULL,NULL,NULL,NULL,'active','2026-08-01',NOW(),NOW()),(4,204,NULL,'2026-GGCM-DEMO-004','2026-mgh-10004',1,1,5,'Demo Student 4','Demo Parent 4','32302-2000004-1','male','2005-01-01','0301-0000004','0300-0000004','College Campus Hostel, Muzaffargarh',NULL,'BISE Multan',2022,950,1100,NULL,NULL,NULL,NULL,NULL,'active','2026-08-01',NOW(),NOW()),(5,205,NULL,'2026-GGCM-DEMO-005','2026-mgh-10005',2,2,5,'Demo Student 5','Demo Parent 5','32302-2000005-1','male','2005-01-01','0301-0000005','0300-0000005','College Campus Hostel, Muzaffargarh',NULL,'BISE Multan',2022,950,1100,NULL,NULL,NULL,NULL,NULL,'active','2026-08-01',NOW(),NOW()),(6,206,NULL,'2026-GGCM-DEMO-006','2026-mgh-10006',3,3,5,'Demo Student 6','Demo Parent 6','32302-2000006-1','male','2005-01-01','0301-0000006','0300-0000006','College Campus Hostel, Muzaffargarh',NULL,'BISE Multan',2022,950,1100,NULL,NULL,NULL,NULL,NULL,'active','2026-08-01',NOW(),NOW()),(7,207,NULL,'2026-GGCM-DEMO-007','2026-mgh-10007',4,4,5,'Demo Student 7','Demo Parent 7','32302-2000007-1','male','2005-01-01','0301-0000007','0300-0000007','College Campus Hostel, Muzaffargarh',NULL,'BISE Multan',2022,950,1100,NULL,NULL,NULL,NULL,NULL,'active','2026-08-01',NOW(),NOW()),(8,208,NULL,'2026-GGCM-DEMO-008','2026-mgh-10008',1,1,5,'Demo Student 8','Demo Parent 8','32302-2000008-1','male','2005-01-01','0301-0000008','0300-0000008','College Campus Hostel, Muzaffargarh',NULL,'BISE Multan',2022,950,1100,NULL,NULL,NULL,NULL,NULL,'active','2026-08-01',NOW(),NOW()),(9,209,NULL,'2026-GGCM-DEMO-009','2026-mgh-10009',2,2,5,'Demo Student 9','Demo Parent 9','32302-2000009-1','male','2005-01-01','0301-0000009','0300-0000009','College Campus Hostel, Muzaffargarh',NULL,'BISE Multan',2022,950,1100,NULL,NULL,NULL,NULL,NULL,'active','2026-08-01',NOW(),NOW()),(10,210,NULL,'2026-GGCM-DEMO-010','2026-mgh-10010',3,3,5,'Demo Student 10','Demo Parent 10','32302-2000010-1','male','2005-01-01','0301-0000010','0300-0000010','College Campus Hostel, Muzaffargarh',NULL,'BISE Multan',2022,950,1100,NULL,NULL,NULL,NULL,NULL,'active','2026-08-01',NOW(),NOW()),(11,211,NULL,'2026-GGCM-DEMO-011','2026-mgh-10011',4,4,5,'Demo Student 11','Demo Parent 11','32302-2000011-1','male','2005-01-01','0301-0000011','0300-0000011','College Campus Hostel, Muzaffargarh',NULL,'BISE Multan',2022,950,1100,NULL,NULL,NULL,NULL,NULL,'active','2026-08-01',NOW(),NOW()),(12,212,NULL,'2026-GGCM-DEMO-012','2026-mgh-10012',1,1,5,'Demo Student 12','Demo Parent 12','32302-2000012-1','male','2005-01-01','0301-0000012','0300-0000012','College Campus Hostel, Muzaffargarh',NULL,'BISE Multan',2022,950,1100,NULL,NULL,NULL,NULL,NULL,'active','2026-08-01',NOW(),NOW()),(13,213,NULL,'2026-GGCM-DEMO-013','2026-mgh-10013',2,2,5,'Demo Student 13','Demo Parent 13','32302-2000013-1','male','2005-01-01','0301-0000013','0300-0000013','College Campus Hostel, Muzaffargarh',NULL,'BISE Multan',2022,950,1100,NULL,NULL,NULL,NULL,NULL,'active','2026-08-01',NOW(),NOW()),(14,214,NULL,'2026-GGCM-DEMO-014','2026-mgh-10014',3,3,5,'Demo Student 14','Demo Parent 14','32302-2000014-1','male','2005-01-01','0301-0000014','0300-0000014','College Campus Hostel, Muzaffargarh',NULL,'BISE Multan',2022,950,1100,NULL,NULL,NULL,NULL,NULL,'active','2026-08-01',NOW(),NOW()),(15,215,NULL,'2026-GGCM-DEMO-015','2026-mgh-10015',4,4,5,'Demo Student 15','Demo Parent 15','32302-2000015-1','male','2005-01-01','0301-0000015','0300-0000015','College Campus Hostel, Muzaffargarh',NULL,'BISE Multan',2022,950,1100,NULL,NULL,NULL,NULL,NULL,'active','2026-08-01',NOW(),NOW()),(16,216,NULL,'2026-GGCM-DEMO-016','2026-mgh-10016',1,1,5,'Demo Student 16','Demo Parent 16','32302-2000016-1','male','2005-01-01','0301-0000016','0300-0000016','College Campus Hostel, Muzaffargarh',NULL,'BISE Multan',2022,950,1100,NULL,NULL,NULL,NULL,NULL,'active','2026-08-01',NOW(),NOW()),(17,217,NULL,'2026-GGCM-DEMO-017','2026-mgh-10017',2,2,5,'Demo Student 17','Demo Parent 17','32302-2000017-1','male','2005-01-01','0301-0000017','0300-0000017','College Campus Hostel, Muzaffargarh',NULL,'BISE Multan',2022,950,1100,NULL,NULL,NULL,NULL,NULL,'active','2026-08-01',NOW(),NOW()),(18,218,NULL,'2026-GGCM-DEMO-018','2026-mgh-10018',3,3,5,'Demo Student 18','Demo Parent 18','32302-2000018-1','male','2005-01-01','0301-0000018','0300-0000018','College Campus Hostel, Muzaffargarh',NULL,'BISE Multan',2022,950,1100,NULL,NULL,NULL,NULL,NULL,'active','2026-08-01',NOW(),NOW()),(19,219,NULL,'2026-GGCM-DEMO-019','2026-mgh-10019',4,4,5,'Demo Student 19','Demo Parent 19','32302-2000019-1','male','2005-01-01','0301-0000019','0300-0000019','College Campus Hostel, Muzaffargarh',NULL,'BISE Multan',2022,950,1100,NULL,NULL,NULL,NULL,NULL,'active','2026-08-01',NOW(),NOW()),(20,220,NULL,'2026-GGCM-DEMO-020','2026-mgh-10020',1,1,5,'Demo Student 20','Demo Parent 20','32302-2000020-1','male','2005-01-01','0301-0000020','0300-0000020','College Campus Hostel, Muzaffargarh',NULL,'BISE Multan',2022,950,1100,NULL,NULL,NULL,NULL,NULL,'active','2026-08-01',NOW(),NOW());
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `program_id` int NOT NULL,
  `term_no` tinyint NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `credit_hours` tinyint DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `subjects_program_id_code_key` (`program_id`,`code`),
  CONSTRAINT `subjects_program_id_fkey` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=409 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subjects`
-- Dumping data for table `subjects`
--

LOCK TABLES `subjects` WRITE;
/*!40000 ALTER TABLE `subjects` DISABLE KEYS */;
INSERT INTO `subjects` VALUES (1,1,1,'Introduction to Literary Studies','ENG-101',3,1),(2,1,1,'English Poetry I','ENG-102',3,1),(3,1,1,'English-I (Functional English)','ENG-103',2,1),(4,1,1,'Islamic Studies','ENG-104',2,1),(5,1,2,'English Prose','ENG-201',3,1),(6,1,2,'English Drama','ENG-202',3,1),(7,1,2,'English-II (Communication Skills)','ENG-203',2,1),(8,1,2,'Pakistan Studies','ENG-204',2,1),(9,1,3,'American Literature','ENG-301',3,1),(10,1,3,'English Poetry II','ENG-302',3,1),(11,1,3,'English-III (Academic Writing)','ENG-303',2,1),(12,1,3,'Quantitative Reasoning','ENG-304',2,1),(13,1,4,'The Modern Novel','ENG-401',3,1),(14,1,4,'Literary Criticism','ENG-402',3,1),(15,1,4,'Translation of the Holy Quran','ENG-403',2,1),(16,1,4,'Introduction to Computing','ENG-404',2,1),(17,1,5,'Introduction to Linguistics','ENG-501',3,1),(18,1,5,'Stylistics','ENG-502',3,1),(19,1,5,'English Elective I','ENG-503',3,1),(20,1,5,'Special Topics in English','ENG-504',3,1),(21,1,6,'Postcolonial Literature','ENG-601',3,1),(22,1,6,'Pakistani Literature in English','ENG-602',3,1),(23,1,6,'English Elective II','ENG-603',3,1),(24,1,6,'Term Paper & Presentation','ENG-604',3,1),(25,1,7,'Sociolinguistics','ENG-701',3,1),(26,1,7,'Discourse Analysis','ENG-702',3,1),(27,1,7,'English Elective III','ENG-703',3,1),(28,1,7,'Research Methodology','ENG-704',3,1),(29,1,8,'Modernist Poetry','ENG-801',3,1),(30,1,8,'Contemporary Literary Theory','ENG-802',3,1),(31,1,8,'English Elective IV','ENG-803',3,1),(32,1,8,'Capstone Project / Thesis','ENG-804',3,1),(33,2,1,'Urdu Zaban-o-Adab ka Irtiqa','URD-101',3,1),(34,2,1,'Klasiki Shairi','URD-102',3,1),(35,2,1,'English-I (Functional English)','URD-103',2,1),(36,2,1,'Islamic Studies','URD-104',2,1),(37,2,2,'Urdu Nasr','URD-201',3,1),(38,2,2,'Ghazal ki Riwayat','URD-202',3,1),(39,2,2,'English-II (Communication Skills)','URD-203',2,1),(40,2,2,'Pakistan Studies','URD-204',2,1),(41,2,3,'Dastan aur Novel','URD-301',3,1),(42,2,3,'Urdu Tanqeed I','URD-302',3,1),(43,2,3,'English-III (Academic Writing)','URD-303',2,1),(44,2,3,'Quantitative Reasoning','URD-304',2,1),(45,2,4,'Iqbaliyat','URD-401',3,1),(46,2,4,'Jadeed Nazm','URD-402',3,1),(47,2,4,'Translation of the Holy Quran','URD-403',2,1),(48,2,4,'Introduction to Computing','URD-404',2,1),(49,2,5,'Urdu Afsana','URD-501',3,1),(50,2,5,'Urdu Lisaniyat','URD-502',3,1),(51,2,5,'Urdu Elective I','URD-503',3,1),(52,2,5,'Special Topics in Urdu','URD-504',3,1),(53,2,6,'Urdu Sahafat','URD-601',3,1),(54,2,6,'Taraqqi Pasand Adab','URD-602',3,1),(55,2,6,'Urdu Elective II','URD-603',3,1),(56,2,6,'Term Paper & Presentation','URD-604',3,1),(57,2,7,'Urdu Tanqeed II','URD-701',3,1),(58,2,7,'Usool-e-Tehqeeq','URD-702',3,1),(59,2,7,'Urdu Elective III','URD-703',3,1),(60,2,7,'Research Methodology','URD-704',3,1),(61,2,8,'Pakistani Adab','URD-801',3,1),(62,2,8,'Jadeed Urdu Novel','URD-802',3,1),(63,2,8,'Urdu Elective IV','URD-803',3,1),(64,2,8,'Capstone Project / Thesis','URD-804',3,1),(65,3,1,'Programming Fundamentals','IT-101',4,1),(66,3,1,'Introduction to ICT','IT-102',3,1),(67,3,1,'English-I (Functional English)','IT-103',2,1),(68,3,1,'Islamic Studies','IT-104',2,1),(69,3,2,'Object Oriented Programming','IT-201',4,1),(70,3,2,'Digital Logic Design','IT-202',3,1),(71,3,2,'English-II (Communication Skills)','IT-203',2,1),(72,3,2,'Pakistan Studies','IT-204',2,1),(73,3,3,'Data Structures & Algorithms','IT-301',4,1),(74,3,3,'Database Systems','IT-302',3,1),(75,3,3,'English-III (Academic Writing)','IT-303',2,1),(76,3,3,'Quantitative Reasoning','IT-304',2,1),(77,3,4,'Computer Networks','IT-401',4,1),(78,3,4,'Operating Systems','IT-402',3,1),(79,3,4,'Translation of the Holy Quran','IT-403',2,1),(80,3,4,'Introduction to Computing','IT-404',2,1),(81,3,5,'Software Engineering','IT-501',4,1),(82,3,5,'Web Technologies','IT-502',3,1),(83,3,5,'Computing Elective I','IT-503',3,1),(84,3,5,'Special Topics in Computing','IT-504',3,1),(85,3,6,'Computer Architecture','IT-601',4,1),(86,3,6,'Information Security','IT-602',3,1),(87,3,6,'Computing Elective II','IT-603',3,1),(88,3,6,'Term Paper & Presentation','IT-604',3,1),(89,3,7,'Artificial Intelligence','IT-701',4,1),(90,3,7,'Mobile Application Development','IT-702',3,1),(91,3,7,'Computing Elective III','IT-703',3,1),(92,3,7,'Research Methodology','IT-704',3,1),(93,3,8,'Cloud Computing','IT-801',4,1),(94,3,8,'Data Science Fundamentals','IT-802',3,1),(95,3,8,'Computing Elective IV','IT-803',3,1),(96,3,8,'Capstone Project / Thesis','IT-804',3,1),(97,4,1,'Animal Diversity I (Invertebrates)','ZOO-101',4,1),(98,4,1,'Cell Biology','ZOO-102',3,1),(99,4,1,'English-I (Functional English)','ZOO-103',2,1),(100,4,1,'Islamic Studies','ZOO-104',2,1),(101,4,2,'Animal Diversity II (Chordates)','ZOO-201',4,1),(102,4,2,'Genetics I','ZOO-202',3,1),(103,4,2,'English-II (Communication Skills)','ZOO-203',2,1),(104,4,2,'Pakistan Studies','ZOO-204',2,1),(105,4,3,'Animal Physiology','ZOO-301',4,1),(106,4,3,'Biochemistry I','ZOO-302',3,1),(107,4,3,'English-III (Academic Writing)','ZOO-303',2,1),(108,4,3,'Quantitative Reasoning','ZOO-304',2,1),(109,4,4,'Developmental Biology','ZOO-401',4,1),(110,4,4,'Genetics II','ZOO-402',3,1),(111,4,4,'Translation of the Holy Quran','ZOO-403',2,1),(112,4,4,'Introduction to Computing','ZOO-404',2,1),(113,4,5,'Animal Ecology','ZOO-501',4,1),(114,4,5,'Evolution','ZOO-502',3,1),(115,4,5,'Zoology Elective I','ZOO-503',3,1),(116,4,5,'Special Topics in Zoology','ZOO-504',3,1),(117,4,6,'Parasitology','ZOO-601',4,1),(118,4,6,'Entomology','ZOO-602',3,1),(119,4,6,'Zoology Elective II','ZOO-603',3,1),(120,4,6,'Term Paper & Presentation','ZOO-604',3,1),(121,4,7,'Wildlife of Pakistan','ZOO-701',4,1),(122,4,7,'Molecular Biology','ZOO-702',3,1),(123,4,7,'Zoology Elective III','ZOO-703',3,1),(124,4,7,'Research Methodology','ZOO-704',3,1),(125,4,8,'Animal Behavior','ZOO-801',4,1),(126,4,8,'Fisheries & Aquaculture','ZOO-802',3,1),(127,4,8,'Zoology Elective IV','ZOO-803',3,1),(128,4,8,'Capstone Project / Thesis','ZOO-804',3,1),(129,5,1,'Calculus I','MATH-101',4,1),(130,5,1,'Discrete Mathematics','MATH-102',3,1),(131,5,1,'English-I (Functional English)','MATH-103',2,1),(132,5,1,'Islamic Studies','MATH-104',2,1),(133,5,2,'Calculus II','MATH-201',4,1),(134,5,2,'Linear Algebra','MATH-202',3,1),(135,5,2,'English-II (Communication Skills)','MATH-203',2,1),(136,5,2,'Pakistan Studies','MATH-204',2,1),(137,5,3,'Multivariable Calculus','MATH-301',4,1),(138,5,3,'Ordinary Differential Equations','MATH-302',3,1),(139,5,3,'English-III (Academic Writing)','MATH-303',2,1),(140,5,3,'Quantitative Reasoning','MATH-304',2,1),(141,5,4,'Real Analysis I','MATH-401',4,1),(142,5,4,'Group Theory','MATH-402',3,1),(143,5,4,'Translation of the Holy Quran','MATH-403',2,1),(144,5,4,'Introduction to Computing','MATH-404',2,1),(145,5,5,'Complex Analysis','MATH-501',4,1),(146,5,5,'Topology','MATH-502',3,1),(147,5,5,'Mathematics Elective I','MATH-503',3,1),(148,5,5,'Special Topics in Mathematics','MATH-504',3,1),(149,5,6,'Real Analysis II','MATH-601',4,1),(150,5,6,'Rings & Fields','MATH-602',3,1),(151,5,6,'Mathematics Elective II','MATH-603',3,1),(152,5,6,'Term Paper & Presentation','MATH-604',3,1),(153,5,7,'Functional Analysis','MATH-701',4,1),(154,5,7,'Numerical Analysis','MATH-702',3,1),(155,5,7,'Mathematics Elective III','MATH-703',3,1),(156,5,7,'Research Methodology','MATH-704',3,1),(157,5,8,'Partial Differential Equations','MATH-801',4,1),(158,5,8,'Mathematical Statistics','MATH-802',3,1),(159,5,8,'Mathematics Elective IV','MATH-803',3,1),(160,5,8,'Capstone Project / Thesis','MATH-804',3,1),(161,6,1,'Mechanics','PHY-101',4,1),(162,6,1,'Waves & Oscillations','PHY-102',3,1),(163,6,1,'English-I (Functional English)','PHY-103',2,1),(164,6,1,'Islamic Studies','PHY-104',2,1),(165,6,2,'Electricity & Magnetism','PHY-201',4,1),(166,6,2,'Heat & Thermodynamics','PHY-202',3,1),(167,6,2,'English-II (Communication Skills)','PHY-203',2,1),(168,6,2,'Pakistan Studies','PHY-204',2,1),(169,6,3,'Modern Physics','PHY-301',4,1),(170,6,3,'Optics','PHY-302',3,1),(171,6,3,'English-III (Academic Writing)','PHY-303',2,1),(172,6,3,'Quantitative Reasoning','PHY-304',2,1),(173,6,4,'Classical Mechanics','PHY-401',4,1),(174,6,4,'Electronics I','PHY-402',3,1),(175,6,4,'Translation of the Holy Quran','PHY-403',2,1),(176,6,4,'Introduction to Computing','PHY-404',2,1),(177,6,5,'Quantum Mechanics I','PHY-501',4,1),(178,6,5,'Electromagnetic Theory','PHY-502',3,1),(179,6,5,'Physics Elective I','PHY-503',3,1),(180,6,5,'Special Topics in Physics','PHY-504',3,1),(181,6,6,'Statistical Mechanics','PHY-601',4,1),(182,6,6,'Electronics II','PHY-602',3,1),(183,6,6,'Physics Elective II','PHY-603',3,1),(184,6,6,'Term Paper & Presentation','PHY-604',3,1),(185,6,7,'Quantum Mechanics II','PHY-701',4,1),(186,6,7,'Solid State Physics','PHY-702',3,1),(187,6,7,'Physics Elective III','PHY-703',3,1),(188,6,7,'Research Methodology','PHY-704',3,1),(189,6,8,'Nuclear Physics','PHY-801',4,1),(190,6,8,'Computational Physics','PHY-802',3,1),(191,6,8,'Physics Elective IV','PHY-803',3,1),(192,6,8,'Capstone Project / Thesis','PHY-804',3,1),(193,7,1,'Inorganic Chemistry I','CHEM-101',4,1),(194,7,1,'Physical Chemistry I','CHEM-102',3,1),(195,7,1,'English-I (Functional English)','CHEM-103',2,1),(196,7,1,'Islamic Studies','CHEM-104',2,1),(197,7,2,'Organic Chemistry I','CHEM-201',4,1),(198,7,2,'Analytical Chemistry','CHEM-202',3,1),(199,7,2,'English-II (Communication Skills)','CHEM-203',2,1),(200,7,2,'Pakistan Studies','CHEM-204',2,1),(201,7,3,'Inorganic Chemistry II','CHEM-301',4,1),(202,7,3,'Physical Chemistry II','CHEM-302',3,1),(203,7,3,'English-III (Academic Writing)','CHEM-303',2,1),(204,7,3,'Quantitative Reasoning','CHEM-304',2,1),(205,7,4,'Organic Chemistry II','CHEM-401',4,1),(206,7,4,'Environmental Chemistry','CHEM-402',3,1),(207,7,4,'Translation of the Holy Quran','CHEM-403',2,1),(208,7,4,'Introduction to Computing','CHEM-404',2,1),(209,7,5,'Spectroscopy','CHEM-501',4,1),(210,7,5,'Electrochemistry','CHEM-502',3,1),(211,7,5,'Chemistry Elective I','CHEM-503',3,1),(212,7,5,'Special Topics in Chemistry','CHEM-504',3,1),(213,7,6,'Biochemistry','CHEM-601',4,1),(214,7,6,'Polymer Chemistry','CHEM-602',3,1),(215,7,6,'Chemistry Elective II','CHEM-603',3,1),(216,7,6,'Term Paper & Presentation','CHEM-604',3,1),(217,7,7,'Organometallic Chemistry','CHEM-701',4,1),(218,7,7,'Industrial Chemistry','CHEM-702',3,1),(219,7,7,'Chemistry Elective III','CHEM-703',3,1),(220,7,7,'Research Methodology','CHEM-704',3,1),(221,7,8,'Medicinal Chemistry','CHEM-801',4,1),(222,7,8,'Applied Chemistry','CHEM-802',3,1),(223,7,8,'Chemistry Elective IV','CHEM-803',3,1),(224,7,8,'Capstone Project / Thesis','CHEM-804',3,1),(225,8,1,'Uloom-ul-Quran','ISL-101',3,1),(226,8,1,'Seerat-un-Nabi (SAW)','ISL-102',3,1),(227,8,1,'English-I (Functional English)','ISL-103',2,1),(228,8,1,'Islamic Studies','ISL-104',2,1),(229,8,2,'Uloom-ul-Hadith','ISL-201',3,1),(230,8,2,'Fiqh I','ISL-202',3,1),(231,8,2,'English-II (Communication Skills)','ISL-203',2,1),(232,8,2,'Pakistan Studies','ISL-204',2,1),(233,8,3,'Tafseer I','ISL-301',3,1),(234,8,3,'Islamic History: Khilafat-e-Rashida','ISL-302',3,1),(235,8,3,'English-III (Academic Writing)','ISL-303',2,1),(236,8,3,'Quantitative Reasoning','ISL-304',2,1),(237,8,4,'Fiqh II','ISL-401',3,1),(238,8,4,'Arabic Grammar I','ISL-402',3,1),(239,8,4,'Translation of the Holy Quran','ISL-403',2,1),(240,8,4,'Introduction to Computing','ISL-404',2,1),(241,8,5,'Tafseer II','ISL-501',3,1),(242,8,5,'Islamic History: Umayyads & Abbasids','ISL-502',3,1),(243,8,5,'Islamic Studies Elective I','ISL-503',3,1),(244,8,5,'Special Topics in Islamic Studies','ISL-504',3,1),(245,8,6,'Usool-e-Fiqh','ISL-601',3,1),(246,8,6,'Arabic Grammar II','ISL-602',3,1),(247,8,6,'Islamic Studies Elective II','ISL-603',3,1),(248,8,6,'Term Paper & Presentation','ISL-604',3,1),(249,8,7,'Dawah & Communication','ISL-701',3,1),(250,8,7,'Muslim Philosophy','ISL-702',3,1),(251,8,7,'Islamic Studies Elective III','ISL-703',3,1),(252,8,7,'Research Methodology','ISL-704',3,1),(253,8,8,'Comparative Religions','ISL-801',3,1),(254,8,8,'Islam & Contemporary Issues','ISL-802',3,1),(255,8,8,'Islamic Studies Elective IV','ISL-803',3,1),(256,8,8,'Capstone Project / Thesis','ISL-804',3,1),(257,9,1,'Introduction to Political Science','PS-101',3,1),(258,9,1,'Western Political Thought I','PS-102',3,1),(259,9,1,'English-I (Functional English)','PS-103',2,1),(260,9,1,'Islamic Studies','PS-104',2,1),(261,9,2,'Political Systems: UK & USA','PS-201',3,1),(262,9,2,'Muslim Political Thought','PS-202',3,1),(263,9,2,'English-II (Communication Skills)','PS-203',2,1),(264,9,2,'Pakistan Studies','PS-204',2,1),(265,9,3,'Constitutional Development in Pakistan','PS-301',3,1),(266,9,3,'Western Political Thought II','PS-302',3,1),(267,9,3,'English-III (Academic Writing)','PS-303',2,1),(268,9,3,'Quantitative Reasoning','PS-304',2,1),(269,9,4,'International Relations','PS-401',3,1),(270,9,4,'Local Government in Pakistan','PS-402',3,1),(271,9,4,'Translation of the Holy Quran','PS-403',2,1),(272,9,4,'Introduction to Computing','PS-404',2,1),(273,9,5,'Comparative Politics','PS-501',3,1),(274,9,5,'Foreign Policy of Pakistan','PS-502',3,1),(275,9,5,'Political Science Elective I','PS-503',3,1),(276,9,5,'Special Topics in Political Science','PS-504',3,1),(277,9,6,'Public Administration','PS-601',3,1),(278,9,6,'Political Sociology','PS-602',3,1),(279,9,6,'Political Science Elective II','PS-603',3,1),(280,9,6,'Term Paper & Presentation','PS-604',3,1),(281,9,7,'Politics of South Asia','PS-701',3,1),(282,9,7,'International Law','PS-702',3,1),(283,9,7,'Political Science Elective III','PS-703',3,1),(284,9,7,'Research Methodology','PS-704',3,1),(285,9,8,'Human Rights & Democracy','PS-801',3,1),(286,9,8,'Governance & Public Policy','PS-802',3,1),(287,9,8,'Political Science Elective IV','PS-803',3,1),(288,9,8,'Capstone Project / Thesis','PS-804',3,1),(289,10,1,'Principles of Microeconomics','ECO-101',3,1),(290,10,1,'Principles of Macroeconomics','ECO-102',3,1),(291,10,1,'English-I (Functional English)','ECO-103',2,1),(292,10,1,'Islamic Studies','ECO-104',2,1),(293,10,2,'Intermediate Microeconomics','ECO-201',3,1),(294,10,2,'Intermediate Macroeconomics','ECO-202',3,1),(295,10,2,'English-II (Communication Skills)','ECO-203',2,1),(296,10,2,'Pakistan Studies','ECO-204',2,1),(297,10,3,'Mathematical Economics','ECO-301',3,1),(298,10,3,'Statistics for Economists','ECO-302',3,1),(299,10,3,'English-III (Academic Writing)','ECO-303',2,1),(300,10,3,'Quantitative Reasoning','ECO-304',2,1),(301,10,4,'Development Economics','ECO-401',3,1),(302,10,4,'Monetary Economics','ECO-402',3,1),(303,10,4,'Translation of the Holy Quran','ECO-403',2,1),(304,10,4,'Introduction to Computing','ECO-404',2,1),(305,10,5,'International Trade','ECO-501',3,1),(306,10,5,'Econometrics I','ECO-502',3,1),(307,10,5,'Economics Elective I','ECO-503',3,1),(308,10,5,'Special Topics in Economics','ECO-504',3,1),(309,10,6,'Public Finance','ECO-601',3,1),(310,10,6,'Economy of Pakistan','ECO-602',3,1),(311,10,6,'Economics Elective II','ECO-603',3,1),(312,10,6,'Term Paper & Presentation','ECO-604',3,1),(313,10,7,'Econometrics II','ECO-701',3,1),(314,10,7,'Islamic Economics','ECO-702',3,1),(315,10,7,'Economics Elective III','ECO-703',3,1),(316,10,7,'Research Methodology','ECO-704',3,1),(317,10,8,'Agricultural Economics','ECO-801',3,1),(318,10,8,'Labour Economics','ECO-802',3,1),(319,10,8,'Economics Elective IV','ECO-803',3,1),(320,10,8,'Capstone Project / Thesis','ECO-804',3,1),(321,11,1,'Introduction to Statistics','STAT-101',4,1),(322,11,1,'Probability Theory','STAT-102',3,1),(323,11,1,'English-I (Functional English)','STAT-103',2,1),(324,11,1,'Islamic Studies','STAT-104',2,1),(325,11,2,'Statistical Methods','STAT-201',4,1),(326,11,2,'Probability Distributions','STAT-202',3,1),(327,11,2,'English-II (Communication Skills)','STAT-203',2,1),(328,11,2,'Pakistan Studies','STAT-204',2,1),(329,11,3,'Sampling Techniques I','STAT-301',4,1),(330,11,3,'Regression Analysis','STAT-302',3,1),(331,11,3,'English-III (Academic Writing)','STAT-303',2,1),(332,11,3,'Quantitative Reasoning','STAT-304',2,1),(333,11,4,'Statistical Inference I','STAT-401',4,1),(334,11,4,'Design of Experiments I','STAT-402',3,1),(335,11,4,'Translation of the Holy Quran','STAT-403',2,1),(336,11,4,'Introduction to Computing','STAT-404',2,1),(337,11,5,'Statistical Inference II','STAT-501',4,1),(338,11,5,'Sampling Techniques II','STAT-502',3,1),(339,11,5,'Statistics Elective I','STAT-503',3,1),(340,11,5,'Special Topics in Statistics','STAT-504',3,1),(341,11,6,'Design of Experiments II','STAT-601',4,1),(342,11,6,'Applied Multivariate Analysis','STAT-602',3,1),(343,11,6,'Statistics Elective II','STAT-603',3,1),(344,11,6,'Term Paper & Presentation','STAT-604',3,1),(345,11,7,'Time Series Analysis','STAT-701',4,1),(346,11,7,'Non-Parametric Methods','STAT-702',3,1),(347,11,7,'Statistics Elective III','STAT-703',3,1),(348,11,7,'Research Methodology','STAT-704',3,1),(349,11,8,'Statistical Quality Control','STAT-801',4,1),(350,11,8,'Official Statistics of Pakistan','STAT-802',3,1),(351,11,8,'Statistics Elective IV','STAT-803',3,1),(352,11,8,'Capstone Project / Thesis','STAT-804',3,1),(353,12,1,'Biology (Part-I)','PM-101',3,1),(354,12,1,'Physics (Part-I)','PM-102',3,1),(355,12,1,'Chemistry (Part-I)','PM-103',3,1),(356,12,1,'English (Part-I)','PM-104',3,1),(357,12,1,'Urdu (Part-I)','PM-105',3,1),(358,12,1,'Islamiyat (Compulsory) (Part-I)','PM-106',3,1),(359,12,1,'Tarjuma-tul-Quran (Part-I)','PM-107',3,1),(360,12,2,'Biology (Part-II)','PM-201',3,1),(361,12,2,'Physics (Part-II)','PM-202',3,1),(362,12,2,'Chemistry (Part-II)','PM-203',3,1),(363,12,2,'English (Part-II)','PM-204',3,1),(364,12,2,'Urdu (Part-II)','PM-205',3,1),(365,12,2,'Pakistan Studies (Part-II)','PM-206',3,1),(366,12,2,'Tarjuma-tul-Quran (Part-II)','PM-207',3,1),(367,13,1,'Mathematics (Part-I)','PE-101',3,1),(368,13,1,'Physics (Part-I)','PE-102',3,1),(369,13,1,'Chemistry (Part-I)','PE-103',3,1),(370,13,1,'English (Part-I)','PE-104',3,1),(371,13,1,'Urdu (Part-I)','PE-105',3,1),(372,13,1,'Islamiyat (Compulsory) (Part-I)','PE-106',3,1),(373,13,1,'Tarjuma-tul-Quran (Part-I)','PE-107',3,1),(374,13,2,'Mathematics (Part-II)','PE-201',3,1),(375,13,2,'Physics (Part-II)','PE-202',3,1),(376,13,2,'Chemistry (Part-II)','PE-203',3,1),(377,13,2,'English (Part-II)','PE-204',3,1),(378,13,2,'Urdu (Part-II)','PE-205',3,1),(379,13,2,'Pakistan Studies (Part-II)','PE-206',3,1),(380,13,2,'Tarjuma-tul-Quran (Part-II)','PE-207',3,1),(381,14,1,'Computer Science (Part-I)','ICS-101',3,1),(382,14,1,'Mathematics (Part-I)','ICS-102',3,1),(383,14,1,'Physics (Part-I)','ICS-103',3,1),(384,14,1,'English (Part-I)','ICS-104',3,1),(385,14,1,'Urdu (Part-I)','ICS-105',3,1),(386,14,1,'Islamiyat (Compulsory) (Part-I)','ICS-106',3,1),(387,14,1,'Tarjuma-tul-Quran (Part-I)','ICS-107',3,1),(388,14,2,'Computer Science (Part-II)','ICS-201',3,1),(389,14,2,'Mathematics (Part-II)','ICS-202',3,1),(390,14,2,'Physics (Part-II)','ICS-203',3,1),(391,14,2,'English (Part-II)','ICS-204',3,1),(392,14,2,'Urdu (Part-II)','ICS-205',3,1),(393,14,2,'Pakistan Studies (Part-II)','ICS-206',3,1),(394,14,2,'Tarjuma-tul-Quran (Part-II)','ICS-207',3,1),(395,15,1,'Civics (Part-I)','FA-101',3,1),(396,15,1,'Education (Part-I)','FA-102',3,1),(397,15,1,'Islamic Studies (Elective) (Part-I)','FA-103',3,1),(398,15,1,'English (Part-I)','FA-104',3,1),(399,15,1,'Urdu (Part-I)','FA-105',3,1),(400,15,1,'Islamiyat (Compulsory) (Part-I)','FA-106',3,1),(401,15,1,'Tarjuma-tul-Quran (Part-I)','FA-107',3,1),(402,15,2,'Civics (Part-II)','FA-201',3,1),(403,15,2,'Education (Part-II)','FA-202',3,1),(404,15,2,'Islamic Studies (Elective) (Part-II)','FA-203',3,1),(405,15,2,'English (Part-II)','FA-204',3,1),(406,15,2,'Urdu (Part-II)','FA-205',3,1),(407,15,2,'Pakistan Studies (Part-II)','FA-206',3,1),(408,15,2,'Tarjuma-tul-Quran (Part-II)','FA-207',3,1);
/*!40000 ALTER TABLE `subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `assigned_to_user_id` bigint DEFAULT NULL,
  `created_by_user_id` bigint NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `due_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tasks_assigned_to_user_id_foreign` (`assigned_to_user_id`),
  KEY `tasks_created_by_user_id_foreign` (`created_by_user_id`),
  CONSTRAINT `tasks_assigned_to_user_id_foreign` FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tasks_created_by_user_id_foreign` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teachers`
--

DROP TABLE IF EXISTS `teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teachers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `father_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cnic` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gender` enum('male','female') COLLATE utf8mb4_unicode_ci NOT NULL,
  `dob` date DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department_id` int NOT NULL,
  `designation_id` int NOT NULL,
  `teacher_type` enum('permanent','cti','adhoc','visiting') COLLATE utf8mb4_unicode_ci NOT NULL,
  `qualification` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specialization` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `education` text COLLATE utf8mb4_unicode_ci,
  `experience` text COLLATE utf8mb4_unicode_ci,
  `joining_date` date DEFAULT NULL,
  `photo_path` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','left') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teachers_user_id_key` (`user_id`),
  UNIQUE KEY `teachers_cnic_key` (`cnic`),
  KEY `teachers_department_id_fkey` (`department_id`),
  KEY `teachers_designation_id_fkey` (`designation_id`),
  CONSTRAINT `teachers_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `teachers_designation_id_fkey` FOREIGN KEY (`designation_id`) REFERENCES `designations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teachers`
LOCK TABLES `teachers` WRITE;
/*!40000 ALTER TABLE `teachers` DISABLE KEYS */;
INSERT INTO `teachers` VALUES (1,101,'Faculty Member 1','Guardian 1','32302-1000001-1','male','1985-01-01','0300-1000001','faculty1@ggcm.com',17,1,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(2,102,'Faculty Member 2','Guardian 2','32302-1000002-1','male','1985-01-01','0300-1000002','faculty2@ggcm.com',17,2,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(3,103,'Faculty Member 3','Guardian 3','32302-1000003-1','male','1985-01-01','0300-1000003','faculty3@ggcm.com',17,2,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(4,104,'Faculty Member 4','Guardian 4','32302-1000004-1','male','1985-01-01','0300-1000004','faculty4@ggcm.com',17,2,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(5,105,'Faculty Member 5','Guardian 5','32302-1000005-1','male','1985-01-01','0300-1000005','faculty5@ggcm.com',17,2,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(6,106,'Faculty Member 6','Guardian 6','32302-1000006-1','male','1985-01-01','0300-1000006','faculty6@ggcm.com',1,2,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(7,107,'Faculty Member 7','Guardian 7','32302-1000007-1','male','1985-01-01','0300-1000007','faculty7@ggcm.com',6,2,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(8,108,'Faculty Member 8','Guardian 8','32302-1000008-1','male','1985-01-01','0300-1000008','faculty8@ggcm.com',12,2,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(9,109,'Faculty Member 9','Guardian 9','32302-1000009-1','male','1985-01-01','0300-1000009','faculty9@ggcm.com',17,2,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(10,110,'Faculty Member 10','Guardian 10','32302-1000010-1','male','1985-01-01','0300-1000010','faculty10@ggcm.com',5,2,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(11,111,'Faculty Member 11','Guardian 11','32302-1000011-1','male','1985-01-01','0300-1000011','faculty11@ggcm.com',19,2,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(12,112,'Faculty Member 12','Guardian 12','32302-1000012-1','male','1985-01-01','0300-1000012','faculty12@ggcm.com',16,2,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(13,113,'Faculty Member 13','Guardian 13','32302-1000013-1','male','1985-01-01','0300-1000013','faculty13@ggcm.com',7,2,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(14,114,'Faculty Member 14','Guardian 14','32302-1000014-1','male','1985-01-01','0300-1000014','faculty14@ggcm.com',1,2,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(15,115,'Faculty Member 15','Guardian 15','32302-1000015-1','male','1985-01-01','0300-1000015','faculty15@ggcm.com',5,2,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(16,116,'Faculty Member 16','Guardian 16','32302-1000016-1','male','1985-01-01','0300-1000016','faculty16@ggcm.com',9,2,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(17,117,'Faculty Member 17','Guardian 17','32302-1000017-1','male','1985-01-01','0300-1000017','faculty17@ggcm.com',4,2,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(18,118,'Faculty Member 18','Guardian 18','32302-1000018-1','male','1985-01-01','0300-1000018','faculty18@ggcm.com',16,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(19,119,'Faculty Member 19','Guardian 19','32302-1000019-1','male','1985-01-01','0300-1000019','faculty19@ggcm.com',13,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(20,120,'Faculty Member 20','Guardian 20','32302-1000020-1','male','1985-01-01','0300-1000020','faculty20@ggcm.com',19,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(21,121,'Faculty Member 21','Guardian 21','32302-1000021-1','male','1985-01-01','0300-1000021','faculty21@ggcm.com',13,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(22,122,'Faculty Member 22','Guardian 22','32302-1000022-1','male','1985-01-01','0300-1000022','faculty22@ggcm.com',10,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(23,123,'Faculty Member 23','Guardian 23','32302-1000023-1','male','1985-01-01','0300-1000023','faculty23@ggcm.com',4,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(24,124,'Faculty Member 24','Guardian 24','32302-1000024-1','male','1985-01-01','0300-1000024','faculty24@ggcm.com',14,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(25,125,'Faculty Member 25','Guardian 25','32302-1000025-1','male','1985-01-01','0300-1000025','faculty25@ggcm.com',2,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(26,126,'Faculty Member 26','Guardian 26','32302-1000026-1','male','1985-01-01','0300-1000026','faculty26@ggcm.com',1,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(27,127,'Faculty Member 27','Guardian 27','32302-1000027-1','male','1985-01-01','0300-1000027','faculty27@ggcm.com',14,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(28,128,'Faculty Member 28','Guardian 28','32302-1000028-1','male','1985-01-01','0300-1000028','faculty28@ggcm.com',18,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(29,129,'Faculty Member 29','Guardian 29','32302-1000029-1','male','1985-01-01','0300-1000029','faculty29@ggcm.com',9,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(30,130,'Faculty Member 30','Guardian 30','32302-1000030-1','male','1985-01-01','0300-1000030','faculty30@ggcm.com',6,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(31,131,'Faculty Member 31','Guardian 31','32302-1000031-1','male','1985-01-01','0300-1000031','faculty31@ggcm.com',10,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(32,132,'Faculty Member 32','Guardian 32','32302-1000032-1','male','1985-01-01','0300-1000032','faculty32@ggcm.com',7,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(33,133,'Faculty Member 33','Guardian 33','32302-1000033-1','male','1985-01-01','0300-1000033','faculty33@ggcm.com',2,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(34,134,'Faculty Member 34','Guardian 34','32302-1000034-1','male','1985-01-01','0300-1000034','faculty34@ggcm.com',7,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(35,135,'Faculty Member 35','Guardian 35','32302-1000035-1','male','1985-01-01','0300-1000035','faculty35@ggcm.com',7,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(36,136,'Faculty Member 36','Guardian 36','32302-1000036-1','male','1985-01-01','0300-1000036','faculty36@ggcm.com',6,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(37,137,'Faculty Member 37','Guardian 37','32302-1000037-1','male','1985-01-01','0300-1000037','faculty37@ggcm.com',1,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(38,138,'Faculty Member 38','Guardian 38','32302-1000038-1','male','1985-01-01','0300-1000038','faculty38@ggcm.com',6,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(39,139,'Faculty Member 39','Guardian 39','32302-1000039-1','male','1985-01-01','0300-1000039','faculty39@ggcm.com',1,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(40,140,'Faculty Member 40','Guardian 40','32302-1000040-1','male','1985-01-01','0300-1000040','faculty40@ggcm.com',5,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(41,141,'Faculty Member 41','Guardian 41','32302-1000041-1','male','1985-01-01','0300-1000041','faculty41@ggcm.com',11,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(42,142,'Faculty Member 42','Guardian 42','32302-1000042-1','male','1985-01-01','0300-1000042','faculty42@ggcm.com',16,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(43,143,'Faculty Member 43','Guardian 43','32302-1000043-1','male','1985-01-01','0300-1000043','faculty43@ggcm.com',10,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(44,144,'Faculty Member 44','Guardian 44','32302-1000044-1','male','1985-01-01','0300-1000044','faculty44@ggcm.com',4,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(45,145,'Faculty Member 45','Guardian 45','32302-1000045-1','male','1985-01-01','0300-1000045','faculty45@ggcm.com',4,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(46,146,'Faculty Member 46','Guardian 46','32302-1000046-1','male','1985-01-01','0300-1000046','faculty46@ggcm.com',6,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(47,147,'Faculty Member 47','Guardian 47','32302-1000047-1','male','1985-01-01','0300-1000047','faculty47@ggcm.com',6,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(48,148,'Faculty Member 48','Guardian 48','32302-1000048-1','male','1985-01-01','0300-1000048','faculty48@ggcm.com',8,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(49,149,'Faculty Member 49','Guardian 49','32302-1000049-1','male','1985-01-01','0300-1000049','faculty49@ggcm.com',8,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(50,150,'Faculty Member 50','Guardian 50','32302-1000050-1','male','1985-01-01','0300-1000050','faculty50@ggcm.com',22,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(51,151,'Faculty Member 51','Guardian 51','32302-1000051-1','male','1985-01-01','0300-1000051','faculty51@ggcm.com',6,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(52,152,'Faculty Member 52','Guardian 52','32302-1000052-1','male','1985-01-01','0300-1000052','faculty52@ggcm.com',5,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(53,153,'Faculty Member 53','Guardian 53','32302-1000053-1','male','1985-01-01','0300-1000053','faculty53@ggcm.com',2,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(54,154,'Faculty Member 54','Guardian 54','32302-1000054-1','male','1985-01-01','0300-1000054','faculty54@ggcm.com',8,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(55,155,'Faculty Member 55','Guardian 55','32302-1000055-1','male','1985-01-01','0300-1000055','faculty55@ggcm.com',1,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(56,156,'Faculty Member 56','Guardian 56','32302-1000056-1','male','1985-01-01','0300-1000056','faculty56@ggcm.com',20,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(57,157,'Faculty Member 57','Guardian 57','32302-1000057-1','male','1985-01-01','0300-1000057','faculty57@ggcm.com',18,3,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(58,158,'Faculty Member 58','Guardian 58','32302-1000058-1','male','1985-01-01','0300-1000058','faculty58@ggcm.com',9,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(59,159,'Faculty Member 59','Guardian 59','32302-1000059-1','male','1985-01-01','0300-1000059','faculty59@ggcm.com',22,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(60,160,'Faculty Member 60','Guardian 60','32302-1000060-1','male','1985-01-01','0300-1000060','faculty60@ggcm.com',6,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(61,161,'Faculty Member 61','Guardian 61','32302-1000061-1','male','1985-01-01','0300-1000061','faculty61@ggcm.com',10,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(62,162,'Faculty Member 62','Guardian 62','32302-1000062-1','male','1985-01-01','0300-1000062','faculty62@ggcm.com',10,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(63,163,'Faculty Member 63','Guardian 63','32302-1000063-1','male','1985-01-01','0300-1000063','faculty63@ggcm.com',7,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(64,164,'Faculty Member 64','Guardian 64','32302-1000064-1','male','1985-01-01','0300-1000064','faculty64@ggcm.com',5,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(65,165,'Faculty Member 65','Guardian 65','32302-1000065-1','male','1985-01-01','0300-1000065','faculty65@ggcm.com',5,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(66,166,'Faculty Member 66','Guardian 66','32302-1000066-1','male','1985-01-01','0300-1000066','faculty66@ggcm.com',5,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(67,167,'Faculty Member 67','Guardian 67','32302-1000067-1','male','1985-01-01','0300-1000067','faculty67@ggcm.com',1,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(68,168,'Faculty Member 68','Guardian 68','32302-1000068-1','male','1985-01-01','0300-1000068','faculty68@ggcm.com',1,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(69,169,'Faculty Member 69','Guardian 69','32302-1000069-1','male','1985-01-01','0300-1000069','faculty69@ggcm.com',5,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(70,170,'Faculty Member 70','Guardian 70','32302-1000070-1','male','1985-01-01','0300-1000070','faculty70@ggcm.com',6,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(71,171,'Faculty Member 71','Guardian 71','32302-1000071-1','male','1985-01-01','0300-1000071','faculty71@ggcm.com',13,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(72,172,'Faculty Member 72','Guardian 72','32302-1000072-1','male','1985-01-01','0300-1000072','faculty72@ggcm.com',11,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(73,173,'Faculty Member 73','Guardian 73','32302-1000073-1','male','1985-01-01','0300-1000073','faculty73@ggcm.com',8,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(74,174,'Faculty Member 74','Guardian 74','32302-1000074-1','male','1985-01-01','0300-1000074','faculty74@ggcm.com',11,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(75,175,'Faculty Member 75','Guardian 75','32302-1000075-1','male','1985-01-01','0300-1000075','faculty75@ggcm.com',17,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(76,176,'Faculty Member 76','Guardian 76','32302-1000076-1','male','1985-01-01','0300-1000076','faculty76@ggcm.com',10,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(77,177,'Faculty Member 77','Guardian 77','32302-1000077-1','male','1985-01-01','0300-1000077','faculty77@ggcm.com',1,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(78,178,'Faculty Member 78','Guardian 78','32302-1000078-1','male','1985-01-01','0300-1000078','faculty78@ggcm.com',6,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(79,179,'Faculty Member 79','Guardian 79','32302-1000079-1','male','1985-01-01','0300-1000079','faculty79@ggcm.com',7,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(80,180,'Faculty Member 80','Guardian 80','32302-1000080-1','male','1985-01-01','0300-1000080','faculty80@ggcm.com',16,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(81,181,'Faculty Member 81','Guardian 81','32302-1000081-1','male','1985-01-01','0300-1000081','faculty81@ggcm.com',11,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(82,182,'Faculty Member 82','Guardian 82','32302-1000082-1','male','1985-01-01','0300-1000082','faculty82@ggcm.com',2,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(83,183,'Faculty Member 83','Guardian 83','32302-1000083-1','male','1985-01-01','0300-1000083','faculty83@ggcm.com',8,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(84,184,'Faculty Member 84','Guardian 84','32302-1000084-1','male','1985-01-01','0300-1000084','faculty84@ggcm.com',16,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(85,185,'Faculty Member 85','Guardian 85','32302-1000085-1','male','1985-01-01','0300-1000085','faculty85@ggcm.com',3,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(86,186,'Faculty Member 86','Guardian 86','32302-1000086-1','male','1985-01-01','0300-1000086','faculty86@ggcm.com',17,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(87,187,'Faculty Member 87','Guardian 87','32302-1000087-1','male','1985-01-01','0300-1000087','faculty87@ggcm.com',21,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(88,188,'Faculty Member 88','Guardian 88','32302-1000088-1','male','1985-01-01','0300-1000088','faculty88@ggcm.com',10,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(89,189,'Faculty Member 89','Guardian 89','32302-1000089-1','male','1985-01-01','0300-1000089','faculty89@ggcm.com',5,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW()),(90,190,'Faculty Member 90','Guardian 90','32302-1000090-1','male','1985-01-01','0300-1000090','faculty90@ggcm.com',15,4,'permanent','Ph.D / M.Phil','Specialization','Higher Education','Government Teaching Experience','2020-01-01',NULL,'active',NOW(),NOW());
/*!40000 ALTER TABLE `teachers` ENABLE KEYS */;
UNLOCK TABLES;
-- Table structure for table `time_slots`
--

DROP TABLE IF EXISTS `time_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `time_slots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_time` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `end_time` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shift` enum('morning','evening') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'morning',
  `sort_order` tinyint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `time_slots_shift_start_time_end_time_key` (`shift`,`start_time`,`end_time`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `time_slots`
-- Dumping data for table `time_slots`
--

LOCK TABLES `time_slots` WRITE;
/*!40000 ALTER TABLE `time_slots` DISABLE KEYS */;
INSERT INTO `time_slots` VALUES (1,'Period 1','08:00','08:40','morning',1),(2,'Period 2','08:40','09:20','morning',2),(3,'Period 3','09:20','10:00','morning',3),(4,'Period 4','10:00','10:40','morning',4),(5,'Period 5','11:00','11:40','morning',5),(6,'Period 6','11:40','12:20','morning',6),(7,'Period 7','12:20','13:00','morning',7),(8,'Period 1','14:00','14:40','evening',1),(9,'Period 2','14:40','15:20','evening',2),(10,'Period 3','15:20','16:00','evening',3),(11,'Period 4','16:00','16:40','evening',4),(12,'Period 5','17:00','17:40','evening',5);
/*!40000 ALTER TABLE `time_slots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `timetable_entries`
--

DROP TABLE IF EXISTS `timetable_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `timetable_entries` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `allocation_id` bigint NOT NULL,
  `academic_session_id` int NOT NULL,
  `day` enum('mon','tue','wed','thu','fri','sat') COLLATE utf8mb4_unicode_ci NOT NULL,
  `time_slot_id` int NOT NULL,
  `room_id` int NOT NULL,
  `teacher_id` bigint NOT NULL,
  `class_section_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `timetable_entries_day_time_slot_id_room_id_key` (`day`,`time_slot_id`,`room_id`),
  UNIQUE KEY `timetable_entries_day_time_slot_id_teacher_id_key` (`day`,`time_slot_id`,`teacher_id`),
  UNIQUE KEY `timetable_entries_day_time_slot_id_class_section_id_key` (`day`,`time_slot_id`,`class_section_id`),
  KEY `timetable_entries_allocation_id_fkey` (`allocation_id`),
  KEY `timetable_entries_time_slot_id_fkey` (`time_slot_id`),
  KEY `timetable_entries_room_id_fkey` (`room_id`),
  KEY `timetable_entries_teacher_id_fkey` (`teacher_id`),
  KEY `timetable_entries_class_section_id_fkey` (`class_section_id`),
  CONSTRAINT `timetable_entries_allocation_id_fkey` FOREIGN KEY (`allocation_id`) REFERENCES `allocations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `timetable_entries_class_section_id_fkey` FOREIGN KEY (`class_section_id`) REFERENCES `class_sections` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `timetable_entries_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `timetable_entries_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `timetable_entries_time_slot_id_fkey` FOREIGN KEY (`time_slot_id`) REFERENCES `time_slots` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=990 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `timetable_entries`
-- Dumping data for table `timetable_entries`
--

LOCK TABLES `timetable_entries` WRITE;
/*!40000 ALTER TABLE `timetable_entries` DISABLE KEYS */;
INSERT INTO `timetable_entries` VALUES (1,1,1,'mon',1,1,6,1),(2,2,1,'mon',2,1,14,1),(3,3,1,'mon',3,1,26,1),(4,4,1,'mon',4,1,37,1),(5,1,1,'tue',1,1,6,1),(6,2,1,'tue',2,1,14,1),(7,3,1,'tue',3,1,26,1),(8,4,1,'tue',4,1,37,1),(9,1,1,'wed',1,1,6,1),(10,2,1,'wed',2,1,14,1),(11,3,1,'wed',3,1,26,1),(12,4,1,'wed',4,1,37,1),(13,1,1,'thu',1,1,6,1),(14,2,1,'thu',2,1,14,1),(15,3,1,'thu',3,1,26,1),(16,4,1,'thu',4,1,37,1),(17,1,1,'fri',1,1,6,1),(18,2,1,'fri',2,1,14,1),(19,3,1,'fri',3,1,26,1),(20,4,1,'fri',4,1,37,1),(21,5,1,'mon',1,2,25,2),(22,6,1,'mon',2,2,33,2),(23,7,1,'mon',3,2,53,2),(24,8,1,'mon',4,2,82,2),(25,5,1,'tue',1,2,25,2),(26,6,1,'tue',2,2,33,2),(27,7,1,'tue',3,2,53,2),(28,8,1,'tue',4,2,82,2),(29,5,1,'wed',1,2,25,2),(30,6,1,'wed',2,2,33,2),(31,7,1,'wed',3,2,53,2),(32,8,1,'wed',4,2,82,2),(33,5,1,'thu',1,2,25,2),(34,6,1,'thu',2,2,33,2),(35,7,1,'thu',3,2,53,2),(36,8,1,'thu',4,2,82,2),(37,5,1,'fri',1,2,25,2),(38,6,1,'fri',2,2,33,2),(39,7,1,'fri',3,2,53,2),(40,8,1,'fri',4,2,82,2),(41,9,1,'mon',1,3,85,3),(42,10,1,'mon',2,3,85,3),(43,11,1,'mon',3,3,85,3),(44,12,1,'mon',4,3,85,3),(45,9,1,'tue',1,3,85,3),(46,10,1,'tue',2,3,85,3),(47,11,1,'tue',3,3,85,3),(48,12,1,'tue',4,3,85,3),(49,9,1,'wed',1,3,85,3),(50,10,1,'wed',2,3,85,3),(51,11,1,'wed',3,3,85,3),(52,12,1,'wed',4,3,85,3),(53,9,1,'thu',1,3,85,3),(54,10,1,'thu',2,3,85,3),(55,11,1,'thu',3,3,85,3),(56,12,1,'thu',4,3,85,3),(57,9,1,'fri',1,3,85,3),(58,10,1,'fri',2,3,85,3),(59,11,1,'fri',3,3,85,3),(60,12,1,'fri',4,3,85,3),(61,13,1,'mon',1,4,17,4),(62,14,1,'mon',2,4,23,4),(63,15,1,'mon',3,4,44,4),(64,16,1,'mon',4,4,45,4),(65,13,1,'tue',1,4,17,4),(66,14,1,'tue',2,4,23,4),(67,15,1,'tue',3,4,44,4),(68,16,1,'tue',4,4,45,4),(69,13,1,'wed',1,4,17,4),(70,14,1,'wed',2,4,23,4),(71,15,1,'wed',3,4,44,4),(72,16,1,'wed',4,4,45,4),(73,13,1,'thu',1,4,17,4),(74,14,1,'thu',2,4,23,4),(75,15,1,'thu',3,4,44,4),(76,16,1,'thu',4,4,45,4),(77,13,1,'fri',1,4,17,4),(78,14,1,'fri',2,4,23,4),(79,15,1,'fri',3,4,44,4),(80,16,1,'fri',4,4,45,4),(81,17,1,'mon',1,5,10,5),(82,18,1,'mon',2,5,15,5),(83,19,1,'mon',3,5,40,5),(84,20,1,'mon',4,5,52,5),(85,17,1,'tue',1,5,10,5),(86,18,1,'tue',2,5,15,5),(87,19,1,'tue',3,5,40,5),(88,20,1,'tue',4,5,52,5),(89,17,1,'wed',1,5,10,5),(90,18,1,'wed',2,5,15,5),(91,19,1,'wed',3,5,40,5),(92,20,1,'wed',4,5,52,5),(93,17,1,'thu',1,5,10,5),(94,18,1,'thu',2,5,15,5),(95,19,1,'thu',3,5,40,5),(96,20,1,'thu',4,5,52,5),(97,17,1,'fri',1,5,10,5),(98,18,1,'fri',2,5,15,5),(99,19,1,'fri',3,5,40,5),(100,20,1,'fri',4,5,52,5),(101,21,1,'mon',1,6,7,6),(102,22,1,'mon',2,6,30,6),(103,23,1,'mon',3,6,36,6),(104,24,1,'mon',4,6,38,6),(105,21,1,'tue',1,6,7,6),(106,22,1,'tue',2,6,30,6),(107,23,1,'tue',3,6,36,6),(108,24,1,'tue',4,6,38,6),(109,21,1,'wed',1,6,7,6),(110,22,1,'wed',2,6,30,6),(111,23,1,'wed',3,6,36,6),(112,24,1,'wed',4,6,38,6),(113,21,1,'thu',1,6,7,6),(114,22,1,'thu',2,6,30,6),(115,23,1,'thu',3,6,36,6),(116,24,1,'thu',4,6,38,6),(117,21,1,'fri',1,6,7,6),(118,22,1,'fri',2,6,30,6),(119,23,1,'fri',3,6,36,6),(120,24,1,'fri',4,6,38,6),(121,25,1,'mon',1,7,13,7),(122,26,1,'mon',2,7,32,7),(123,27,1,'mon',3,7,34,7),(124,28,1,'mon',4,7,35,7),(125,25,1,'tue',1,7,13,7),(126,26,1,'tue',2,7,32,7),(127,27,1,'tue',3,7,34,7),(128,28,1,'tue',4,7,35,7),(129,25,1,'wed',1,7,13,7),(130,26,1,'wed',2,7,32,7),(131,27,1,'wed',3,7,34,7),(132,28,1,'wed',4,7,35,7),(133,25,1,'thu',1,7,13,7),(134,26,1,'thu',2,7,32,7),(135,27,1,'thu',3,7,34,7),(136,28,1,'thu',4,7,35,7),(137,25,1,'fri',1,7,13,7),(138,26,1,'fri',2,7,32,7),(139,27,1,'fri',3,7,34,7),(140,28,1,'fri',4,7,35,7),(141,29,1,'mon',1,8,48,8),(142,30,1,'mon',2,8,49,8),(143,31,1,'mon',3,8,54,8),(144,32,1,'mon',4,8,73,8),(145,29,1,'tue',1,8,48,8),(146,30,1,'tue',2,8,49,8),(147,31,1,'tue',3,8,54,8),(148,32,1,'tue',4,8,73,8),(149,29,1,'wed',1,8,48,8),(150,30,1,'wed',2,8,49,8),(151,31,1,'wed',3,8,54,8),(152,32,1,'wed',4,8,73,8),(153,29,1,'thu',1,8,48,8),(154,30,1,'thu',2,8,49,8),(155,31,1,'thu',3,8,54,8),(156,32,1,'thu',4,8,73,8),(157,29,1,'fri',1,8,48,8),(158,30,1,'fri',2,8,49,8),(159,31,1,'fri',3,8,54,8),(160,32,1,'fri',4,8,73,8),(161,33,1,'mon',1,9,16,9),(162,34,1,'mon',2,9,29,9),(163,35,1,'mon',3,9,58,9),(164,36,1,'mon',4,9,58,9),(165,33,1,'tue',1,9,16,9),(166,34,1,'tue',2,9,29,9),(167,35,1,'tue',3,9,58,9),(168,36,1,'tue',4,9,58,9),(169,33,1,'wed',1,9,16,9),(170,34,1,'wed',2,9,29,9),(171,35,1,'wed',3,9,58,9),(172,36,1,'wed',4,9,58,9),(173,33,1,'thu',1,9,16,9),(174,34,1,'thu',2,9,29,9),(175,35,1,'thu',3,9,58,9),(176,36,1,'thu',4,9,58,9),(177,33,1,'fri',1,9,16,9),(178,34,1,'fri',2,9,29,9),(179,35,1,'fri',3,9,58,9),(180,36,1,'fri',4,9,58,9),(181,37,1,'mon',1,10,22,10),(182,38,1,'mon',2,10,31,10),(183,39,1,'mon',3,10,43,10),(184,40,1,'mon',4,10,61,10),(185,37,1,'tue',1,10,22,10),(186,38,1,'tue',2,10,31,10),(187,39,1,'tue',3,10,43,10),(188,40,1,'tue',4,10,61,10),(189,37,1,'wed',1,10,22,10),(190,38,1,'wed',2,10,31,10),(191,39,1,'wed',3,10,43,10),(192,40,1,'wed',4,10,61,10),(193,37,1,'thu',1,10,22,10),(194,38,1,'thu',2,10,31,10),(195,39,1,'thu',3,10,43,10),(196,40,1,'thu',4,10,61,10),(197,37,1,'fri',1,10,22,10),(198,38,1,'fri',2,10,31,10),(199,39,1,'fri',3,10,43,10),(200,40,1,'fri',4,10,61,10),(201,41,1,'mon',1,11,41,11),(202,42,1,'mon',2,11,72,11),(203,43,1,'mon',3,11,74,11),(204,44,1,'mon',4,11,81,11),(205,41,1,'tue',1,11,41,11),(206,42,1,'tue',2,11,72,11),(207,43,1,'tue',3,11,74,11),(208,44,1,'tue',4,11,81,11),(209,41,1,'wed',1,11,41,11),(210,42,1,'wed',2,11,72,11),(211,43,1,'wed',3,11,74,11),(212,44,1,'wed',4,11,81,11),(213,41,1,'thu',1,11,41,11),(214,42,1,'thu',2,11,72,11),(215,43,1,'thu',3,11,74,11),(216,44,1,'thu',4,11,81,11),(217,41,1,'fri',1,11,41,11),(218,42,1,'fri',2,11,72,11),(219,43,1,'fri',3,11,74,11),(220,44,1,'fri',4,11,81,11),(221,90,3,'mon',1,12,70,23),(222,89,3,'mon',2,12,17,23),(223,91,3,'mon',3,12,35,23),(224,92,3,'mon',4,12,77,23),(225,93,3,'mon',5,12,25,23),(226,94,3,'tue',1,12,58,23),(227,89,3,'tue',2,12,17,23),(228,95,3,'tue',3,12,49,23),(229,90,3,'tue',4,12,70,23),(230,91,3,'tue',5,12,35,23),(231,92,3,'wed',1,12,77,23),(232,93,3,'wed',2,12,25,23),(233,95,3,'wed',3,12,49,23),(234,89,3,'wed',4,12,17,23),(235,94,3,'wed',5,12,58,23),(236,90,3,'thu',1,12,70,23),(237,91,3,'thu',2,12,35,23),(238,92,3,'thu',3,12,77,23),(239,93,3,'thu',4,12,25,23),(240,94,3,'thu',5,12,58,23),(241,95,3,'fri',1,12,49,23),(242,89,3,'fri',2,12,17,23),(243,90,3,'fri',3,12,70,23),(244,92,3,'fri',4,12,77,23),(245,91,3,'fri',5,12,35,23),(246,96,3,'mon',1,13,23,24),(247,97,3,'mon',2,13,78,24),(248,99,3,'mon',3,13,77,24),(249,98,3,'mon',4,13,34,24),(250,100,3,'mon',5,13,33,24),(251,96,3,'tue',1,13,23,24),(252,101,3,'tue',2,13,58,24),(253,102,3,'tue',3,13,48,24),(254,97,3,'tue',4,13,78,24),(255,98,3,'tue',5,13,34,24),(256,100,3,'wed',1,13,33,24),(257,99,3,'wed',2,13,77,24),(258,102,3,'wed',3,13,48,24),(259,96,3,'wed',4,13,23,24),(260,97,3,'wed',5,13,78,24),(261,101,3,'thu',1,13,58,24),(262,98,3,'thu',2,13,34,24),(263,100,3,'thu',3,13,33,24),(264,99,3,'thu',4,13,77,24),(265,102,3,'thu',5,13,48,24),(266,101,3,'fri',1,13,58,24),(267,97,3,'fri',2,13,78,24),(268,96,3,'fri',3,13,23,24),(269,98,3,'fri',4,13,34,24),(270,99,3,'fri',5,13,77,24),(271,103,3,'mon',1,14,89,25),(272,106,3,'mon',2,14,68,25),(273,104,3,'mon',3,14,78,25),(274,105,3,'mon',4,14,32,25),(275,107,3,'mon',5,14,53,25),(276,108,3,'tue',1,14,29,25),(277,109,3,'tue',2,14,48,25),(278,103,3,'tue',3,14,89,25),(279,105,3,'tue',4,14,32,25),(280,104,3,'tue',5,14,78,25),(281,106,3,'wed',1,14,68,25),(282,107,3,'wed',2,14,53,25),(283,108,3,'wed',3,14,29,25),(284,109,3,'wed',4,14,48,25),(285,103,3,'wed',5,14,89,25),(286,104,3,'thu',1,14,78,25),(287,106,3,'thu',2,14,68,25),(288,105,3,'thu',3,14,32,25),(289,107,3,'thu',4,14,53,25),(290,108,3,'thu',5,14,29,25),(291,103,3,'fri',1,14,89,25),(292,109,3,'fri',2,14,48,25),(293,104,3,'fri',3,14,78,25),(294,105,3,'fri',4,14,32,25),(295,106,3,'fri',5,14,68,25),(296,113,3,'mon',1,15,67,26),(297,110,3,'mon',2,15,89,26),(298,111,3,'mon',3,15,70,26),(299,112,3,'mon',4,15,13,26),(300,114,3,'mon',5,15,82,26),(301,116,3,'tue',1,15,49,26),(302,115,3,'tue',2,15,16,26),(303,111,3,'tue',3,15,70,26),(304,110,3,'tue',4,15,89,26),(305,112,3,'tue',5,15,13,26),(306,113,3,'wed',1,15,67,26),(307,114,3,'wed',2,15,82,26),(308,115,3,'wed',3,15,16,26),(309,116,3,'wed',4,15,49,26),(310,111,3,'wed',5,15,70,26),(311,110,3,'thu',1,15,89,26),(312,112,3,'thu',2,15,13,26),(313,113,3,'thu',3,15,67,26),(314,115,3,'thu',4,15,16,26),(315,114,3,'thu',5,15,82,26),(316,111,3,'fri',1,15,70,26),(317,110,3,'fri',2,15,89,26),(318,116,3,'fri',3,15,49,26),(319,112,3,'fri',4,15,13,26),(320,113,3,'fri',5,15,67,26),(321,117,3,'mon',1,16,69,27),(322,118,3,'mon',2,16,60,27),(323,119,3,'mon',3,16,13,27),(324,120,3,'mon',4,16,55,27),(325,122,3,'mon',5,16,16,27),(326,121,3,'tue',1,16,82,27),(327,123,3,'tue',2,16,54,27),(328,117,3,'tue',3,16,69,27),(329,118,3,'tue',4,16,60,27),(330,120,3,'tue',5,16,55,27),(331,121,3,'wed',1,16,82,27),(332,119,3,'wed',2,16,13,27),(333,117,3,'wed',3,16,69,27),(334,122,3,'wed',4,16,16,27),(335,123,3,'wed',5,16,54,27),(336,118,3,'thu',1,16,60,27),(337,120,3,'thu',2,16,55,27),(338,119,3,'thu',3,16,13,27),(339,123,3,'thu',4,16,54,27),(340,122,3,'thu',5,16,16,27),(341,121,3,'fri',1,16,82,27),(342,117,3,'fri',2,16,69,27),(343,118,3,'fri',3,16,60,27),(344,120,3,'fri',4,16,55,27),(345,119,3,'fri',5,16,13,27),(346,125,3,'mon',1,17,66,28),(347,126,3,'mon',2,17,51,28),(348,127,3,'mon',3,17,39,28),(349,128,3,'mon',4,17,53,28),(350,124,3,'mon',5,17,85,28),(351,130,3,'tue',1,17,73,28),(352,125,3,'tue',2,17,66,28),(353,129,3,'tue',3,17,29,28),(354,126,3,'tue',4,17,51,28),(355,124,3,'tue',5,17,85,28),(356,127,3,'wed',1,17,39,28),(357,130,3,'wed',2,17,73,28),(358,125,3,'wed',3,17,66,28),(359,128,3,'wed',4,17,53,28),(360,129,3,'wed',5,17,29,28),(361,126,3,'thu',1,17,51,28),(362,127,3,'thu',2,17,39,28),(363,129,3,'thu',3,17,29,28),(364,125,3,'thu',4,17,66,28),(365,124,3,'thu',5,17,85,28),(366,128,3,'fri',1,17,53,28),(367,130,3,'fri',2,17,73,28),(368,126,3,'fri',3,17,51,28),(369,127,3,'fri',4,17,39,28),(370,124,3,'fri',5,17,85,28),(371,132,3,'mon',1,18,65,29),(372,133,3,'mon',2,18,47,29),(373,134,3,'mon',3,18,37,29),(374,135,3,'mon',4,18,33,29),(375,136,3,'mon',5,18,58,29),(376,137,3,'tue',1,18,83,29),(377,132,3,'tue',2,18,65,29),(378,133,3,'tue',3,18,47,29),(379,135,3,'tue',4,18,33,29),(380,134,3,'tue',5,18,37,29),(381,136,3,'wed',1,18,58,29),(382,137,3,'wed',2,18,83,29),(383,132,3,'wed',3,18,65,29),(384,133,3,'wed',4,18,47,29),(385,131,3,'wed',5,18,85,29),(386,134,3,'thu',1,18,37,29),(387,136,3,'thu',2,18,58,29),(388,137,3,'thu',3,18,83,29),(389,135,3,'thu',4,18,33,29),(390,132,3,'thu',5,18,65,29),(391,133,3,'fri',1,18,47,29),(392,134,3,'fri',2,18,37,29),(393,135,3,'fri',3,18,33,29),(394,137,3,'fri',4,18,83,29),(395,136,3,'fri',5,18,58,29),(396,139,3,'mon',1,19,64,30),(397,140,3,'mon',2,19,46,30),(398,142,3,'mon',3,19,25,30),(399,141,3,'mon',4,19,26,30),(400,144,3,'mon',5,19,83,30),(401,139,3,'tue',1,19,64,30),(402,140,3,'tue',2,19,46,30),(403,142,3,'tue',3,19,25,30),(404,141,3,'tue',4,19,26,30),(405,143,3,'tue',5,19,58,30),(406,144,3,'wed',1,19,83,30),(407,143,3,'wed',2,19,58,30),(408,139,3,'wed',3,19,64,30),(409,140,3,'wed',4,19,46,30),(410,141,3,'wed',5,19,26,30),(411,144,3,'thu',1,19,83,30),(412,142,3,'thu',2,19,25,30),(413,139,3,'thu',3,19,64,30),(414,140,3,'thu',4,19,46,30),(415,141,3,'thu',5,19,26,30),(416,144,3,'fri',1,19,83,30),(417,143,3,'fri',2,19,58,30),(418,142,3,'fri',3,19,25,30),(419,139,3,'fri',4,19,64,30),(420,140,3,'fri',5,19,46,30),(421,146,3,'mon',1,20,52,31),(422,147,3,'mon',2,20,38,31),(423,148,3,'mon',3,20,14,31),(424,149,3,'mon',4,20,25,31),(425,150,3,'mon',5,20,29,31),(426,146,3,'tue',1,20,52,31),(427,151,3,'tue',2,20,73,31),(428,147,3,'tue',3,20,38,31),(429,148,3,'tue',4,20,14,31),(430,149,3,'tue',5,20,25,31),(431,150,3,'wed',1,20,29,31),(432,146,3,'wed',2,20,52,31),(433,151,3,'wed',3,20,73,31),(434,148,3,'wed',4,20,14,31),(435,147,3,'wed',5,20,38,31),(436,150,3,'thu',1,20,29,31),(437,151,3,'thu',2,20,73,31),(438,149,3,'thu',3,20,25,31),(439,148,3,'thu',4,20,14,31),(440,146,3,'thu',5,20,52,31),(441,147,3,'fri',1,20,38,31),(442,149,3,'fri',2,20,25,31),(443,150,3,'fri',3,20,29,31),(444,148,3,'fri',4,20,14,31),(445,151,3,'fri',5,20,73,31),(446,153,3,'mon',1,25,40,32),(447,154,3,'mon',2,25,36,32),(448,155,3,'mon',3,25,6,32),(449,157,3,'mon',4,25,16,32),(450,158,3,'mon',5,25,54,32),(451,156,3,'tue',1,25,33,32),(452,153,3,'tue',2,25,40,32),(453,155,3,'tue',3,25,6,32),(454,154,3,'tue',4,25,36,32),(455,156,3,'tue',5,25,33,32),(456,158,3,'wed',1,25,54,32),(457,157,3,'wed',2,25,16,32),(458,155,3,'wed',3,25,6,32),(459,153,3,'wed',4,25,40,32),(460,154,3,'wed',5,25,36,32),(461,156,3,'thu',1,25,33,32),(462,157,3,'thu',2,25,16,32),(463,155,3,'thu',3,25,6,32),(464,153,3,'thu',4,25,40,32),(465,158,3,'thu',5,25,54,32),(466,154,3,'fri',1,25,36,32),(467,157,3,'fri',2,25,16,32),(468,155,3,'fri',3,25,6,32),(469,156,3,'fri',4,25,33,32),(470,158,3,'fri',5,25,54,32),(471,160,3,'mon',1,26,29,33),(472,159,3,'mon',2,26,16,33),(473,161,3,'mon',3,26,49,33),(474,162,3,'mon',4,26,6,33),(475,165,3,'mon',5,26,48,33),(476,163,3,'tue',1,26,53,33),(477,162,3,'tue',2,26,6,33),(478,159,3,'tue',3,26,16,33),(479,160,3,'tue',4,26,29,33),(480,161,3,'tue',5,26,49,33),(481,163,3,'wed',1,26,53,33),(482,165,3,'wed',2,26,48,33),(483,160,3,'wed',4,26,29,33),(484,159,3,'wed',5,26,16,33),(485,161,3,'thu',1,26,49,33),(486,162,3,'thu',2,26,6,33),(487,165,3,'thu',3,26,48,33),(488,160,3,'thu',4,26,29,33),(489,163,3,'thu',5,26,53,33),(490,160,3,'fri',1,26,29,33),(491,162,3,'fri',2,26,6,33),(492,159,3,'fri',3,26,16,33),(493,161,3,'fri',4,26,49,33),(494,163,3,'fri',5,26,53,33),(495,45,2,'mon',8,1,39,12),(496,46,2,'mon',9,1,55,12),(497,47,2,'mon',10,1,67,12),(498,48,2,'mon',11,1,68,12),(499,45,2,'tue',8,1,39,12),(500,46,2,'tue',9,1,55,12),(501,47,2,'tue',10,1,67,12),(502,48,2,'tue',11,1,68,12),(503,45,2,'wed',8,1,39,12),(504,46,2,'wed',9,1,55,12),(505,47,2,'wed',10,1,67,12),(506,48,2,'wed',11,1,68,12),(507,45,2,'thu',8,1,39,12),(508,46,2,'thu',9,1,55,12),(509,47,2,'thu',10,1,67,12),(510,48,2,'thu',11,1,68,12),(511,45,2,'fri',8,1,39,12),(512,46,2,'fri',9,1,55,12),(513,47,2,'fri',10,1,67,12),(514,48,2,'fri',11,1,68,12),(515,49,2,'mon',8,2,82,13),(516,50,2,'mon',9,2,53,13),(517,51,2,'mon',10,2,33,13),(518,52,2,'mon',11,2,25,13),(519,49,2,'tue',8,2,82,13),(520,50,2,'tue',9,2,53,13),(521,51,2,'tue',10,2,33,13),(522,52,2,'tue',11,2,25,13),(523,49,2,'wed',8,2,82,13),(524,50,2,'wed',9,2,53,13),(525,51,2,'wed',10,2,33,13),(526,52,2,'wed',11,2,25,13),(527,49,2,'thu',8,2,82,13),(528,50,2,'thu',9,2,53,13),(529,51,2,'thu',10,2,33,13),(530,52,2,'thu',11,2,25,13),(531,49,2,'fri',8,2,82,13),(532,50,2,'fri',9,2,53,13),(533,51,2,'fri',10,2,33,13),(534,52,2,'fri',11,2,25,13),(535,53,2,'mon',8,3,85,14),(536,54,2,'mon',9,3,85,14),(537,55,2,'mon',10,3,85,14),(538,56,2,'mon',11,3,85,14),(539,53,2,'tue',8,3,85,14),(540,54,2,'tue',9,3,85,14),(541,55,2,'tue',10,3,85,14),(542,56,2,'tue',11,3,85,14),(543,53,2,'wed',8,3,85,14),(544,54,2,'wed',9,3,85,14),(545,55,2,'wed',10,3,85,14),(546,56,2,'wed',11,3,85,14),(547,53,2,'thu',8,3,85,14),(548,54,2,'thu',9,3,85,14),(549,55,2,'thu',10,3,85,14),(550,56,2,'thu',11,3,85,14),(551,53,2,'fri',8,3,85,14),(552,54,2,'fri',9,3,85,14),(553,55,2,'fri',10,3,85,14),(554,56,2,'fri',11,3,85,14),(555,57,2,'mon',8,4,45,15),(556,58,2,'mon',9,4,44,15),(557,59,2,'mon',10,4,23,15),(558,60,2,'mon',11,4,17,15),(559,57,2,'tue',8,4,45,15),(560,58,2,'tue',9,4,44,15),(561,59,2,'tue',10,4,23,15),(562,60,2,'tue',11,4,17,15),(563,57,2,'wed',8,4,45,15),(564,58,2,'wed',9,4,44,15),(565,59,2,'wed',10,4,23,15),(566,60,2,'wed',11,4,17,15),(567,57,2,'thu',8,4,45,15),(568,58,2,'thu',9,4,44,15),(569,59,2,'thu',10,4,23,15),(570,60,2,'thu',11,4,17,15),(571,57,2,'fri',8,4,45,15),(572,58,2,'fri',9,4,44,15),(573,59,2,'fri',10,4,23,15),(574,60,2,'fri',11,4,17,15),(575,61,2,'mon',8,5,64,16),(576,62,2,'mon',9,5,65,16),(577,63,2,'mon',10,5,66,16),(578,64,2,'mon',11,5,69,16),(579,61,2,'tue',8,5,64,16),(580,62,2,'tue',9,5,65,16),(581,63,2,'tue',10,5,66,16),(582,64,2,'tue',11,5,69,16),(583,61,2,'wed',8,5,64,16),(584,62,2,'wed',9,5,65,16),(585,63,2,'wed',10,5,66,16),(586,64,2,'wed',11,5,69,16),(587,61,2,'thu',8,5,64,16),(588,62,2,'thu',9,5,65,16),(589,63,2,'thu',10,5,66,16),(590,64,2,'thu',11,5,69,16),(591,61,2,'fri',8,5,64,16),(592,62,2,'fri',9,5,65,16),(593,63,2,'fri',10,5,66,16),(594,64,2,'fri',11,5,69,16),(595,65,2,'mon',8,6,46,17),(596,66,2,'mon',9,6,47,17),(597,67,2,'mon',10,6,51,17),(598,68,2,'mon',11,6,60,17),(599,65,2,'tue',8,6,46,17),(600,66,2,'tue',9,6,47,17),(601,67,2,'tue',10,6,51,17),(602,68,2,'tue',11,6,60,17),(603,65,2,'wed',8,6,46,17),(604,66,2,'wed',9,6,47,17),(605,67,2,'wed',10,6,51,17),(606,68,2,'wed',11,6,60,17),(607,65,2,'thu',8,6,46,17),(608,66,2,'thu',9,6,47,17),(609,67,2,'thu',10,6,51,17),(610,68,2,'thu',11,6,60,17),(611,65,2,'fri',8,6,46,17),(612,66,2,'fri',9,6,47,17),(613,67,2,'fri',10,6,51,17),(614,68,2,'fri',11,6,60,17),(615,69,2,'mon',8,7,63,18),(616,70,2,'mon',9,7,79,18),(617,71,2,'mon',10,7,79,18),(618,72,2,'mon',11,7,63,18),(619,69,2,'tue',8,7,63,18),(620,70,2,'tue',9,7,79,18),(621,71,2,'tue',10,7,79,18),(622,72,2,'tue',11,7,63,18),(623,69,2,'wed',8,7,63,18),(624,70,2,'wed',9,7,79,18),(625,71,2,'wed',10,7,79,18),(626,72,2,'wed',11,7,63,18),(627,69,2,'thu',8,7,63,18),(628,70,2,'thu',9,7,79,18),(629,71,2,'thu',10,7,79,18),(630,72,2,'thu',11,7,63,18),(631,69,2,'fri',8,7,63,18),(632,70,2,'fri',9,7,79,18),(633,71,2,'fri',10,7,79,18),(634,72,2,'fri',11,7,63,18),(635,73,2,'mon',8,8,83,19),(636,74,2,'mon',9,8,83,19),(637,75,2,'mon',10,8,73,19),(638,76,2,'mon',11,8,54,19),(639,73,2,'tue',8,8,83,19),(640,74,2,'tue',9,8,83,19),(641,75,2,'tue',10,8,73,19),(642,76,2,'tue',11,8,54,19),(643,73,2,'wed',8,8,83,19),(644,74,2,'wed',9,8,83,19),(645,75,2,'wed',10,8,73,19),(646,76,2,'wed',11,8,54,19),(647,73,2,'thu',8,8,83,19),(648,74,2,'thu',9,8,83,19),(649,75,2,'thu',10,8,73,19),(650,76,2,'thu',11,8,54,19),(651,73,2,'fri',8,8,83,19),(652,74,2,'fri',9,8,83,19),(653,75,2,'fri',10,8,73,19),(654,76,2,'fri',11,8,54,19),(655,77,2,'mon',8,9,29,20),(656,78,2,'mon',9,9,16,20),(657,79,2,'mon',10,9,16,20),(658,80,2,'mon',11,9,29,20),(659,77,2,'tue',8,9,29,20),(660,78,2,'tue',9,9,16,20),(661,79,2,'tue',10,9,16,20),(662,80,2,'tue',11,9,29,20),(663,77,2,'wed',8,9,29,20),(664,78,2,'wed',9,9,16,20),(665,79,2,'wed',10,9,16,20),(666,80,2,'wed',11,9,29,20),(667,77,2,'thu',8,9,29,20),(668,78,2,'thu',9,9,16,20),(669,79,2,'thu',10,9,16,20),(670,80,2,'thu',11,9,29,20),(671,77,2,'fri',8,9,29,20),(672,78,2,'fri',9,9,16,20),(673,79,2,'fri',10,9,16,20),(674,80,2,'fri',11,9,29,20),(675,81,2,'mon',8,10,62,21),(676,82,2,'mon',9,10,76,21),(677,83,2,'mon',10,10,88,21),(678,84,2,'mon',11,10,88,21),(679,81,2,'tue',8,10,62,21),(680,82,2,'tue',9,10,76,21),(681,83,2,'tue',10,10,88,21),(682,84,2,'tue',11,10,88,21),(683,81,2,'wed',8,10,62,21),(684,82,2,'wed',9,10,76,21),(685,83,2,'wed',10,10,88,21),(686,84,2,'wed',11,10,88,21),(687,81,2,'thu',8,10,62,21),(688,82,2,'thu',9,10,76,21),(689,83,2,'thu',10,10,88,21),(690,84,2,'thu',11,10,88,21),(691,81,2,'fri',8,10,62,21),(692,82,2,'fri',9,10,76,21),(693,83,2,'fri',10,10,88,21),(694,84,2,'fri',11,10,88,21),(695,85,2,'mon',8,11,81,22),(696,86,2,'mon',9,11,74,22),(697,87,2,'mon',10,11,72,22),(698,88,2,'mon',11,11,41,22),(699,85,2,'tue',8,11,81,22),(700,86,2,'tue',9,11,74,22),(701,87,2,'tue',10,11,72,22),(702,88,2,'tue',11,11,41,22),(703,85,2,'wed',8,11,81,22),(704,86,2,'wed',9,11,74,22),(705,87,2,'wed',10,11,72,22),(706,88,2,'wed',11,11,41,22),(707,85,2,'thu',8,11,81,22),(708,86,2,'thu',9,11,74,22),(709,87,2,'thu',10,11,72,22),(710,88,2,'thu',11,11,41,22),(711,85,2,'fri',8,11,81,22),(712,86,2,'fri',9,11,74,22),(713,87,2,'fri',10,11,72,22),(714,88,2,'fri',11,11,41,22),(715,166,4,'mon',8,12,44,34),(716,167,4,'mon',9,12,30,34),(717,168,4,'mon',10,12,32,34),(718,169,4,'mon',11,12,14,34),(719,170,4,'mon',12,12,82,34),(720,171,4,'tue',8,12,48,34),(721,172,4,'tue',9,12,49,34),(722,166,4,'tue',10,12,44,34),(723,167,4,'tue',11,12,30,34),(724,168,4,'tue',12,12,32,34),(725,169,4,'wed',8,12,14,34),(726,170,4,'wed',9,12,82,34),(727,171,4,'wed',10,12,48,34),(728,172,4,'wed',11,12,49,34),(729,166,4,'wed',12,12,44,34),(730,167,4,'thu',8,12,30,34),(731,168,4,'thu',9,12,32,34),(732,169,4,'thu',10,12,14,34),(733,170,4,'thu',11,12,82,34),(734,171,4,'thu',12,12,48,34),(735,172,4,'fri',8,12,49,34),(736,167,4,'fri',9,12,30,34),(737,166,4,'fri',10,12,44,34),(738,168,4,'fri',11,12,32,34),(739,169,4,'fri',12,12,14,34),(740,174,4,'mon',8,13,7,35),(741,173,4,'mon',9,13,45,35),(742,175,4,'mon',10,13,34,35),(743,176,4,'mon',11,13,26,35),(744,178,4,'mon',12,13,54,35),(745,179,4,'tue',8,13,73,35),(746,177,4,'tue',9,13,82,35),(747,173,4,'tue',10,13,45,35),(748,174,4,'tue',11,13,7,35),(749,175,4,'tue',12,13,34,35),(750,176,4,'wed',8,13,26,35),(751,178,4,'wed',9,13,54,35),(752,177,4,'wed',10,13,82,35),(753,179,4,'wed',11,13,73,35),(754,173,4,'wed',12,13,45,35),(755,174,4,'thu',8,13,7,35),(756,175,4,'thu',9,13,34,35),(757,176,4,'thu',10,13,26,35),(758,179,4,'thu',11,13,73,35),(759,177,4,'thu',12,13,82,35),(760,178,4,'fri',8,13,54,35),(761,173,4,'fri',9,13,45,35),(762,174,4,'fri',10,13,7,35),(763,175,4,'fri',11,13,34,35),(764,176,4,'fri',12,13,26,35),(765,180,4,'mon',8,14,15,36),(766,181,4,'mon',9,14,7,36),(767,182,4,'mon',10,14,35,36),(768,183,4,'mon',11,14,37,36),(769,184,4,'mon',12,14,53,36),(770,180,4,'tue',8,14,15,36),(771,181,4,'tue',9,14,7,36),(772,185,4,'tue',10,14,83,36),(773,186,4,'tue',11,14,83,36),(774,182,4,'tue',12,14,35,36),(775,183,4,'wed',8,14,37,36),(776,180,4,'wed',9,14,15,36),(777,184,4,'wed',10,14,53,36),(778,185,4,'wed',11,14,83,36),(779,186,4,'wed',12,14,83,36),(780,182,4,'thu',8,14,35,36),(781,181,4,'thu',9,14,7,36),(782,183,4,'thu',10,14,37,36),(783,184,4,'thu',11,14,53,36),(784,185,4,'thu',12,14,83,36),(785,180,4,'fri',8,14,15,36),(786,181,4,'fri',9,14,7,36),(787,186,4,'fri',10,14,83,36),(788,182,4,'fri',11,14,35,36),(789,183,4,'fri',12,14,37,36),(790,187,4,'mon',8,15,10,37),(791,189,4,'mon',9,15,63,37),(792,188,4,'mon',10,15,30,37),(793,190,4,'mon',11,15,39,37),(794,191,4,'mon',12,15,33,37),(795,193,4,'tue',8,15,54,37),(796,192,4,'tue',9,15,73,37),(797,187,4,'tue',10,15,10,37),(798,190,4,'tue',11,15,39,37),(799,188,4,'tue',12,15,30,37),(800,191,4,'wed',8,15,33,37),(801,189,4,'wed',9,15,63,37),(802,193,4,'wed',10,15,54,37),(803,187,4,'wed',11,15,10,37),(804,192,4,'wed',12,15,73,37),(805,191,4,'thu',8,15,33,37),(806,188,4,'thu',9,15,30,37),(807,189,4,'thu',10,15,63,37),(808,190,4,'thu',11,15,39,37),(809,192,4,'thu',12,15,73,37),(810,187,4,'fri',8,15,10,37),(811,193,4,'fri',9,15,54,37),(812,188,4,'fri',10,15,30,37),(813,190,4,'fri',11,15,39,37),(814,189,4,'fri',12,15,63,37),(815,195,4,'mon',8,16,36,38),(816,194,4,'mon',9,16,10,38),(817,197,4,'mon',10,16,55,38),(818,196,4,'mon',11,16,79,38),(819,198,4,'mon',12,16,25,38),(820,199,4,'tue',8,16,49,38),(821,200,4,'tue',9,16,48,38),(822,195,4,'tue',10,16,36,38),(823,194,4,'tue',11,16,10,38),(824,196,4,'tue',12,16,79,38),(825,197,4,'wed',8,16,55,38),(826,198,4,'wed',9,16,25,38),(827,199,4,'wed',10,16,49,38),(828,200,4,'wed',11,16,48,38),(829,194,4,'wed',12,16,10,38),(830,195,4,'thu',8,16,36,38),(831,198,4,'thu',9,16,25,38),(832,197,4,'thu',10,16,55,38),(833,196,4,'thu',11,16,79,38),(834,199,4,'thu',12,16,49,38),(835,200,4,'fri',8,16,48,38),(836,194,4,'fri',9,16,10,38),(837,195,4,'fri',10,16,36,38),(838,196,4,'fri',11,16,79,38),(839,197,4,'fri',12,16,55,38),(840,203,4,'mon',8,17,38,39),(841,202,4,'mon',9,17,15,39),(842,205,4,'mon',10,17,25,39),(843,204,4,'mon',11,17,67,39),(844,201,4,'mon',12,17,85,39),(845,203,4,'tue',8,17,38,39),(846,202,4,'tue',9,17,15,39),(847,206,4,'tue',10,17,48,39),(848,207,4,'tue',11,17,49,39),(849,201,4,'tue',12,17,85,39),(850,204,4,'wed',8,17,67,39),(851,206,4,'wed',9,17,48,39),(852,205,4,'wed',10,17,25,39),(853,202,4,'wed',11,17,15,39),(854,207,4,'wed',12,17,49,39),(855,203,4,'thu',8,17,38,39),(856,204,4,'thu',9,17,67,39),(857,205,4,'thu',10,17,25,39),(858,206,4,'thu',11,17,48,39),(859,201,4,'thu',12,17,85,39),(860,203,4,'fri',8,17,38,39),(861,207,4,'fri',9,17,49,39),(862,202,4,'fri',10,17,15,39),(863,204,4,'fri',11,17,67,39),(864,201,4,'fri',12,17,85,39),(865,209,4,'mon',8,18,40,40),(866,210,4,'mon',9,18,46,40),(867,211,4,'mon',10,18,68,40),(868,212,4,'mon',11,18,33,40),(869,214,4,'mon',12,18,73,40),(870,209,4,'tue',8,18,40,40),(871,213,4,'tue',9,18,54,40),(872,210,4,'tue',10,18,46,40),(873,212,4,'tue',11,18,33,40),(874,211,4,'tue',12,18,68,40),(875,213,4,'wed',8,18,54,40),(876,214,4,'wed',9,18,73,40),(877,209,4,'wed',10,18,40,40),(878,210,4,'wed',11,18,46,40),(879,208,4,'wed',12,18,85,40),(880,211,4,'thu',8,18,68,40),(881,212,4,'thu',9,18,33,40),(882,213,4,'thu',10,18,54,40),(883,209,4,'thu',11,18,40,40),(884,210,4,'thu',12,18,46,40),(885,214,4,'fri',8,18,73,40),(886,211,4,'fri',9,18,68,40),(887,213,4,'fri',10,18,54,40),(888,212,4,'fri',11,18,33,40),(889,214,4,'fri',12,18,73,40),(890,216,4,'mon',8,19,52,41),(891,218,4,'mon',9,19,77,41),(892,217,4,'mon',10,19,47,41),(893,219,4,'mon',11,19,53,41),(894,220,4,'mon',12,19,83,41),(895,216,4,'tue',8,19,52,41),(896,218,4,'tue',9,19,77,41),(897,217,4,'tue',10,19,47,41),(898,219,4,'tue',11,19,53,41),(899,221,4,'tue',12,19,83,41),(900,216,4,'wed',8,19,52,41),(901,218,4,'wed',9,19,77,41),(902,220,4,'wed',10,19,83,41),(903,217,4,'wed',11,19,47,41),(904,219,4,'wed',12,19,53,41),(905,216,4,'thu',8,19,52,41),(906,218,4,'thu',9,19,77,41),(907,221,4,'thu',10,19,83,41),(908,220,4,'thu',11,19,83,41),(909,217,4,'thu',12,19,47,41),(910,219,4,'fri',8,19,53,41),(911,216,4,'fri',9,19,52,41),(912,217,4,'fri',10,19,47,41),(913,221,4,'fri',11,19,83,41),(914,220,4,'fri',12,19,83,41),(915,224,4,'mon',8,20,51,42),(916,223,4,'mon',9,20,64,42),(917,225,4,'mon',10,20,77,42),(918,226,4,'mon',11,20,82,42),(919,223,4,'mon',12,20,64,42),(920,224,4,'tue',8,20,51,42),(921,223,4,'tue',9,20,64,42),(922,228,4,'tue',10,20,54,42),(923,227,4,'tue',11,20,73,42),(924,225,4,'tue',12,20,77,42),(925,227,4,'wed',8,20,73,42),(926,224,4,'wed',9,20,51,42),(927,225,4,'wed',10,20,77,42),(928,226,4,'wed',11,20,82,42),(929,228,4,'wed',12,20,54,42),(930,227,4,'thu',8,20,73,42),(931,226,4,'thu',9,20,82,42),(932,223,4,'thu',10,20,64,42),(933,224,4,'thu',11,20,51,42),(934,228,4,'thu',12,20,54,42),(935,225,4,'fri',8,20,77,42),(936,226,4,'fri',9,20,82,42),(937,223,4,'fri',10,20,64,42),(938,227,4,'fri',11,20,73,42),(939,228,4,'fri',12,20,54,42),(940,230,4,'mon',8,25,65,43),(941,231,4,'mon',9,25,60,43),(942,233,4,'mon',10,25,82,43),(943,234,4,'mon',11,25,49,43),(944,232,4,'mon',12,25,68,43),(945,230,4,'tue',8,25,65,43),(946,231,4,'tue',9,25,60,43),(947,232,4,'tue',10,25,68,43),(948,235,4,'tue',11,25,48,43),(949,233,4,'tue',12,25,82,43),(950,234,4,'wed',8,25,49,43),(951,231,4,'wed',9,25,60,43),(952,230,4,'wed',10,25,65,43),(953,230,4,'wed',11,25,65,43),(954,235,4,'wed',12,25,48,43),(955,234,4,'thu',8,25,49,43),(956,232,4,'thu',9,25,68,43),(957,233,4,'thu',10,25,82,43),(958,234,4,'thu',11,25,49,43),(959,231,4,'thu',12,25,60,43),(960,232,4,'fri',8,25,68,43),(961,235,4,'fri',9,25,48,43),(962,233,4,'fri',10,25,82,43),(963,235,4,'fri',11,25,48,43),(964,230,4,'fri',12,25,65,43),(965,236,4,'mon',8,26,58,44),(966,237,4,'mon',9,26,29,44),(967,238,4,'mon',10,26,48,44),(968,236,4,'mon',11,26,58,44),(969,239,4,'mon',12,26,67,44),(970,240,4,'tue',8,26,53,44),(971,237,4,'tue',9,26,29,44),(972,241,4,'tue',10,26,49,44),(973,239,4,'tue',11,26,67,44),(974,242,4,'tue',12,26,54,44),(975,238,4,'wed',8,26,48,44),(976,241,4,'wed',9,26,49,44),(977,236,4,'wed',10,26,58,44),(978,240,4,'wed',11,26,53,44),(979,237,4,'wed',12,26,29,44),(980,242,4,'thu',8,26,54,44),(981,238,4,'thu',9,26,48,44),(982,240,4,'thu',10,26,53,44),(983,239,4,'thu',11,26,67,44),(984,236,4,'thu',12,26,58,44),(985,239,4,'fri',8,26,67,44),(986,237,4,'fri',9,26,29,44),(987,241,4,'fri',10,26,49,44),(988,240,4,'fri',11,26,53,44),(989,238,4,'fri',12,26,48,44);
/*!40000 ALTER TABLE `timetable_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_has_permissions`
--

DROP TABLE IF EXISTS `user_has_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_has_permissions` (
  `user_id` bigint NOT NULL,
  `permission_id` int NOT NULL,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`,`permission_id`),
  KEY `user_has_permissions_permission_id_fkey` (`permission_id`),
  CONSTRAINT `user_has_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_has_permissions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_has_permissions`
-- Dumping data for table `user_has_permissions`
--

LOCK TABLES `user_has_permissions` WRITE;
/*!40000 ALTER TABLE `user_has_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_has_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_id` bigint NOT NULL,
  `role_id` int NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `user_roles_role_id_fkey` (`role_id`),
  CONSTRAINT `user_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,1),(2,2),(3,3),(4,7),(5,8),(6,5),(7,6),(8,9),(101,5),(102,5),(103,5),(104,5),(105,5),(106,5),(107,5),(108,5),(109,5),(110,5),(111,5),(112,5),(113,5),(114,5),(115,5),(116,5),(117,5),(118,5),(119,5),(120,5),(121,5),(122,5),(123,5),(124,5),(125,5),(126,5),(127,5),(128,5),(129,5),(130,5),(131,5),(132,5),(133,5),(134,5),(135,5),(136,5),(137,5),(138,5),(139,5),(140,5),(141,5),(142,5),(143,5),(144,5),(145,5),(146,5),(147,5),(148,5),(149,5),(150,5),(151,5),(152,5),(153,5),(154,5),(155,5),(156,5),(157,5),(158,5),(159,5),(160,5),(161,5),(162,5),(163,5),(164,5),(165,5),(166,5),(167,5),(168,5),(169,5),(170,5),(171,5),(172,5),(173,5),(174,5),(175,5),(176,5),(177,5),(178,5),(179,5),(180,5),(181,5),(182,5),(183,5),(184,5),(185,5),(186,5),(187,5),(188,5),(189,5),(190,5),(201,6),(202,6),(203,6),(204,6),(205,6),(206,6),(207,6),(208,6),(209,6),(210,6),(211,6),(212,6),(213,6),(214,6),(215,6),(216,6),(217,6),(218,6),(219,6),(220,6);
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cnic` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar_path` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `must_change_password` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  UNIQUE KEY `users_cnic_key` (`cnic`)
) ENGINE=InnoDB AUTO_INCREMENT=3263 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'System Administrator','admin@ggcm.com','0300-0000001','32302-0000001-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(2,'College Principal','principal@ggcm.com','0300-0000002','32302-0000002-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(3,'Admission Clerk','clerk@ggcm.com','0300-0000003','32302-0000003-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(4,'College Librarian','librarian@ggcm.com','0300-0000004','32302-0000004-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(5,'Timetable Controller','timetable@ggcm.com','0300-0000005','32302-0000005-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(6,'Demo Teacher','teacher@ggcm.com','0300-0000006','32302-0000006-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(7,'Demo Student','student@ggcm.com','0300-0000007','32302-0000007-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(8,'Demo Applicant','applicant@ggcm.com','0300-0000008','32302-0000008-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(101,'Faculty Member 1','faculty1@ggcm.com','0300-1000001','32302-1000001-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(102,'Faculty Member 2','faculty2@ggcm.com','0300-1000002','32302-1000002-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(103,'Faculty Member 3','faculty3@ggcm.com','0300-1000003','32302-1000003-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(104,'Faculty Member 4','faculty4@ggcm.com','0300-1000004','32302-1000004-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(105,'Faculty Member 5','faculty5@ggcm.com','0300-1000005','32302-1000005-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(106,'Faculty Member 6','faculty6@ggcm.com','0300-1000006','32302-1000006-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(107,'Faculty Member 7','faculty7@ggcm.com','0300-1000007','32302-1000007-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(108,'Faculty Member 8','faculty8@ggcm.com','0300-1000008','32302-1000008-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(109,'Faculty Member 9','faculty9@ggcm.com','0300-1000009','32302-1000009-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(110,'Faculty Member 10','faculty10@ggcm.com','0300-1000010','32302-1000010-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(111,'Faculty Member 11','faculty11@ggcm.com','0300-1000011','32302-1000011-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(112,'Faculty Member 12','faculty12@ggcm.com','0300-1000012','32302-1000012-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(113,'Faculty Member 13','faculty13@ggcm.com','0300-1000013','32302-1000013-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(114,'Faculty Member 14','faculty14@ggcm.com','0300-1000014','32302-1000014-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(115,'Faculty Member 15','faculty15@ggcm.com','0300-1000015','32302-1000015-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(116,'Faculty Member 16','faculty16@ggcm.com','0300-1000016','32302-1000016-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(117,'Faculty Member 17','faculty17@ggcm.com','0300-1000017','32302-1000017-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(118,'Faculty Member 18','faculty18@ggcm.com','0300-1000018','32302-1000018-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(119,'Faculty Member 19','faculty19@ggcm.com','0300-1000019','32302-1000019-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(120,'Faculty Member 20','faculty20@ggcm.com','0300-1000020','32302-1000020-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(121,'Faculty Member 21','faculty21@ggcm.com','0300-1000021','32302-1000021-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(122,'Faculty Member 22','faculty22@ggcm.com','0300-1000022','32302-1000022-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(123,'Faculty Member 23','faculty23@ggcm.com','0300-1000023','32302-1000023-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(124,'Faculty Member 24','faculty24@ggcm.com','0300-1000024','32302-1000024-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(125,'Faculty Member 25','faculty25@ggcm.com','0300-1000025','32302-1000025-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(126,'Faculty Member 26','faculty26@ggcm.com','0300-1000026','32302-1000026-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(127,'Faculty Member 27','faculty27@ggcm.com','0300-1000027','32302-1000027-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(128,'Faculty Member 28','faculty28@ggcm.com','0300-1000028','32302-1000028-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(129,'Faculty Member 29','faculty29@ggcm.com','0300-1000029','32302-1000029-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(130,'Faculty Member 30','faculty30@ggcm.com','0300-1000030','32302-1000030-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(131,'Faculty Member 31','faculty31@ggcm.com','0300-1000031','32302-1000031-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(132,'Faculty Member 32','faculty32@ggcm.com','0300-1000032','32302-1000032-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(133,'Faculty Member 33','faculty33@ggcm.com','0300-1000033','32302-1000033-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(134,'Faculty Member 34','faculty34@ggcm.com','0300-1000034','32302-1000034-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(135,'Faculty Member 35','faculty35@ggcm.com','0300-1000035','32302-1000035-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(136,'Faculty Member 36','faculty36@ggcm.com','0300-1000036','32302-1000036-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(137,'Faculty Member 37','faculty37@ggcm.com','0300-1000037','32302-1000037-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(138,'Faculty Member 38','faculty38@ggcm.com','0300-1000038','32302-1000038-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(139,'Faculty Member 39','faculty39@ggcm.com','0300-1000039','32302-1000039-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(140,'Faculty Member 40','faculty40@ggcm.com','0300-1000040','32302-1000040-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(141,'Faculty Member 41','faculty41@ggcm.com','0300-1000041','32302-1000041-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(142,'Faculty Member 42','faculty42@ggcm.com','0300-1000042','32302-1000042-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(143,'Faculty Member 43','faculty43@ggcm.com','0300-1000043','32302-1000043-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(144,'Faculty Member 44','faculty44@ggcm.com','0300-1000044','32302-1000044-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(145,'Faculty Member 45','faculty45@ggcm.com','0300-1000045','32302-1000045-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(146,'Faculty Member 46','faculty46@ggcm.com','0300-1000046','32302-1000046-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(147,'Faculty Member 47','faculty47@ggcm.com','0300-1000047','32302-1000047-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(148,'Faculty Member 48','faculty48@ggcm.com','0300-1000048','32302-1000048-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(149,'Faculty Member 49','faculty49@ggcm.com','0300-1000049','32302-1000049-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(150,'Faculty Member 50','faculty50@ggcm.com','0300-1000050','32302-1000050-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(151,'Faculty Member 51','faculty51@ggcm.com','0300-1000051','32302-1000051-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(152,'Faculty Member 52','faculty52@ggcm.com','0300-1000052','32302-1000052-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(153,'Faculty Member 53','faculty53@ggcm.com','0300-1000053','32302-1000053-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(154,'Faculty Member 54','faculty54@ggcm.com','0300-1000054','32302-1000054-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(155,'Faculty Member 55','faculty55@ggcm.com','0300-1000055','32302-1000055-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(156,'Faculty Member 56','faculty56@ggcm.com','0300-1000056','32302-1000056-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(157,'Faculty Member 57','faculty57@ggcm.com','0300-1000057','32302-1000057-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(158,'Faculty Member 58','faculty58@ggcm.com','0300-1000058','32302-1000058-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(159,'Faculty Member 59','faculty59@ggcm.com','0300-1000059','32302-1000059-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(160,'Faculty Member 60','faculty60@ggcm.com','0300-1000060','32302-1000060-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(161,'Faculty Member 61','faculty61@ggcm.com','0300-1000061','32302-1000061-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(162,'Faculty Member 62','faculty62@ggcm.com','0300-1000062','32302-1000062-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(163,'Faculty Member 63','faculty63@ggcm.com','0300-1000063','32302-1000063-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(164,'Faculty Member 64','faculty64@ggcm.com','0300-1000064','32302-1000064-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(165,'Faculty Member 65','faculty65@ggcm.com','0300-1000065','32302-1000065-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(166,'Faculty Member 66','faculty66@ggcm.com','0300-1000066','32302-1000066-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(167,'Faculty Member 67','faculty67@ggcm.com','0300-1000067','32302-1000067-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(168,'Faculty Member 68','faculty68@ggcm.com','0300-1000068','32302-1000068-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(169,'Faculty Member 69','faculty69@ggcm.com','0300-1000069','32302-1000069-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(170,'Faculty Member 70','faculty70@ggcm.com','0300-1000070','32302-1000070-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(171,'Faculty Member 71','faculty71@ggcm.com','0300-1000071','32302-1000071-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(172,'Faculty Member 72','faculty72@ggcm.com','0300-1000072','32302-1000072-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(173,'Faculty Member 73','faculty73@ggcm.com','0300-1000073','32302-1000073-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(174,'Faculty Member 74','faculty74@ggcm.com','0300-1000074','32302-1000074-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(175,'Faculty Member 75','faculty75@ggcm.com','0300-1000075','32302-1000075-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(176,'Faculty Member 76','faculty76@ggcm.com','0300-1000076','32302-1000076-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(177,'Faculty Member 77','faculty77@ggcm.com','0300-1000077','32302-1000077-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(178,'Faculty Member 78','faculty78@ggcm.com','0300-1000078','32302-1000078-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(179,'Faculty Member 79','faculty79@ggcm.com','0300-1000079','32302-1000079-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(180,'Faculty Member 80','faculty80@ggcm.com','0300-1000080','32302-1000080-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(181,'Faculty Member 81','faculty81@ggcm.com','0300-1000081','32302-1000081-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(182,'Faculty Member 82','faculty82@ggcm.com','0300-1000082','32302-1000082-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(183,'Faculty Member 83','faculty83@ggcm.com','0300-1000083','32302-1000083-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(184,'Faculty Member 84','faculty84@ggcm.com','0300-1000084','32302-1000084-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(185,'Faculty Member 85','faculty85@ggcm.com','0300-1000085','32302-1000085-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(186,'Faculty Member 86','faculty86@ggcm.com','0300-1000086','32302-1000086-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(187,'Faculty Member 87','faculty87@ggcm.com','0300-1000087','32302-1000087-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(188,'Faculty Member 88','faculty88@ggcm.com','0300-1000088','32302-1000088-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(189,'Faculty Member 89','faculty89@ggcm.com','0300-1000089','32302-1000089-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(190,'Faculty Member 90','faculty90@ggcm.com','0300-1000090','32302-1000090-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(201,'Student 1','student1@ggcm.com','0300-2000001','32302-2000001-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(202,'Student 2','student2@ggcm.com','0300-2000002','32302-2000002-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(203,'Student 3','student3@ggcm.com','0300-2000003','32302-2000003-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(204,'Student 4','student4@ggcm.com','0300-2000004','32302-2000004-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(205,'Student 5','student5@ggcm.com','0300-2000005','32302-2000005-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(206,'Student 6','student6@ggcm.com','0300-2000006','32302-2000006-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(207,'Student 7','student7@ggcm.com','0300-2000007','32302-2000007-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(208,'Student 8','student8@ggcm.com','0300-2000008','32302-2000008-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(209,'Student 9','student9@ggcm.com','0300-2000009','32302-2000009-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(210,'Student 10','student10@ggcm.com','0300-2000010','32302-2000010-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(211,'Student 11','student11@ggcm.com','0300-2000011','32302-2000011-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(212,'Student 12','student12@ggcm.com','0300-2000012','32302-2000012-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(213,'Student 13','student13@ggcm.com','0300-2000013','32302-2000013-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(214,'Student 14','student14@ggcm.com','0300-2000014','32302-2000014-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(215,'Student 15','student15@ggcm.com','0300-2000015','32302-2000015-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(216,'Student 16','student16@ggcm.com','0300-2000016','32302-2000016-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(217,'Student 17','student17@ggcm.com','0300-2000017','32302-2000017-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(218,'Student 18','student18@ggcm.com','0300-2000018','32302-2000018-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(219,'Student 19','student19@ggcm.com','0300-2000019','32302-2000019-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW()),(220,'Student 20','student20@ggcm.com','0300-2000020','32302-2000020-1','$2b$10$zGrKoqqMyQT2h/eLvPohRuhv1/bR5MIiTeAs/P7iqtf0f6OVL7B2O',NULL,0,1,NOW(),NOW());
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
