UPDATE admission_cycles
SET title = CONVERT(BINARY CONVERT(title USING latin1) USING utf8mb4)
WHERE title REGEXP '[^[:print:]]' OR HEX(title) LIKE '%C394C387%';
