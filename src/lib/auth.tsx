import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isPupil: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAdmin: false,
  isPupil: false,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPupil, setIsPupil] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check user role when session changes
        if (session?.user) {
          setTimeout(() => {
            checkUserRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsPupil(false);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (userId: string) => {
    try {
      // First, get the user's integer ID from profiles using their auth UUID
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_id", userId)
        .limit(1)
        .single();

      if (profileError || !profileData) {
        console.error("Error finding user profile:", profileError);
        setIsAdmin(false);
        setIsPupil(false);
        setLoading(false);
        return;
      }

      // Now get the role using the integer user_id
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", profileData.id)
        .limit(1)
        .single();

      if (error) {
        console.error("Error checking user role:", error);
        setIsAdmin(false);
        setIsPupil(false);
      } else {
        setIsAdmin(data?.role === "admin");
        setIsPupil(data?.role === "pupil");
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      setIsAdmin(false);
      setIsPupil(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isPupil, loading }}>
      {children}
    </AuthContext.Provider>
  );
};