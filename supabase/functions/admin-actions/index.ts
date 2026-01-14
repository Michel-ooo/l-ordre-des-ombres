import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is Guardian Supreme
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Claims error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Token invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;

    // Check if user is Guardian Supreme
    const { data: roleData, error: roleError } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'guardian_supreme')
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('Role check failed:', roleError);
      return new Response(
        JSON.stringify({ error: 'Accès refusé. Seul le Gardien Suprême peut effectuer cette action.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { action, ...data } = await req.json();
    console.log('Admin action requested:', action);

    // Create admin client with service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case 'create_user': {
        const { email, password, pseudonym, grade = 'novice' } = data;

        if (!email || !password || !pseudonym) {
          return new Response(
            JSON.stringify({ error: 'Email, mot de passe et pseudonyme requis' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create user account
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (createError) {
          console.error('User creation error:', createError);
          return new Response(
            JSON.stringify({ error: `Erreur création: ${createError.message}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create profile
        const { error: profileError } = await adminClient
          .from('profiles')
          .insert({
            id: newUser.user.id,
            pseudonym,
            grade,
            status: 'active',
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Rollback: delete user
          await adminClient.auth.admin.deleteUser(newUser.user.id);
          return new Response(
            JSON.stringify({ error: `Erreur profil: ${profileError.message}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create role (initiate by default)
        const { error: roleInsertError } = await adminClient
          .from('user_roles')
          .insert({
            user_id: newUser.user.id,
            role: 'initiate',
          });

        if (roleInsertError) {
          console.error('Role creation error:', roleInsertError);
        }

        console.log('User created successfully:', newUser.user.id);

        return new Response(
          JSON.stringify({ success: true, userId: newUser.user.id }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_user': {
        const { targetUserId, email, password, pseudonym, grade, status } = data;

        if (!targetUserId) {
          return new Response(
            JSON.stringify({ error: 'ID utilisateur requis' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update auth (email and/or password)
        const authUpdates: { email?: string; password?: string } = {};
        if (email) authUpdates.email = email;
        if (password) authUpdates.password = password;

        if (Object.keys(authUpdates).length > 0) {
          const { error: authError } = await adminClient.auth.admin.updateUserById(
            targetUserId,
            authUpdates
          );

          if (authError) {
            console.error('Auth update error:', authError);
            return new Response(
              JSON.stringify({ error: `Erreur mise à jour auth: ${authError.message}` }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        // Update profile
        const profileUpdates: { pseudonym?: string; grade?: string; status?: string } = {};
        if (pseudonym) profileUpdates.pseudonym = pseudonym;
        if (grade) profileUpdates.grade = grade;
        if (status) profileUpdates.status = status;

        if (Object.keys(profileUpdates).length > 0) {
          const { error: profileError } = await adminClient
            .from('profiles')
            .update(profileUpdates)
            .eq('id', targetUserId);

          if (profileError) {
            console.error('Profile update error:', profileError);
            return new Response(
              JSON.stringify({ error: `Erreur mise à jour profil: ${profileError.message}` }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        console.log('User updated successfully:', targetUserId);

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete_user': {
        const { userId: targetUserId } = data;

        if (!targetUserId) {
          return new Response(
            JSON.stringify({ error: 'ID utilisateur requis' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Prevent self-deletion
        if (targetUserId === userId) {
          return new Response(
            JSON.stringify({ error: 'Vous ne pouvez pas vous supprimer vous-même' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId);

        if (deleteError) {
          console.error('User deletion error:', deleteError);
          return new Response(
            JSON.stringify({ error: `Erreur suppression: ${deleteError.message}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('User deleted successfully:', targetUserId);

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Action non reconnue' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Admin function error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur interne' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
