<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = sanitize_input($_POST["name"]);
    $email = sanitize_input($_POST["email"]);
    $message = sanitize_input($_POST["message"]);

    // Set the receiver email address
    $to = "joe.wartman@gmail.com";

    // Set the email subject
    $subject = "New Contact Form Submission";

    // Set the email body
    $body = "Name: " . $name . "\n";
    $body .= "Email: " . $email . "\n\n";
    $body .= "Message: " . $message;

    // Set the email headers
    $headers = "From: " . $email . "\r\n";
    $headers .= "Reply-To: " . $email . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    // Send the email
    if (mail($to, $subject, $body, $headers)) {
        echo "Email sent successfully.";
    } else {
        echo "Email sending failed.";
    }
}

function sanitize_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}
?>
