// ENHANCED PHOTO UPLOAD DEBUG VERSION
// Add this to ReviewSubmissionForm to get better debugging

// Replace the photo upload section with this enhanced version:

// Handle photo uploads if any photos were selected
if (photos.length > 0 && insertData && insertData[0]) {
  const reviewId = insertData[0].id;
  console.log('📸 Starting photo upload process...');
  console.log('📸 Review ID:', reviewId, 'Type:', typeof reviewId);
  console.log('📸 Number of photos:', photos.length);
  console.log('📸 Photos array:', photos.map(p => ({ name: p.name, size: p.size, type: p.type })));
  
  try {
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      console.log(`📸 Processing photo ${i + 1}/${photos.length}: ${photo.name}`);
      
      // Validate photo
      if (!photo || !photo.name) {
        console.error(`❌ Invalid photo at index ${i}:`, photo);
        errorCount++;
        continue;
      }

      const fileExt = photo.name.split('.').pop()?.toLowerCase();
      const fileName = `review_${reviewId}_photo_${i + 1}_${Date.now()}.${fileExt}`;
      const filePath = fileName; // Simplified path

      console.log(`📸 Uploading to storage: ${filePath}`);

      // Step 1: Upload photo to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('review-photos')
        .upload(filePath, photo, {
          cacheControl: '3600',
          upsert: true // Allow overwrite if file exists
        });

      if (uploadError) {
        console.error(`❌ Storage upload error for ${fileName}:`, uploadError);
        console.error('❌ Upload error details:', {
          message: uploadError.message,
          statusCode: uploadError.statusCode,
          error: uploadError.error
        });
        errorCount++;
        continue;
      }

      console.log(`✅ Storage upload successful for ${fileName}:`, uploadData);

      // Step 2: Get public URL for the uploaded photo
      const { data: urlData } = supabase.storage
        .from('review-photos')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log(`📸 Public URL generated: ${publicUrl}`);

      if (!publicUrl) {
        console.error(`❌ Failed to get public URL for ${fileName}`);
        errorCount++;
        continue;
      }

      // Step 3: Save photo reference to database
      console.log(`📸 Saving photo reference to database...`);
      console.log('📸 Database insert data:', {
        review_id: Number(reviewId),
        photo_url: publicUrl,
        display_order: i + 1
      });

      const { data: photoData, error: photoDbError } = await supabase
        .from('review_photos')
        .insert({
          review_id: Number(reviewId),
          photo_url: publicUrl,
          display_order: i + 1,
          caption: null
        })
        .select('*'); // Get back what was inserted

      if (photoDbError) {
        console.error(`❌ Database insert error for ${fileName}:`, photoDbError);
        console.error('❌ Database error details:', {
          message: photoDbError.message,
          code: photoDbError.code,
          details: photoDbError.details,
          hint: photoDbError.hint
        });
        errorCount++;
        continue;
      }

      console.log(`✅ Database insert successful for ${fileName}:`, photoData);
      successCount++;
    }

    console.log(`📸 Photo upload summary: ${successCount} successful, ${errorCount} failed`);
    
    if (successCount === 0 && errorCount > 0) {
      console.error('❌ All photo uploads failed');
      setError('Photos could not be uploaded. Review was saved but without photos.');
    } else if (errorCount > 0) {
      console.warn(`⚠️ Some photos failed to upload: ${errorCount}/${photos.length}`);
      // Don't show error if at least some photos worked
    }

  } catch (photoError) {
    console.error('❌ Photo upload process crashed:', photoError);
    console.error('❌ Photo error details:', {
      name: photoError.name,
      message: photoError.message,
      stack: photoError.stack
    });
    setError('Photo upload failed. Review was saved but without photos.');
  }
} else if (photos.length > 0) {
  console.error('❌ Cannot upload photos: missing review ID or insert data');
  console.error('❌ insertData:', insertData);
  console.error('❌ photos.length:', photos.length);
}