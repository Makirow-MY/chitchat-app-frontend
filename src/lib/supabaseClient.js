
// import { createClient } from '@supabase/supabase-js'
// import { useAuthStore } from '../store/useAuthStore';

// // const supabaseUrl = 'https://uaqjmqxaibovtscvdtuj.supabase.co'
// // const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhcWptcXhhaWJvdnRzY3ZkdHVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MjE5MzMsImV4cCI6MjA4MDQ5NzkzM30.q5HpQiQ7yvqSyBue_viEnlh11caGduu6XtaRw59NJjs"

// // export const supabase = createClient(supabaseUrl, supabaseKey, {
// //  
// const supabaseUrl = 'https://zzwwlcnugtuhlgyrumug.supabase.co'
// const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6d3dsY251Z3R1aGxneXJ1bXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjU3MjEsImV4cCI6MjA4MDU0MTcyMX0.coAiaS7xwf2gUjRGVN6ZDwckvbDPRyGmd_BTxftFlcw"
// export const supabase = createClient(supabaseUrl, supabaseKey, {
//     auth: {
//     persistSession: true,
//     autoRefreshToken: true,
//     detectSessionInUrl: true
//   },
//   realtime: { params: { eventsPerSecond: 10 } },
// })

// // Auto check auth on load
// supabase.auth.onAuthStateChange((_event, session) => {
//   if (session?.user) {
//     useAuthStore.getState().checkAuth();
//   } else {
//     useAuthStore.getState().disconnectRealtime();
//     useAuthStore.setState({ authUser: null });
//   }
// });