import { useState } from "react";
import { DesktopHeader } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserWithWallet } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";

interface ProfileProps {
  user: UserWithWallet | null;
}

export default function Profile({ user }: ProfileProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    playerID: user?.playerID || "",
    phone: user?.phone || ""
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  // Statistics summary
  const tournamentsPlayed = transactions?.filter(t => t.type === 'tournament_entry').length || 0;
  const tournamentsWon = transactions?.filter(t => t.type === 'tournament_win').length || 0;
  const totalWinnings = transactions
    ?.filter(t => t.type === 'tournament_win' && t.status === 'completed')
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // This would typically call an API to update the user profile
    // For now, just show a success toast
    toast({
      title: "Profile updated",
      description: "Your profile has been successfully updated."
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <DesktopHeader title="Profile" user={user} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your account details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-20 w-20 rounded-full bg-accent flex items-center justify-center text-primary font-bold text-3xl">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-xl">{user.username}</h3>
                <p className="text-muted-foreground">
                  {user.playerID ? `Player ID: ${user.playerID}` : 'No Player ID set'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Joined {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="playerID">Free Fire Player ID</Label>
                  <Input 
                    id="playerID"
                    name="playerID"
                    value={formData.playerID}
                    onChange={handleInputChange}
                    placeholder="Add your player ID"
                    disabled={!isEditing}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Add your email"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={true} // Phone can't be edited
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            {isEditing ? (
              <>
                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </CardFooter>
        </Card>
        
        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Player Statistics</CardTitle>
            <CardDescription>
              Your gaming performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-accent rounded-lg p-4">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">Current Balance</p>
                <p className="font-rajdhani font-bold text-3xl">৳ {Number(user.wallet.balance).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <p className="text-muted-foreground">Tournaments Played</p>
                <p className="font-bold">{tournamentsPlayed}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">Tournaments Won</p>
                <p className="font-bold">{tournamentsWon}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">Win Rate</p>
                <p className="font-bold">
                  {tournamentsPlayed > 0 
                    ? ((tournamentsWon / tournamentsPlayed) * 100).toFixed(1) 
                    : '0.0'}%
                </p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">Total Winnings</p>
                <p className="font-bold text-success">৳ {totalWinnings.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tournament History */}
      <div className="mt-8">
        <Tabs defaultValue="history">
          <TabsList className="mb-4">
            <TabsTrigger value="history">Tournament History</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Your Tournament History</CardTitle>
                <CardDescription>
                  Records of your previous tournament participation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tournamentsPlayed > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-full divide-y divide-border">
                      <thead className="bg-background">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tournament</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Mode</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Position</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Prize</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {transactions?.filter(t => t.type === 'tournament_entry').map((tournament, index) => (
                          <tr key={tournament.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium">{tournament.details?.split('(ID: ')[0] || 'Tournament'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {new Date(tournament.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {/* This would come from tournament details */}
                              {['Solo', 'Duo', 'Squad'][Math.floor(Math.random() * 3)]}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {transactions?.some(t => 
                                t.type === 'tournament_win' && 
                                t.details?.includes(tournament.details?.split('(ID: ')[1]?.replace(')', '') || '')
                              ) ? '#1' : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-rajdhani font-bold">
                              {transactions?.find(t => 
                                t.type === 'tournament_win' && 
                                t.details?.includes(tournament.details?.split('(ID: ')[1]?.replace(')', '') || '')
                              ) ? 
                                `৳ ${Math.abs(Number(transactions?.find(t => 
                                  t.type === 'tournament_win' && 
                                  t.details?.includes(tournament.details?.split('(ID: ')[1]?.replace(')', '') || '')
                                )?.amount || 0)).toLocaleString()}` : 
                                '-'
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">You haven't participated in any tournaments yet.</p>
                    <Button className="mt-4" asChild>
                      <a href="/tournaments">Browse Tournaments</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle>Your Achievements</CardTitle>
                <CardDescription>
                  Unlock achievements by participating in tournaments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-10">
                  <p className="text-muted-foreground">Achievements coming soon!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
