import { Request, Response } from 'express';
import { getCustomerSession } from '../telegram/customerBot';

// Get customer session for Mini Web App
export async function getCustomerSessionData(req: Request, res: Response) {
  try {
    const { sessionToken, telegramUserId } = req.query;

    if (!sessionToken || !telegramUserId) {
      return res.status(400).json({ error: 'Missing session token or Telegram user ID' });
    }

    const session = getCustomerSession(telegramUserId as string);
    
    if (!session || session.sessionToken !== sessionToken) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Return session data without sensitive information
    res.json({
      userId: session.userId,
      location: session.location,
      step: session.step,
      sessionValid: true
    });
  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}