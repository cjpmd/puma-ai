
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'admin' | 'manager' | 'coach' | 'parent';

interface UserProfile {
  id: string;
  role: UserRole;
  email: string | null;
}

export const useAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = useState(true);

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          if (userError.message.includes('refresh_token_not_found')) {
            // Clear the session and redirect to auth
            await supabase.auth.signOut();
            navigate('/auth');
            return null;
          }
          throw userError;
        }
        
        if (!user) {
          return null;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          toast({
            title: "Error",
            description: "Failed to load user profile",
            variant: "destructive"
          });
          return null;
        }

        // If no profile exists, create one with default role
        if (!data) {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([
              { 
                id: user.id, 
                email: user.email, 
                role: 'admin' as UserRole,
                name: user.email 
              }
            ])
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            toast({
              title: "Error",
              description: "Failed to create user profile",
              variant: "destructive"
            });
            return null;
          }

          return newProfile as UserProfile;
        }

        return data as UserProfile;
      } catch (err) {
        console.error('Auth error:', err);
        // If there's a refresh token error, sign out and redirect
        if (err instanceof Error && err.message.includes('refresh_token_not_found')) {
          await supabase.auth.signOut();
          navigate('/auth');
        }
        toast({
          title: "Error",
          description: "Authentication error occurred",
          variant: "destructive"
        });
        return null;
      }
    },
    retry: false,
    enabled: !isInitializing
  });

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          if (error.message.includes('refresh_token_not_found')) {
            await supabase.auth.signOut();
          }
          console.error('Session error:', error);
          navigate('/auth');
          return;
        }
        
        if (!session) {
          navigate('/auth');
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        navigate('/auth');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          if (!session) {
            navigate('/auth');
          }
        } else if (event === 'SIGNED_IN') {
          refetchProfile();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, refetchProfile]);

  const hasPermission = (requiredRole: UserRole[]): boolean => {
    if (!profile) return false;
    
    if (profile.role === 'admin') return true;
    
    if (requiredRole.includes('parent') && profile.role === 'coach') return true;
    
    return requiredRole.includes(profile.role);
  };

  return {
    profile,
    isLoading: isInitializing || profileLoading,
    hasPermission,
  };
};
