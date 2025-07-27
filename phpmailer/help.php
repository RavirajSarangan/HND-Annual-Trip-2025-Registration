<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Imno">
    <meta name="author" content="Ansonika">
    <title>Imno</title>
</head>

<body>
<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'src/Exception.php';
require 'src/PHPMailer.php';

$mail = new PHPMailer(true);

try {

    //Recipients - main edits
    $mail->setFrom('info@Imno.com', 'Message from Imno');                    // Email Address and Name FROM
    $mail->addAddress('info@Imno.com', 'Jhon Doe');                            // Email Address and Name TO - Name is optional
    $mail->addReplyTo('noreply@Imno.com', 'Message from Imno');              // Email Address and Name NOREPLY
    $mail->isHTML(true);                                                       
    $mail->Subject = 'Message from Imno';                                      // Email Subject   

    // Email verification, do not edit
    function isEmail($email_help ) {
        return(preg_match("/^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,})$/",$email_help ));
    }

    // Form fields
    $fullname       = $_POST['fullname'];
    $email_help     = $_POST['email_help'];
    $message_help   = $_POST['message_help'];
    $verify_help    = $_POST['verify_help'];

    if(trim($fullname) == '') {
        echo '<div class="error_message">Please enter your Fullname.</div>';
        exit();
    } else if(trim($email_help) == '') {
        echo '<div class="error_message">Please enter a valid email address.</div>';
        exit();
    } else if(!isEmail($email_help)) {
        echo '<div class="error_message">You have entered an invalid e-mail address.</div>';
        exit();
    } else if(trim($message_help) == '') {
        echo '<div class="error_message">Please enter your message.</div>';
        exit();
    } else if(!isset($verify_help) || trim($verify_help) == '') {
        echo '<div class="error_message">Please enter the verification number.</div>';
        exit();
    } else if(trim($verify_help) != '4') {
        echo '<div class="error_message">The verification number you entered is incorrect.</div>';
        exit();
    }            

    // Setup html content
    $e_content = "You have been contacted by <strong>$fullname</strong> with the following message:<br><br>$message_help<br><br>You can contact $fullname via email at $email_help";
    
    $mail->Body = "" . $e_content . "";

    $mail->CharSet = 'UTF-8'; //Force UTF for special characters

    $mail->send();

    // Confirmation/autoreplay email send to who fill the form
    $mail->ClearAddresses();
    $mail->addAddress($_POST['email_help']); // Email address entered on form
    $mail->isHTML(true);
    $mail->Subject    = 'Confirmation'; // Custom subject
    $mail->Body = "" . $e_content . "";

    $mail->CharSet = 'UTF-8'; //Force UTF for special characters

    $mail->Send();

     echo '<div id="success_page" style="padding:25px 0 0 0; text-align:center;"">
               <strong >Email Sent</strong>!<br>
               Thank you, your message has been submitted.<br>We will contact you shortly.
            </div>';
        } catch (Exception $e) {
            echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
    }
?> 

</body>
</html>