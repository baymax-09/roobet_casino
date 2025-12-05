# Email

The email module provides the generic interface to multiple email services providers, including _Mailgun_.

## Password Recovery Email

### sendRecoveryEmail

This is used to send a password recovery token to a user.

#### Parameters:

- email - the email address to send the recovery token to
- token - the recovery token used by the user to reset password

## Email Verification

The user will be sent a verification email when they change their email, it will expire in 2 days at which that can choose to resend a verification email.

### Routes

- GET email/verify - will check verification token and redirect to frontend with a success parameter
- GET email/resendVerificationEmail - will resend a verification email to the user's current email address
