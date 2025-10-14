# Supabase Image Handling Configuration

This document provides instructions for setting up Supabase to handle dive site images in the offline-first mobile application.

## Database Schema

The image handling system uses a dedicated table `dive_site_images` to store metadata about images:

### Table Structure

```sql
create table "public"."dive_site_images" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "dive_site_id" uuid,
    "image_url" text,
    "thumbnail_url" text,
    "file_name" text not null,
    "file_size" integer,
    "mime_type" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "deleted" boolean default false
);
```

### Fields Description

- `id`: Unique identifier for the image record
- `user_id`: Reference to the user who owns the image
- `dive_site_id`: Reference to the dive site the image is associated with
- `image_url`: Public URL of the full-size image in Supabase Storage
- `thumbnail_url`: Public URL of the thumbnail image in Supabase Storage
- `file_name`: Original file name of the uploaded image
- `file_size`: Size of the image file in bytes
- `mime_type`: MIME type of the image file
- `created_at`: Timestamp when the record was created
- `updated_at`: Timestamp when the record was last updated
- `deleted`: Soft delete flag for offline-first sync

## Storage Configuration

### Storage Bucket

Images are stored in a dedicated bucket named `dive-site-images` with the following properties:

- **Bucket ID**: `dive-site-images`
- **Public Access**: Enabled
- **File Size Limit**: 10MB (configurable)
- **Allowed MIME Types**: image/jpeg, image/png, image/gif, image/webp

### Storage Path Structure

Images are organized in the bucket using the following path structure:
```
dive-site-images/
├── {user_id}/
│   ├── full/
│   │   └── {image_id}.{extension}
│   └── thumbnails/
│       └── {image_id}.{extension}
```

## Row Level Security (RLS) Policies

The following RLS policies ensure that users can only access their own images:

```sql
-- Users can view their own images
create policy "Users can view their own images"
    on "public"."dive_site_images" for select
    using (auth.uid() = user_id);

-- Users can insert their own images
create policy "Users can insert their own images"
    on "public"."dive_site_images" for insert
    with check (auth.uid() = user_id);

-- Users can update their own images
create policy "Users can update their own images"
    on "public"."dive_site_images" for update
    using (auth.uid() = user_id);

-- Users can delete their own images
create policy "Users can delete their own images"
    on "public"."dive_site_images" for delete
    using (auth.uid() = user_id);
```

## Storage Bucket Policies

Storage policies control access to the actual image files:

```sql
-- Anyone can upload dive site images
create policy "Anyone can upload dive site images"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'dive-site-images');

-- Anyone can view dive site images
create policy "Anyone can view dive site images"
    on storage.objects for select
    using (bucket_id = 'dive-site-images');

-- Users can update their own dive site images
create policy "Users can update their own dive site images"
    on storage.objects for update
    to authenticated
    using (bucket_id = 'dive-site-images' and owner = auth.uid());

-- Users can delete their own dive site images
create policy "Users can delete their own dive site images"
    on storage.objects for delete
    to authenticated
    using (bucket_id = 'dive-site-images' and owner = auth.uid());
```

## Migration Commands

To apply the database schema and storage configuration, run the following migration:

```bash
# Apply the migration
npx supabase migration up

# Or if using the Supabase CLI
supabase db push
```

## Configuration for Local Development

To set up the image handling system for local development:

1. **Start Supabase locally**:
   ```bash
   supabase start
   ```

2. **Apply migrations**:
   ```bash
   supabase db reset
   ```

3. **Verify the setup**:
   - Check that the `dive_site_images` table exists
   - Verify that the `dive-site-images` storage bucket is created
   - Confirm that RLS policies are applied

## Testing the Configuration

To test the image handling configuration:

1. **Create a test user**:
   ```sql
   -- Insert a test user
   insert into auth.users (id, email) 
   values ('00000000-0000-0000-0000-000000000000', 'test@example.com');
   ```

2. **Insert a test image record**:
   ```sql
   -- Insert a test image
   insert into dive_site_images (user_id, dive_site_id, file_name, file_size, mime_type)
   values ('00000000-0000-0000-0000-000000000000', null, 'test.jpg', 1024, 'image/jpeg');
   ```

3. **Verify access**:
   - Test that the user can select their own images
   - Confirm that other users cannot access the image
   - Validate storage bucket access permissions

## Troubleshooting

### Common Issues

1. **RLS Errors**: Ensure that the user is authenticated and that the `auth.uid()` matches the `user_id` in the record.

2. **Storage Access Denied**: Verify that the storage bucket policies are correctly configured and that the user has the proper permissions.

3. **File Size Limits**: Check that uploaded files do not exceed the configured size limits.

### Useful Queries

```sql
-- Check existing images
select * from dive_site_images limit 10;

-- Verify storage bucket
select * from storage.buckets where id = 'dive-site-images';

-- Check RLS policies
select * from pg_policy where polrelid = 'dive_site_images'::regclass;
```

## Security Considerations

1. **Authentication**: All image operations require user authentication
2. **Authorization**: Users can only access their own images
3. **File Validation**: Validate file types and sizes on upload
4. **Soft Deletes**: Use the `deleted` flag for offline-first sync instead of hard deletes
5. **Public URLs**: Generate signed URLs for private images when needed

This configuration provides a secure and scalable foundation for handling dive site images in the offline-first mobile application.