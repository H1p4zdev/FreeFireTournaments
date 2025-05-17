import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Info } from "lucide-react";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  currentBalance: number;
}

export function WithdrawModal({ isOpen, onClose, userId, currentBalance }: WithdrawModalProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const withdrawAmount = Number(amount);
    
    if (!amount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    
    if (withdrawAmount > currentBalance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough funds in your wallet",
        variant: "destructive",
      });
      return;
    }
    
    if (!phone || phone.length !== 11) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid 11-digit phone number",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await apiRequest('POST', '/api/wallet/withdraw', {
        amount: withdrawAmount,
        method: paymentMethod,
        phone
      });
      
      toast({
        title: "Withdrawal initiated",
        description: "Your withdrawal request is being processed.",
      });
      
      // Invalidate wallet and transactions queries
      queryClient.invalidateQueries({ queryKey: ['/api/wallet'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      onClose();
      
      // Reset form
      setAmount('');
      setPhone('');
    } catch (error: any) {
      toast({
        title: "Withdrawal failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-muted text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-poppins text-lg">Withdraw Funds</DialogTitle>
          <DialogDescription>
            Withdraw money from your wallet to bKash or Nagad
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <Label className="text-sm font-medium text-muted-foreground">Available Balance</Label>
              <span className="text-sm font-rajdhani font-bold">৳ {currentBalance.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="mb-4">
            <Label className="block text-sm font-medium text-muted-foreground mb-1">Amount (BDT)</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-muted-foreground">৳</span>
              </div>
              <Input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8"
                placeholder="0.00"
                min="10"
                max={currentBalance.toString()}
                required
              />
            </div>
          </div>
          
          <div className="mb-4">
            <Label className="block text-sm font-medium text-muted-foreground mb-1">Payment Method</Label>
            <RadioGroup 
              value={paymentMethod} 
              onValueChange={setPaymentMethod}
              className="grid grid-cols-2 gap-3"
            >
              <div className={`
                bg-background border rounded-lg p-3 flex items-center cursor-pointer
                ${paymentMethod === 'bkash' ? 'border-primary' : 'border-border'}
              `}>
                <RadioGroupItem value="bkash" id="bkash-withdraw" className="sr-only" />
                <Label htmlFor="bkash-withdraw" className="flex items-center cursor-pointer w-full">
                  <div className="bg-[#E2136E] bg-opacity-10 p-2 rounded mr-2">
                    <div className="text-[#E2136E] font-bold text-sm font-rajdhani">bKash</div>
                  </div>
                  <div className="text-sm">bKash</div>
                </Label>
              </div>
              
              <div className={`
                bg-background border rounded-lg p-3 flex items-center cursor-pointer
                ${paymentMethod === 'nagad' ? 'border-primary' : 'border-border'}
              `}>
                <RadioGroupItem value="nagad" id="nagad-withdraw" className="sr-only" />
                <Label htmlFor="nagad-withdraw" className="flex items-center cursor-pointer w-full">
                  <div className="bg-[#F06B26] bg-opacity-10 p-2 rounded mr-2">
                    <div className="text-[#F06B26] font-bold text-sm font-rajdhani">Nagad</div>
                  </div>
                  <div className="text-sm">Nagad</div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="mb-4">
            <Label className="block text-sm font-medium text-muted-foreground mb-1">Phone Number</Label>
            <Input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01X XX XXXXXX" 
              pattern="[0-9]{11}"
              required
            />
          </div>
          
          <div className="bg-background rounded-lg p-3 mb-6">
            <div className="flex items-center text-sm">
              <Info className="h-4 w-4 text-muted-foreground mr-2" />
              <span className="text-muted-foreground">
                Withdrawals are typically processed within 24 hours. You'll receive a confirmation text when completed.
              </span>
            </div>
          </div>
          
          <DialogFooter className="flex space-x-3">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="flex-1">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-background border-t-primary rounded-full"></div>
                  Processing...
                </>
              ) : (
                'Confirm Withdrawal'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
