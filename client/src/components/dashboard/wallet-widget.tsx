import { Link } from "wouter";
import { Plus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DepositModal } from "../modals/deposit-modal";
import { WithdrawModal } from "../modals/withdraw-modal";
import { Wallet } from "@shared/schema";

interface WalletWidgetProps {
  userId: number;
}

export function WalletWidget({ userId }: WalletWidgetProps) {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  
  const { data: wallet, isLoading } = useQuery<Wallet>({
    queryKey: ['/api/wallet'],
  });
  
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-muted to-accent rounded-xl p-5 mb-6 shadow-lg animate-pulse">
        <div className="h-20"></div>
      </div>
    );
  }
  
  return (
    <>
      <div className="bg-gradient-to-r from-muted to-accent rounded-xl p-5 mb-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-poppins font-semibold text-lg">Your Wallet</h2>
          <Link href="/wallet" className="text-sm text-muted-foreground hover:text-primary">
            View All
          </Link>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm mb-1">Current Balance</p>
            <p className="font-rajdhani font-bold text-3xl">
              ৳ {Number(wallet?.balance).toLocaleString()}
              <span className="text-muted-foreground text-lg">.00</span>
            </p>
          </div>
          <div className="flex mt-4 md:mt-0 space-x-3">
            <Button 
              onClick={() => setIsDepositModalOpen(true)}
              className="bg-primary hover:bg-primary/90 transition"
            >
              <Plus className="mr-2 h-4 w-4" /> Deposit
            </Button>
            <Button 
              onClick={() => setIsWithdrawModalOpen(true)}
              variant="outline"
              className="bg-accent hover:bg-accent/90 transition"
            >
              <CreditCard className="mr-2 h-4 w-4" /> Withdraw
            </Button>
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
