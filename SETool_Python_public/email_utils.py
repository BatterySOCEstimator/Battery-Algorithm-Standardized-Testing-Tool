"""
Email utilities for sending notifications to users
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os

# Email configuration
EMAIL_CONFIG = {
    'sender': '___@gmail.com', # <- PUT SENDER EMAIL HERE
    'smtp_server': 'smtp.gmail.com',
    'smtp_port': 465,
    'username': '___@gmail.com',
    'password': 'APP_PASSWORD_HERE'  # <- PUT APP PASSWORD HERE (NEED 2FA ENABLED ON GMAIL)
}

def setup_email():
    """Initialize email configuration"""
    # This function can be used to validate email settings
    print("Email configuration loaded")

def send_email(recipient, subject, body, attachments=None):
    """
    Send an email with optional attachments
    
    Parameters:
    -----------
    recipient : str
        Email address of recipient
    subject : str
        Email subject line
    body : str
        Email body text
    attachments : str or list of str, optional
        File path(s) to attach to email
    """
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = EMAIL_CONFIG['sender']
        msg['To'] = recipient
        msg['Subject'] = subject
        
        # Add body
        msg.attach(MIMEText(body, 'plain'))
        
        # Add attachments
        if attachments:
            if isinstance(attachments, str):
                attachments = [attachments]
            
            for filepath in attachments:
                if os.path.exists(filepath):
                    with open(filepath, 'rb') as f:
                        part = MIMEBase('application', 'octet-stream')
                        part.set_payload(f.read())
                        encoders.encode_base64(part)
                        part.add_header(
                            'Content-Disposition',
                            f'attachment; filename={os.path.basename(filepath)}'
                        )
                        msg.attach(part)
                else:
                    print(f"Warning: Attachment {filepath} not found")
        
        # Send email
        with smtplib.SMTP_SSL(EMAIL_CONFIG['smtp_server'], 
                              EMAIL_CONFIG['smtp_port']) as server:
            server.login(EMAIL_CONFIG['username'], EMAIL_CONFIG['password'])
            server.send_message(msg)
        
        print(f"Email sent successfully to {recipient}")
        return True
        
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False

def send_submission_received(recipient, model_name):
    """Send confirmation that submission was received"""
    title = f'Your model named "{model_name}" has been received!'
    body = (
        'Dear Author, Your data has been received and is being processed. '
        'An error summary of your results will be sent to you shortly, '
        'typically within ten minutes or less. If an error occurs, you will be notified. '
        'If you have not received an email within 3h, please check your spam folder '
        'or contact us. Thank you for your submission!'
    )
    return send_email(recipient, title, body)

def send_results(recipient, model_name, rank, total, leaderboard_path, 
                 data_files, exploit=False):
    """Send results to user after processing"""
    title = f'{model_name} model results are ready!'
    
    if exploit:
        body = (
            f'Dear Author, Thank you for submitting your model. '
            f'The Model currently ranks {rank} out of {total} total submissions. '
            f'Due to large deviations, no error data will be sent to you. '
            f'Try to improve your estimation results using the open data before submitting your model. '
            f'A possible reason for unexpected deviation could be that NaN values are returned for some drive cycles. '
            f'If you think this is a mistake, please contact us. Thank you!'
        )
        attachments = [leaderboard_path]
    else:
        if isinstance(data_files, str):
            # Single file
            body = (
                f'Dear Author, Thank you for submitting your model. '
                f'The Model currently ranks {rank} out of {total} total submissions. '
                f'The leaderboard, error results for all drive cycles and test result figures '
                f'are attached to this email. Thank you!'
            )
            attachments = [data_files, leaderboard_path]
        else:
            # Multiple files
            if len(data_files) == 1:
                body = (
                    f'Dear Author, Thank you for submitting your model. '
                    f'The Model currently ranks {rank} out of {total} total submissions. '
                    f'The leaderboard, error results for all drive cycles and test result figures '
                    f'are attached to this email. Thank you!'
                )
                attachments = [data_files[0], leaderboard_path]
            else:
                body = (
                    f'Dear Author, Thank you for submitting your model. '
                    f'The Model currently ranks {rank} out of {total} total submissions. '
                    f'The leaderboard and error results for all drive cycles are attached to this email. '
                    f'Due to the size of the data, the test result figures are sent in another mail. Thank you!'
                )
                attachments = [data_files[0], leaderboard_path]
                send_email(recipient, title, 'Dear Author, Attached are the test result figures. Thank you!', 
                          data_files[1])
                return True
    
    return send_email(recipient, title, body, attachments)

def send_duplicate_notification(recipient, model_name):
    """Notify user that their submission is a duplicate"""
    title = f'{model_name} is already on the leaderboard!'
    body = (
        'Dear Author, your submission has identical results to an existing entry. '
        'For this reason your submission is not added to the leaderboard. '
        'If you think this is a mistake, please contact us. Thank you!'
    )
    return send_email(recipient, title, body)

def send_error_notification(recipient, model_name, error_code, error_message):
    """Notify user of an error in their submission"""
    title = f'Submission of "{model_name}" encountered an error'
    body = (
        f'Dear Author, an error occurred when processing your submission.\n\n'
        f'Error Code: {error_code}\n'
        f'Error Message: {error_message}\n\n'
        f'Please check your submission and try again. '
        f'If you continue to have issues, please contact support. Thank you!'
    )
    return send_email(recipient, title, body)

def send_incorrect_submission(recipient, model_name):
    """Notify user that their submission format is incorrect"""
    title = f'Your model named "{model_name}" has been submitted incorrectly!'
    body = (
        'Dear Author, Your submission has been submitted incorrectly. '
        'No Model file was found. Please include either:\n'
        '  - Model.py (for Python models), or\n'
        '  - Model.m or Model.p (for MATLAB models)\n\n'
        'Please resubmit your .zip with the correct file names. Thank you!'
    )
    return send_email(recipient, title, body)