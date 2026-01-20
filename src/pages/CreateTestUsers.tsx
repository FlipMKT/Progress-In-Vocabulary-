import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";

const CreateTestUsers = () => {
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const { toast } = useToast();

  const createUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-test-users', {
        body: {}
      });

      if (error) throw error;

      setCreated(true);
      toast({
        title: "Success!",
        description: "Test users created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-success/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Test Users</CardTitle>
          <CardDescription>Generate admin and pupil test accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!created ? (
            <Button 
              onClick={createUsers} 
              disabled={loading} 
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Users...
                </>
              ) : (
                "Create Test Users"
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Users Created Successfully!</span>
              </div>
              
              <div className="space-y-3 border rounded-lg p-4 bg-muted/50">
                <div>
                  <p className="text-sm font-medium mb-1">Admin Account:</p>
                  <p className="text-xs text-muted-foreground">Email: admin@accelerateVocab.com</p>
                  <p className="text-xs text-muted-foreground">Password: admin123</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-1">Pupil Account:</p>
                  <p className="text-xs text-muted-foreground">Email: pupil@accelerateVocab.com</p>
                  <p className="text-xs text-muted-foreground">Password: pupil123</p>
                </div>
              </div>

              <Button 
                onClick={() => window.location.href = '/login'} 
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateTestUsers;
