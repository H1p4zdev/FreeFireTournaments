import { DesktopHeader } from "@/components/ui/header";
import { WalletBalance } from "@/components/wallet/wallet-balance";
import { TransactionHistory } from "@/components/wallet/transaction-history";
import { UserWithWallet } from "@shared/schema";

interface WalletProps {
  user: UserWithWallet | null;
}

export default function Wallet({ user }: WalletProps) {
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <DesktopHeader title="Wallet" user={user} />
      
      {/* Wallet Balance Card */}
      <WalletBalance userId={user.id} />
      
      {/* Transaction History */}
      <TransactionHistory />
    </div>
  );
}
