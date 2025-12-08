// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2.38.0"

console.log("Checking for due reminders...")

Deno.serve(async (req) => {
  try {
    // Create a Supabase client with the edge runtime client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // Get current time
    const now = new Date()

    // Query due reminders
    const { data: reminders, error: remindersError } = await supabase
      .from("reminders")
      .select("*").eq("is_completed", false).lte("due_date", now)

    if (remindersError) {
      console.error("Error fetching reminders:", remindersError)
      return new Response(
        JSON.stringify({ error: "Failed to fetch reminders" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    console.log(`Found ${reminders?.length || 0} due reminders`)

    // Process each due reminder
    if (reminders && reminders.length > 0) {
      for (const reminder of reminders) {
        // Create a notification for the user
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert([
            {
              user_id: reminder.user_id,
              title: "提醒到期",
              content: reminder.title,
              is_read: false
            }
          ])

        if (notificationError) {
          console.error(`Error creating notification for reminder ${reminder.id}:`, notificationError)
        } else {
          console.log(`Created notification for reminder ${reminder.id}`)
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Checked reminders successfully", 
        due_reminders_count: reminders?.length || 0 
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Unexpected error:", error)
    return new Response(
      JSON.stringify({ error: "Unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/check-due-reminders' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{}'

*/
