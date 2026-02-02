const {BigQuery} = require('@google-cloud/bigquery');
const bigquery = new BigQuery();

const PROJECT_ID = 'polwell-data-warehouse';
const DATASET_ID = 'consentmanager';
const TABLE_ID = 'logs';
const BATCH_SIZE = 200;

let buffer = [];
let lastFlush = Date.now();
const FLUSH_INTERVAL = 60000;

exports.logConsent = async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const data = req.body;
    
    if (!data.event || !data.consent_id) {
      return res.status(400).send('Missing required fields');
    }

    buffer.push({
      event: data.event,
      consent_id: data.consent_id,
      accept_type: data.accept_type || null,
      accepted_categories: data.accepted_categories || null,
      rejected_categories: data.rejected_categories || null,
      ga4_client_id: data.ga4_client_id || null,
      ga4_session_id: data.ga4_session_id || null,
      user_agent: data.user_agent || null,
      hostname: data.hostname || null,
      page_url: data.page_url || null,
      created_at: new Date().toISOString()
    });

    const shouldFlush = buffer.length >= BATCH_SIZE || 
                        (Date.now() - lastFlush) > FLUSH_INTERVAL;

    if (shouldFlush && buffer.length > 0) {
      const rowsToInsert = [...buffer];
      buffer = [];
      lastFlush = Date.now();

      insertBatch(rowsToInsert).catch(err => 
        console.error('Batch insert error:', err)
      );
    }

    res.status(204).send('');

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
};

async function insertBatch(rows) {
  try {
    await bigquery
      .dataset(DATASET_ID, {projectId: PROJECT_ID})
      .table(TABLE_ID)
      .insert(rows);
    
    console.log(`Inserted ${rows.length} rows to BigQuery`);
  } catch (error) {
    console.error('BigQuery insert failed:', error);
    if (error.errors) {
      console.error('Insert errors:', JSON.stringify(error.errors, null, 2));
    }
  }
}
