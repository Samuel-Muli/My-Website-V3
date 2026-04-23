<?php
// save-visitor.php - Server-side logging
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

// Get visitor IP
$ip = $_SERVER['HTTP_CLIENT_IP'] ?? 
      $_SERVER['HTTP_X_FORWARDED_FOR'] ?? 
      $_SERVER['REMOTE_ADDR'] ?? 'Unknown';

// Get other info
$visitor_data = [
    'timestamp' => date('Y-m-d H:i:s'),
    'ip' => $ip,
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
    'referrer' => $_SERVER['HTTP_REFERER'] ?? 'Direct',
    'page' => $_SERVER['REQUEST_URI'] ?? '/',
    'method' => $_SERVER['REQUEST_METHOD'],
    'data' => $data
];

// Save to file (in production, use database)
$log_file = 'visitors.json';
$logs = [];

if (file_exists($log_file)) {
    $logs = json_decode(file_get_contents($log_file), true) ?? [];
}

$logs[] = $visitor_data;

// Keep only last 5000 entries
if (count($logs) > 5000) {
    $logs = array_slice($logs, -5000);
}

file_put_contents($log_file, json_encode($logs, JSON_PRETTY_PRINT));

// Send email notification (optional)
if (isset($data['notify']) && $data['notify'] === true) {
    $to = "your-email@example.com";
    $subject = "New Visitor Details";
    $message = "Name: " . ($data['name'] ?? 'Anonymous') . "\n";
    $message .= "Email: " . ($data['email'] ?? 'Not provided') . "\n";
    $message .= "IP: $ip\n";
    $message .= "Time: " . $visitor_data['timestamp'];
    
    mail($to, $subject, $message);
}

echo json_encode(['success' => true, 'ip' => $ip]);
?>