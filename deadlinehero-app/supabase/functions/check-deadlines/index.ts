import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Resend API key (Set this in Supabase secrets)
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// Supabase credentials (automatically available in Edge Functions)
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    // 1. Calculate the time window: Now to 30 minutes from now
    const now = new Date();
    const thirtyMinsFromNow = new Date(now.getTime() + 30 * 60 * 1000);

    // 2. Query tasks that are due within 30 minutes, not completed, and haven't triggered an alert yet
    // Notice: We filter by email_alert_sent to prevent spamming the same task every minute
    const { data: tasks, error: fetchError } = await supabase
      .from('tasks')
      .select('id, user_id, title, description, due_date')
      .eq('completed', false)
      .is('email_alert_sent', false)
      .gte('due_date', now.toISOString())
      .lte('due_date', thirtyMinsFromNow.toISOString());

    if (fetchError) throw fetchError;

    if (!tasks || tasks.length === 0) {
      return new Response(JSON.stringify({ message: "No tasks due within 30 minutes." }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    let emailsSent = 0;

    // 3. Send emails using Resend
    for (const task of tasks) {
      // Get the user's email securely from the auth system using their user_id
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(task.user_id);
      
      if (userError || !userData?.user?.email) {
        console.error("Could not fetch user email for task:", task.id);
        continue;
      }

      const userEmail = userData.user.email;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "DeadlineHero <onboarding@resend.dev>", // onboarding@resend.dev works for testing
          to: userEmail,
          subject: `⚠️ Alert: Task "${task.title}" is due in less than 30 mins!`,
          html: `
            <h2>Deadline Imminent!</h2>
            <p>Your task <strong>${task.title}</strong> is due at ${new Date(task.due_date).toLocaleString()}.</p>
            <p>Description: ${task.description || 'No description provided.'}</p>
            <br/>
            <p>Log in to DeadlineHero to complete it!</p>
          `,
        }),
      });

      if (res.ok) {
        emailsSent++;
        // Mark task as alerted in DB to prevent duplicate emails
        await supabase.from('tasks').update({ email_alert_sent: true }).eq('id', task.id);
      } else {
        console.error("Failed to send email via Resend:", await res.text());
      }
    }

    return new Response(JSON.stringify({ message: `Sent ${emailsSent} email alerts.` }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
