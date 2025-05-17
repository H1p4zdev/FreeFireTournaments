import { useQuery, useMutation } from "@tanstack/react-query";
import { Transaction, UserWithWallet } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { Check, X, AlertTriangle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";

interface AdminProps {
  user: UserWithWallet | null;
}

export default function Admin({ user }: AdminProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending-deposits");
  
  // Redirect if not admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      window.location.href = "/";
    }
  }, [user]);
  
  const { data: pendingDeposits, isLoading: isLoadingDeposits, refetch: refetchDeposits } = 
    useQuery<Transaction[]>({
      queryKey: ['/api/admin/transactions/pending'],
      enabled: !!user?.isAdmin,
    });
  
  const approveMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      const res = await apiRequest('POST', `/api/admin/transactions/${transactionId}/approve`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Deposit approved",
        description: "Funds have been added to the user's wallet"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions/pending'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve deposit. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const rejectMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      const res = await apiRequest('POST', `/api/admin/transactions/${transactionId}/reject`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Deposit rejected"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions/pending'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject deposit. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleApprove = (transactionId: number) => {
    approveMutation.mutate(transactionId);
  };
  
  const handleReject = (transactionId: number) => {
    rejectMutation.mutate(transactionId);
  };
  
  const filteredDeposits = pendingDeposits?.filter(t => t.type === 'deposit' && t.status === 'pending') || [];
  
  if (!user?.isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertTriangle className="mr-2" /> Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-4 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage tournaments, deposits, and game settings</p>
      </div>
      
      <Tabs defaultValue="pending-deposits" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="pending-deposits" className="relative">
            Pending Deposits
            {filteredDeposits.length > 0 && (
              <Badge 
                variant="destructive" 
                className="ml-2 absolute -right-2 -top-2 text-[10px] h-5 w-5 flex items-center justify-center p-0 rounded-full"
              >
                {filteredDeposits.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending-deposits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deposit Approvals</CardTitle>
              <CardDescription>Review and approve user deposits</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDeposits ? (
                <div className="py-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : filteredDeposits.length > 0 ? (
                <div className="space-y-4">
                  {filteredDeposits.map((deposit) => (
                    <Card key={deposit.id} className="bg-card/50">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="font-medium">User ID: {deposit.userId}</div>
                            <div className="text-sm text-muted-foreground">
                              <span className="capitalize">{deposit.method}</span> - {deposit.details}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(deposit.createdAt).toLocaleString()} • {formatDistanceToNow(new Date(deposit.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-xl font-bold font-rajdhani">
                              ৳ {Number(deposit.amount).toLocaleString()}.00
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => handleReject(deposit.id)}
                                disabled={rejectMutation.isPending}
                              >
                                <X className="mr-1 h-4 w-4" /> Reject
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-success text-success hover:bg-success hover:text-success-foreground"
                                onClick={() => handleApprove(deposit.id)}
                                disabled={approveMutation.isPending}
                              >
                                <Check className="mr-1 h-4 w-4" /> Approve
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No pending deposits to approve
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Placeholder for other admin tabs */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">
                User management features coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tournaments">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Management</CardTitle>
              <CardDescription>Create and manage tournaments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">
                Tournament management features coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure application settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">
                System settings features coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}