const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log('--- coursera_snapshots ---');
  const { data: s_data } = await supabase.from('coursera_snapshots').select('snapshot_month');
  const counts = s_data ? s_data.reduce((acc, curr) => { acc[curr.snapshot_month] = (acc[curr.snapshot_month] || 0) + 1; return acc; }, {}) : {};
  console.log(counts);

  console.log('--- coursera_computed_metrics ---');
  const { data: metrics } = await supabase.from('coursera_computed_metrics').select('*').order('snapshot_month', { ascending: false }).limit(5);
  console.log(metrics);
  
  console.log('--- Check if any computations exist for July ---');
  const { data: julyData } = await supabase.from('coursera_computed_metrics').select('*').eq('snapshot_month', '2026-07-31');
  console.log('July Metrics:', julyData);
  
const { data: julyCount, count: countJul } = await supabase.from('coursera_snapshots').select('*', { count: 'exact', head: true }).eq('snapshot_month', '2026-07-31');
  console.log('July snapshots count:', countJul);
  
  // calculate sum of learning_hours
  const { data: julyRows } = await supabase.rpc('get_sum_hours', { p_month: '2026-07-31' }); // If RPC exists
  // instead let's just query some rows to see if learning_hours exists and its value
  const { data: sample } = await supabase.from('coursera_snapshots').select('*').eq('snapshot_month', '2026-07-31').limit(1);
  console.log('Sample July row:', sample);
}

check().catch(console.error);
