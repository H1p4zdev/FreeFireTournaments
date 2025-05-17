import type { Express, Request, Response, NextFunction } from "express";
import { WebSocket } from "ws";
import { storage } from "./storage";

// Admin middleware to check if user is admin
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error("Error in admin middleware:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export function registerAdminRoutes(app: Express, connections: any[]) {
  // Get pending transactions for admin approval
  app.get('/api/admin/transactions/pending', isAdmin, async (req: Request, res: Response) => {
    try {
      const transactions = await storage.getTransactionsByStatus('pending');
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching pending transactions:", error);
      res.status(500).json({ message: "Failed to fetch pending transactions" });
    }
  });
  
  // Approve deposit transaction
  app.post('/api/admin/transactions/:id/approve', isAdmin, async (req: Request, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);
      
      // Get transaction
      const transaction = await storage.getTransaction(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      if (transaction.status !== 'pending') {
        return res.status(400).json({ message: "Only pending transactions can be approved" });
      }
      
      if (transaction.type !== 'deposit') {
        return res.status(400).json({ message: "Only deposit transactions can be approved" });
      }
      
      // Update transaction status
      const updatedTransaction = await storage.updateTransactionStatus(transactionId, 'completed');
      
      // Update user wallet balance
      const wallet = await storage.updateWalletBalance(
        transaction.userId, 
        parseFloat(transaction.amount)
      );
      
      // Notify user via WebSocket (if connected)
      const userConnection = connections.find(conn => conn.userId === transaction.userId);
      
      if (userConnection && userConnection.ws.readyState === WebSocket.OPEN) {
        userConnection.ws.send(JSON.stringify({
          type: 'transaction_update',
          transactionId: transaction.id,
          status: 'completed',
          message: 'Your deposit has been approved',
          amount: transaction.amount,
          newBalance: wallet.balance
        }));
      }
      
      res.json(updatedTransaction);
    } catch (error) {
      console.error("Error approving transaction:", error);
      res.status(500).json({ message: "Failed to approve transaction" });
    }
  });
  
  // Reject deposit transaction
  app.post('/api/admin/transactions/:id/reject', isAdmin, async (req: Request, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);
      
      // Get transaction
      const transaction = await storage.getTransaction(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      if (transaction.status !== 'pending') {
        return res.status(400).json({ message: "Only pending transactions can be rejected" });
      }
      
      // Update transaction status
      const updatedTransaction = await storage.updateTransactionStatus(transactionId, 'rejected');
      
      // Notify user via WebSocket (if connected)
      const userConnection = connections.find(conn => conn.userId === transaction.userId);
      
      if (userConnection && userConnection.ws.readyState === WebSocket.OPEN) {
        userConnection.ws.send(JSON.stringify({
          type: 'transaction_update',
          transactionId: transaction.id,
          status: 'rejected',
          message: 'Your deposit has been rejected'
        }));
      }
      
      res.json(updatedTransaction);
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      res.status(500).json({ message: "Failed to reject transaction" });
    }
  });
}