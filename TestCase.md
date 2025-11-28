| Test Case ID | Scenario / Functionality | Precondition | Steps | Expected Result | Actual Result | Status |
|--------------|-------------------------|--------------|-------|-----------------|--------------|--------|
| TC001 | Login page loads | User is on login page | 1. Open browser\n2. Navigate to login.html | Login form is displayed | Login form is displayed | Pass |
| TC002 | Successful login | Valid credentials exist | 1. Enter valid username\n2. Enter valid password\n3. Click "Login" | Redirect to dashboard.html | Redirected to dashboard.html | Pass |
| TC003 | Failed login | Invalid credentials | 1. Enter invalid username or password\n2. Click "Login" | Error message shown | Error message displayed | Pass |
| TC004 | Register page loads | User is on register page | 1. Open browser\n2. Navigate to register.html | Registration form is displayed | Registration form is displayed | Pass |
| TC005 | Successful registration | Valid registration data | 1. Fill registration form\n2. Submit form | Account created, redirect to login | Account created, redirected to login | Pass |
| TC006 | Registration with missing fields | Required fields empty | 1. Leave required fields empty\n2. Submit form | Error message shown | Error message displayed | Pass |
| TC007 | Dashboard loads | User is logged in | 1. Login\n2. Navigate to dashboard.html | Dashboard content is displayed | Dashboard content displayed | Pass |
| TC008 | View analytics | User is logged in | 1. Login\n2. Click analytics menu | analytics.html loads with charts | analytics.html loaded, charts visible | Pass |
| TC009 | View datasets | User is logged in | 1. Login\n2. Click datasets menu | datasets.html loads | datasets.html loaded | Pass |
| TC010 | Upload data | User is logged in | 1. Login\n2. Go to upload.html\n3. Select valid file\n4. Click submit | Data uploaded, success message | Data uploaded, success message shown | Pass |
| TC011 | Upload invalid file | User is logged in | Try to upload unsupported file | Error message shown |  |  |
| TC012 | View GIS map | User is logged in | Open gis.html | Map is displayed |  |  |
| TC013 | Add new tree data | User is logged in | Go to new_data.html, fill form, submit | Tree data added, confirmation |  |  |
| TC014 | Edit tree data | Tree exists | Go to edit_tree.html, modify, save | Changes saved, confirmation |  |  |
| TC015 | Delete tree record | Tree exists | Click delete on tree record | Record deleted, confirmation |  |  |
| TC016 | View layers | User is logged in | Open layers.html | Map layers are listed |  |  |
| TC017 | Toggle map layer | Layers available | Click layer toggle | Layer visibility changes |  |  |
| TC018 | View reports | User is logged in | Open reports.html | Reports are displayed |  |  |
| TC019 | Generate report | Data available | Click generate report | Report generated, downloadable |  |  |
| TC020 | View settings | User is logged in | Open settings.html | Settings form is displayed |  |  |
| TC021 | Update settings | Valid settings | Change settings, save | Settings updated, confirmation |  |  |
| TC022 | View about page | Any user | Open about.html | About info displayed |  |  |
| TC023 | View splash page | Any user | Open splash.html | Splash screen displayed |  |  |
| TC024 | Logout | User is logged in | Click logout | Redirect to login.html |  |  |
| TC025 | Access dashboard without login | User not logged in | Open dashboard.html | Redirect to login.html |  |  |
| TC026 | Access upload without login | User not logged in | Open upload.html | Redirect to login.html |  |  |
| TC027 | Access datasets without login | User not logged in | Open datasets.html | Redirect to login.html |  |  |
| TC028 | Access analytics without login | User not logged in | Open analytics.html | Redirect to login.html |  |  |
| TC029 | Access gis without login | User not logged in | Open gis.html | Redirect to login.html |  |  |
| TC030 | Access layers without login | User not logged in | Open layers.html | Redirect to login.html |  |  |
| TC031 | Access reports without login | User not logged in | Open reports.html | Redirect to login.html |  |  |
| TC032 | Access settings without login | User not logged in | Open settings.html | Redirect to login.html |  |  |
| TC033 | Access edit_tree without login | User not logged in | Open edit_tree.html | Redirect to login.html |  |  |
| TC034 | Access new_data without login | User not logged in | Open new_data.html | Redirect to login.html |  |  |
| TC035 | Access register while logged in | User logged in | Open register.html | Redirect to dashboard.html |  |  |
| TC036 | Access login while logged in | User logged in | Open login.html | Redirect to dashboard.html |  |  |
| TC037 | Search tree database | User is logged in | Use search in datasets.html | Search results displayed |  |  |
| TC038 | Filter map data | User is logged in | Use filter in gis.html | Map updates with filter |  |  |
| TC039 | Export data | User is logged in | Click export in datasets.html | Data file downloaded |  |  |
| TC040 | View user profile | User is logged in | Open settings.html | Profile info displayed |  |  |
| TC041 | Update user profile | Valid profile data | Edit profile, save | Profile updated, confirmation |  |  |
| TC042 | Forgot password | User exists | Click forgot password on login.html | Password reset process starts |  |  |
| TC043 | Reset password | Valid reset token | Enter new password, submit | Password updated, login allowed |  |  |
| TC044 | Invalid reset token | Invalid token | Use invalid token to reset | Error message shown |  |  |
| TC045 | View tree details | Tree exists | Click tree in datasets.html | Tree details displayed |  |  |
| TC046 | View tree image | Tree has image | Click image in tree details | Image displayed |  |  |
| TC047 | Add tree image | Tree exists | Upload image in edit_tree.html | Image added, confirmation |  |  |
| TC048 | Remove tree image | Tree has image | Delete image in edit_tree.html | Image removed, confirmation |  |  |
| TC049 | View statistics | User is logged in | Open analytics.html | Statistics displayed |  |  |
| TC050 | Analyze tree distribution | Data available | Use distribution tool in analytics.html | Distribution chart displayed |  |  |
| TC051 | Record field observation | User is logged in | Go to new_data.html, fill observation, submit | Observation recorded |  |  |
| TC052 | Edit field observation | Observation exists | Edit observation in edit_tree.html | Changes saved, confirmation |  |  |
| TC053 | Delete field observation | Observation exists | Delete observation in edit_tree.html | Observation deleted |  |  |
| TC054 | View upload history | User is logged in | Open upload.html | Upload history displayed |  |  |
| TC055 | View error logs | Admin logged in | Open settings.html | Error logs displayed |  |  |
| TC056 | Clear error logs | Admin logged in | Click clear logs in settings.html | Logs cleared, confirmation |  |  |
| TC057 | Manage user accounts | Admin logged in | Open settings.html, manage users | User accounts updated |  |  |
| TC058 | Delete user account | Admin logged in | Delete user in settings.html | User deleted, confirmation |  |  |
| TC059 | Add user account | Admin logged in | Add user in settings.html | User added, confirmation |  |  |
| TC060 | Update user account | Admin logged in | Edit user in settings.html | User updated, confirmation |  |  |
| TC061 | View admin dashboard | Admin logged in | Open dashboard.html | Admin dashboard displayed |  |  |
| TC062 | Access admin features as user | User logged in | Try admin feature | Access denied message |  |  |
| TC063 | Access user features as admin | Admin logged in | Try user feature | Feature accessible |  |  |
| TC064 | View splash on first visit | First time user | Open splash.html | Splash displayed |  |  |
| TC065 | Skip splash screen | Splash displayed | Click skip | Redirect to login.html |  |  |
| TC066 | View help info | Any user | Open about.html | Help info displayed |  |  |
| TC067 | View contact info | Any user | Open about.html | Contact info displayed |  |  |
| TC068 | View privacy policy | Any user | Open about.html | Privacy policy displayed |  |  |
| TC069 | View terms of service | Any user | Open about.html | Terms displayed |  |  |
| TC070 | View upload instructions | User is logged in | Open upload.html | Instructions displayed |  |  |
| TC071 | View upload error | Upload fails | Try upload with bad file | Error message shown |  |  |
| TC072 | View upload success | Upload succeeds | Upload valid file | Success message shown |  |  |
| TC073 | View upload progress | Uploading file | Upload file | Progress bar displayed |  |  |
| TC074 | Cancel upload | Uploading file | Click cancel | Upload cancelled |  |  |
| TC075 | View dashboard stats | User is logged in | Open dashboard.html | Stats displayed |  |  |
| TC076 | View dashboard charts | User is logged in | Open dashboard.html | Charts displayed |  |  |
| TC077 | View dashboard notifications | User is logged in | Open dashboard.html | Notifications displayed |  |  |
| TC078 | Mark notification as read | Notification exists | Click mark as read | Notification marked |  |  |
| TC079 | Delete notification | Notification exists | Click delete | Notification deleted |  |  |
| TC080 | View recent activity | User is logged in | Open dashboard.html | Recent activity displayed |  |  |
| TC081 | View user settings | User is logged in | Open settings.html | User settings displayed |  |  |
| TC082 | Change password | User is logged in | Change password in settings.html | Password updated |  |  |
| TC083 | Change email | User is logged in | Change email in settings.html | Email updated |  |  |
| TC084 | Change profile picture | User is logged in | Change picture in settings.html | Picture updated |  |  |
| TC085 | View system notifications | Any user | Open dashboard.html | System notifications displayed |  |  |
| TC086 | View system status | Any user | Open dashboard.html | System status displayed |  |  |
| TC087 | View system updates | Any user | Open dashboard.html | System updates displayed |  |  |
| TC088 | View system alerts | Any user | Open dashboard.html | System alerts displayed |  |  |
| TC089 | View system messages | Any user | Open dashboard.html | System messages displayed |  |  |
| TC090 | View system logs | Admin logged in | Open settings.html | System logs displayed |  |  |
| TC091 | Download system logs | Admin logged in | Download logs in settings.html | Logs downloaded |  |  |
| TC092 | View user activity log | User is logged in | Open settings.html | Activity log displayed |  |  |
| TC093 | Download user activity log | User is logged in | Download log in settings.html | Log downloaded |  |  |
| TC094 | View help documentation | Any user | Open about.html | Documentation displayed |  |  |
| TC095 | Search help documentation | Any user | Search in about.html | Search results displayed |  |  |
| TC096 | View feedback form | Any user | Open about.html | Feedback form displayed |  |  |
| TC097 | Submit feedback | Any user | Fill feedback form, submit | Feedback submitted, confirmation |  |  |
| TC098 | View FAQ | Any user | Open about.html | FAQ displayed |  |  |
| TC099 | Search FAQ | Any user | Search in about.html | FAQ search results displayed |  |  |
| TC100 | View version info | Any user | Open about.html | Version info displayed |  |  |
