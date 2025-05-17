import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { FilterIcon, Download, ArrowUpRight, ArrowDownRight, CreditCard, Trophy } from "lucide-react";
import { useState } from "react";

interface TransactionHistoryProps {
  limit?: number;
}

export function TransactionHistory({ limit }: TransactionHistoryProps) {
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', { limit }],
  });
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }) + ' • ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowUpRight className="text-base text-success" />;
      case 'withdraw':
        return <ArrowDownRight className="text-base text-destructive" />;
      case 'tournament_entry':
        return <CreditCard className="text-base text-primary" />;
      case 'tournament_win':
        return <Trophy className="text-base text-warning" />;
      default:
        return <CreditCard className="text-base text-muted-foreground" />;
    }
  };
  
  const getTransactionTitle = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdraw':
        return 'Withdrawal';
      case 'tournament_entry':
        return 'Tournament Entry';
      case 'tournament_win':
        return 'Tournament Win';
      default:
        return 'Transaction';
    }
  };
  
  if (isLoading) {
    return (
      <div className="bg-muted rounded-xl overflow-hidden shadow-lg animate-pulse">
        <div className="h-64"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-poppins font-semibold text-lg">Transaction History</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="text-sm bg-accent hover:bg-accent/90">
            <FilterIcon className="h-4 w-4 mr-1" /> Filter
          </Button>
          <Button variant="outline" size="sm" className="text-sm bg-accent hover:bg-accent/90">
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </div>
      
      <div className="bg-muted rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full divide-y divide-border">
            <thead className="bg-background">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Transaction</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Method</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions && transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`
                          p-2 rounded-lg mr-3
                          ${transaction.type === 'deposit' ? 'bg-success/20' : 
                            transaction.type === 'withdraw' ? 'bg-destructive/20' :
                            transaction.type === 'tournament_entry' ? 'bg-primary/20' : 
                            transaction.type === 'tournament_win' ? 'bg-warning/20' : 'bg-muted'}
                        `}>
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <div className="font-medium">{getTransactionTitle(transaction.type)}</div>
                          <div className="text-xs text-muted-foreground">
                            {transaction.method ? (
                              `${transaction.method.charAt(0).toUpperCase() + transaction.method.slice(1)} - ${transaction.details || 'No details'}`
                            ) : (
                              transaction.details || 'No details'
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(transaction.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {transaction.method?.charAt(0).toUpperCase() + transaction.method?.slice(1) || 'Wallet'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-rajdhani font-bold ${
                      Number(transaction.amount) > 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      {Number(transaction.amount) > 0 ? '+' : ''}
                      ৳ {Math.abs(Number(transaction.amount)).toLocaleString()}.00
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`
                        px-2 py-1 text-xs font-medium rounded
                        ${transaction.status === 'completed' ? 'bg-success/20 text-success' :
                          transaction.status === 'pending' ? 'bg-warning/20 text-warning' :
                          'bg-destructive/20 text-destructive'}
                      `}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-muted-foreground">No transactions found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
