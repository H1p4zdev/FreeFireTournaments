import { useQuery } from "@tanstack/react-query";
import { Wallet } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, ArrowUpRight, ArrowDownRight, Trophy } from "lucide-react";
import { useState } from "react";
import { DepositModal } from "../modals/deposit-modal";
import { WithdrawModal } from "../modals/withdraw-modal";

interface WalletBalanceProps {
  userId: number;
}

export function WalletBalance({ userId }: WalletBalanceProps) {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  
  const { data: wallet, isLoading: isWalletLoading } = useQuery<Wallet>({
    queryKey: ['/api/wallet'],
  });
  
  const { data: transactions, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['/api/transactions'],
  });
  
  // Calculate stats
  const totalDeposits = transactions
    ?.filter(t => t.type === 'deposit' && t.status === 'completed')
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    
  const totalWithdrawals = transactions
    ?.filter(t => t.type === 'withdraw' && t.status === 'completed')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;
    
  const tournamentEarnings = transactions
    ?.filter(t => t.type === 'tournament_win' && t.status === 'completed')
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  
  if (isWalletLoading) {
    return (
      <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl p-6 mb-8 shadow-lg animate-pulse">
        <div className="h-32"></div>
      </div>
    );
  }
  
  return (
    <>
      <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl p-6 mb-8 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <p className="text-muted-foreground text-sm mb-1">Total Balance</p>
            <p className="font-rajdhani font-bold text-4xl">
              ৳ {Number(wallet?.balance).toLocaleString()}
              <span className="text-muted-foreground text-lg">.00</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {new Date().toLocaleString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </p>
          </div>
          <div className="flex mt-6 md:mt-0 space-x-3">
            <Button 
              size="lg"
              onClick={() => setIsDepositModalOpen(true)}
              className="bg-primary hover:bg-primary/90 transition shadow-lg"
            >
              <Plus className="mr-2 h-4 w-4" /> Deposit
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setIsWithdrawModalOpen(true)}
              className="bg-accent hover:bg-accent/90 border border-border transition"
            >
              <CreditCard className="mr-2 h-4 w-4" /> Withdraw
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-muted rounded-xl p-5 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-muted-foreground text-sm">Total Deposits</p>
              <p className="font-rajdhani font-bold text-2xl mt-1">৳ {totalDeposits.toLocaleString()}</p>
            </div>
            <div className="bg-accent p-2 rounded-lg">
              <ArrowUpRight className="h-5 w-5 text-success" />
            </div>
          </div>
        </div>
        <div className="bg-muted rounded-xl p-5 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-muted-foreground text-sm">Total Withdrawals</p>
              <p className="font-rajdhani font-bold text-2xl mt-1">৳ {totalWithdrawals.toLocaleString()}</p>
            </div>
            <div className="bg-accent p-2 rounded-lg">
              <ArrowDownRight className="h-5 w-5 text-destructive" />
            </div>
          </div>
        </div>
        <div className="bg-muted rounded-xl p-5 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-muted-foreground text-sm">Tournament Earnings</p>
              <p className="font-rajdhani font-bold text-2xl mt-1">৳ {tournamentEarnings.toLocaleString()}</p>
            </div>
            <div className="bg-accent p-2 rounded-lg">
              <Trophy className="h-5 w-5 text-warning" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-muted rounded-xl overflow-hidden shadow-lg mb-8 hidden md:block">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-8">
            <h2 className="font-poppins font-bold text-xl mb-4">Quick & Secure Payments</h2>
            <p className="text-muted-foreground mb-6">
              Deposit and withdraw funds easily using our secure payment gateway. 
              We support bKash and Nagad for instant transactions.
            </p>
            <div className="flex space-x-4 mb-6">
              <div className="bg-[#E2136E] bg-opacity-10 p-3 rounded-lg">
                <div className="text-[#E2136E] font-bold font-rajdhani">bKash</div>
              </div>
              <div className="bg-[#F06B26] bg-opacity-10 p-3 rounded-lg">
                <div className="text-[#F06B26] font-bold font-rajdhani">Nagad</div>
              </div>
            </div>
            <Button>
              Add Payment Method
            </Button>
          </div>
          <div className="relative hidden md:block">
            <img 
              src="https://images.unsplash.com/photo-1627163439134-7a8c47e08208?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80" 
              alt="Mobile payment illustration" 
              className="w-full h-full object-cover" 
            />
          </div>
        </div>
      </div>
      
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        userId={userId}
      />
      
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        userId={userId}
        currentBalance={Number(wallet?.balance || 0)}
      />
    </>
  );
}
