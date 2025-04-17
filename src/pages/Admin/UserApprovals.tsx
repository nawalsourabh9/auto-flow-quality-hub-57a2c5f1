
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface UserApproval {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string | null;
}

const UserApprovals = () => {
  const [approvals, setApprovals] = useState<UserApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const { approveUser, rejectUser } = useAuth();

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      // Use a direct query without type checking since we know the table exists
      const { data, error } = await supabase
        .from('account_approvals')
        .select('*')
        .order('created_at', { ascending: false }) as { data: UserApproval[] | null, error: any };

      if (error) throw error;
      setApprovals(data || []);
    } catch (error: any) {
      console.error('Error fetching user approvals:', error);
      toast.error('Failed to load user approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await approveUser(userId);
      // Refresh the list after approval
      fetchApprovals();
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  const handleReject = async (userId: string) => {
    try {
      await rejectUser(userId);
      // Refresh the list after rejection
      fetchApprovals();
    } catch (error) {
      console.error('Error rejecting user:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Account Approvals</h1>
          <p className="text-muted-foreground">
            Manage user account registration requests
          </p>
        </div>
        <Button variant="outline" onClick={fetchApprovals} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Requests</CardTitle>
          <CardDescription>
            Review and approve new user account requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : approvals.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No account approval requests found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Date Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell>
                      {approval.first_name} {approval.last_name}
                    </TableCell>
                    <TableCell>{approval.email}</TableCell>
                    <TableCell>{new Date(approval.created_at).toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(approval.status)}</TableCell>
                    <TableCell>
                      {approval.status === 'pending' ? (
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleApprove(approval.user_id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleReject(approval.user_id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {approval.status === 'approved' ? 'Approved' : 'Rejected'} on {
                            approval.updated_at ? new Date(approval.updated_at).toLocaleDateString() : 'N/A'
                          }
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserApprovals;
