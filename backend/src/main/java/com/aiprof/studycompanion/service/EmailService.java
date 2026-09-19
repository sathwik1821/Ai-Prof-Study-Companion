package com.aiprof.studycompanion.service;

import com.aiprof.studycompanion.exception.AppException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:sathwikbodakunta2005@gmail.com}")
    private String fromEmail;

    public void sendOtpEmail(String toEmail, String otpCode, String fullName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "AiProf Study Companion");
            helper.setTo(toEmail);
            helper.setSubject("Your AiProf Verification Code: " + otpCode);

            String displayName = (fullName != null && !fullName.isBlank()) ? fullName : "Learner";

            String html = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d1117; color: #e6edf3; margin: 0; padding: 40px 20px; }
                        .container { max-width: 520px; margin: 0 auto; background: #161b22; border: 1px solid #30363d; border-radius: 16px; padding: 36px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                        .header { text-align: center; margin-bottom: 28px; }
                        .logo { font-size: 26px; font-weight: 800; color: #60a5fa; letter-spacing: -0.5px; }
                        .subtitle { font-size: 13.5px; color: #8b949e; margin-top: 4px; }
                        .greeting { font-size: 16px; color: #c9d1d9; margin-bottom: 16px; }
                        .otp-card { background: #0d1117; border: 1px solid rgba(96, 165, 250, 0.4); border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0; }
                        .otp-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #8b949e; margin-bottom: 8px; }
                        .otp-code { font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #60a5fa; font-family: 'Courier New', Courier, monospace; }
                        .expiry { font-size: 13px; color: #fbbf24; margin-top: 8px; font-weight: 500; }
                        .note { font-size: 13.5px; color: #8b949e; line-height: 1.6; margin-bottom: 20px; }
                        .footer { border-top: 1px solid #21262d; padding-top: 20px; text-align: center; font-size: 12px; color: #6e7681; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="logo">AiProf</div>
                            <div class="subtitle">AI-Powered Personal Learning Companion</div>
                        </div>
                        <div class="greeting">Hello %s,</div>
                        <p class="note">Thank you for joining AiProf. Use the 6-digit verification code below to verify your email address and activate your account:</p>
                        
                        <div class="otp-card">
                            <div class="otp-label">Verification Code</div>
                            <div class="otp-code">%s</div>
                            <div class="expiry">&#x23F1; Valid for 10 minutes</div>
                        </div>

                        <p class="note">If you did not create an account on AiProf, you can safely ignore this email.</p>
                        
                        <div class="footer">
                            &copy; 2026 AiProf Study Companion. All rights reserved.<br>
                            This is an automated security message.
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(displayName, otpCode);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("OTP verification email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to deliver OTP email to {} (Reason: {}). Fallback OTP Code: [{}]", toEmail, e.getMessage(), otpCode);
            // We log the OTP code so the developer/user can inspect logs and proceed even if SMTP fails
        }
    }
}
