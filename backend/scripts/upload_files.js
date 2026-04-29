const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const SOURCE_DIR = 'c:\\Users\\Dhanapal_Sumathi\\OneDrive\\Desktop\\CourseFiles';
const BUCKET_NAME = 'course-files';

async function uploadFiles() {
  try {
    const files = fs.readdirSync(SOURCE_DIR);
    console.log(`Found ${files.length} files to upload.`);

    for (const fileName of files) {
      const filePath = path.join(SOURCE_DIR, fileName);
      const fileBuffer = fs.readFileSync(filePath);

      console.log(`Uploading ${fileName}...`);

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, fileBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (error) {
        console.error(`Error uploading ${fileName}:`, error.message);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      console.log(`Successfully uploaded. Public URL: ${publicUrl}`);

      // Insert into static_files table
      const { error: dbError } = await supabase
        .from('static_files')
        .insert([
          {
            file_name: fileName,
            file_url: publicUrl,
            category: 'Static'
          }
        ]);

      if (dbError) {
        console.error(`Error saving ${fileName} to database:`, dbError.message);
      }
    }

    console.log('Finished uploading all files.');
  } catch (err) {
    console.error('Upload process failed:', err);
  }
}

uploadFiles();
