import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  app.use(express.json());

  // API Routes
  app.post('/api/invite', async (req, res) => {
    const { email, inviteUrl } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log(`Processing invitation for: ${email}`);

    if (!resend) {
      console.warn('RESEND_API_KEY not configured. Email not sent, but invitation recorded in DB.');
      return res.json({ 
        success: true, 
        message: 'Invitation recorded in database, but email notification skipped (RESEND_API_KEY missing).' 
      });
    }

    const resendFrom = process.env.RESEND_FROM_EMAIL || 'The Atrium <onboarding@resend.dev>';

    try {
      const { data, error } = await resend.emails.send({
        from: resendFrom,
        to: [email],
        subject: 'You have been invited to The Atrium',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #eee; border-radius: 10px;">
            <h1 style="color: #000; margin-bottom: 24px;">Welcome to The Atrium</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #444;">
              You have been invited to join a premium workspace at <strong>The Atrium</strong>.
            </p>
            <div style="margin: 32px 0;">
              <a href="${inviteUrl}" style="background-color: #000; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                Join Workspace
              </a>
            </div>
            <p style="font-size: 14px; color: #888;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        `,
      });

      if (error) {
        console.error('Resend error:', error);
        
        // Handle Resend Sandbox restriction or other validation errors
        if (error.name === 'validation_error') {
          const isSandbox = error.message.includes('testing emails') || resendFrom.includes('resend.dev');
          
          return res.json({ 
            success: true, 
            warning: 'Email Configuration Issue',
            message: isSandbox 
              ? `User added to workspace, but email was not sent. Resend is in Sandbox mode and only allows sending to your own email (similietimor@gmail.com). Please verify your domain in Resend to send to others.`
              : `User added to workspace, but email failed: ${error.message}. Please check your RESEND_FROM_EMAIL setting.`
          });
        }
        
        return res.status(500).json({ error: error.message });
      }

      res.json({ success: true, data });
    } catch (err: any) {
      console.error('Invite API error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
