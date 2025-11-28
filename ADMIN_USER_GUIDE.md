# Admin Guide: Creating User Accounts

This guide explains how to create user accounts for the App, Head, and Public portals in Django Admin.

## Accessing Django Admin

1. Navigate to: `http://127.0.0.1:8000/admin/`
2. Login with your superuser credentials

## Creating User Accounts

### For App Users (Regular Employees)

1. Go to **Users** section in the admin panel
2. Click **"Add User"** button
3. Fill in:
   - **Username** (required)
   - **Password** (required) - Enter password twice
   - **Email** (optional but recommended)
   - **First name** and **Last name** (optional)
4. Scroll down to the **"User Profile"** section
5. Select **"App User"** from the **User Type** dropdown
6. Click **"Save"**

**Note:** If you don't select a user type, it will default to "App User"

### For Head Users (Company Heads)

1. Go to **Users** section in the admin panel
2. Click **"Add User"** button
3. Fill in:
   - **Username** (required)
   - **Password** (required) - Enter password twice
   - **Email** (optional but recommended)
   - **First name** and **Last name** (optional)
4. Scroll down to the **"User Profile"** section
5. **IMPORTANT:** Select **"Head User"** from the **User Type** dropdown
6. Click **"Save"**

**Login URL:** `http://127.0.0.1:8000/head/login/`

### For Public Users

Public users can create their own accounts through the public signup page at:
- `http://127.0.0.1:8000/public/`

When they sign up, a UserProfile is automatically created with `user_type = 'public_user'`.

**Note:** Admins can also create public users manually in the admin panel by selecting "Public User" as the user type.

## Editing Existing Users

1. Go to **Users** section
2. Click on the username you want to edit
3. Scroll to the **"User Profile"** section
4. Change the **User Type** if needed
5. Click **"Save"**

## User Type Options

- **App User** (`app_user`): Regular employees who can access the main app, upload data, and manage their own datasets
- **Head User** (`head_user`): Company heads who can view all data from all users, generate reports, but cannot upload data
- **Public User** (`public_user`): Public users who can submit tree photos through the public portal

## Important Notes

1. **User Type is Required**: Each user must have a user type set. If not set during creation, it defaults to "App User"
2. **Login Restrictions**: Users can only log in to the portal matching their user type:
   - App Users → `/login/` (main app)
   - Head Users → `/head/login/` (head portal)
   - Public Users → `/public/` (public portal)
3. **Automatic Profile Creation**: A UserProfile is automatically created when a new User is saved, even if you don't fill in the inline form
4. **Viewing User Types**: In the Users list, you can see each user's type in the "User Type" column
5. **Filtering**: You can filter users by user type using the filter sidebar

## Troubleshooting

### User can't login to head portal
- Check that the user's UserProfile has `user_type = 'head_user'`
- Verify they're using the correct login URL: `/head/login/`

### User can't login to app
- Check that the user's UserProfile has `user_type = 'app_user'`
- Verify they're using the correct login URL: `/login/`

### User Profile doesn't exist
- The system automatically creates a UserProfile when a User is saved
- If a profile is missing, edit the user and save again, or create it manually in the "User Profiles" section

## Quick Reference

| User Type | Login URL | Can Upload Data | Can View All Data |
|-----------|-----------|-----------------|-------------------|
| App User | `/login/` | ✅ Yes | ❌ Only own data |
| Head User | `/head/login/` | ❌ No | ✅ Yes (all users) |
| Public User | `/public/` | ❌ No (submit photos only) | ❌ No |

