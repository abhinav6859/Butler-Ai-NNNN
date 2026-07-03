import { Request, Response } from 'express';
import { AIService } from './aiService';

export class AIController {
  public static async parseTask(req: Request, res: Response) {
    try {
      const { text } = req.body;
   
const homeId = req.user?.homeId;

      if (!text) {
        return res.status(400).json({ error: 'Text prompt is required' });
      }
      if (!homeId) {
        return res.status(400).json({ error: 'Home context is missing' });
      }

      const result = await AIService.parseTaskRequest(text, homeId);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async suggestMeals(req: Request, res: Response) {
    try {
   
const homeId = req.user?.homeId;
      if (!homeId) {
        return res.status(400).json({ error: 'Home context is missing' });
      }

      const result = await AIService.suggestMealsFromPantry(homeId);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async suggestGroceries(req: Request, res: Response) {
    try {
     
      const homeId = req.user?.homeId;
      if (!homeId) {
        return res.status(400).json({ error: 'Home context is missing' });
      }

      const result = await AIService.suggestGroceries(homeId);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async chat(req: Request, res: Response) {
    try {
      const { message } = req.body;
      const userId = req.user?.id;
      const homeId = req.user?.homeId;

      if (!message) {
        return res.status(400).json({ error: 'Message query is required' });
      }
      if (!homeId) {
        return res.status(400).json({ error: 'Home context is missing' });
      }
if (!userId) {
    return res.status(401).json({
        error: "User not found"
    });
}
const reply = await AIService.chatAboutHome(
    message,
    homeId,
    userId
);
      return res.json({ reply });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
