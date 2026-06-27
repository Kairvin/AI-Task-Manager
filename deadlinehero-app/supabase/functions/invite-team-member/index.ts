import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "re_PLACEHOLDER_KEY";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, workspaceName, inviteToken, originUrl } = await req.json()

    if (!email || !workspaceName || !inviteToken || !originUrl) {
      throw new Error("Missing required parameters");
    }

    const inviteLink = `${originUrl}/join?token=${inviteToken}`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'DeadlineHero <invites@deadlinehero.com>',
        to: [email],
        subject: `You have been invited to join ${workspaceName}`,
        html: `
          <h2>You're invited to collaborate on DeadlineHero!</h2>
          <p>You have been invited to join the <strong>${workspaceName}</strong> workspace.</p>
          <p>Click the link below to accept the invitation and join the team:</p>
          <a href="${inviteLink}" style="display: inline-block; padding: 10px 20px; background-color: #0058be; color: white; text-decoration: none; border-radius: 5px;">Join Workspace</a>
          <p><br/>If the button doesn't work, copy and paste this link into your browser:<br/>${inviteLink}</p>
        `,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error("Resend API error:", data);
      throw new Error(`Resend API returned ${res.status}`);
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error in invite-team-member:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
