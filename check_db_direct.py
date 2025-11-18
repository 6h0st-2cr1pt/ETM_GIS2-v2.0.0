import sqlite3
import os

# Get the database path
db_path = os.path.join(os.path.dirname(__file__), 'db.sqlite3')

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check if the table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='app_maplayer';")
    table_exists = cursor.fetchone()

    if table_exists:
        print("app_maplayer table exists")

        # Count layers
        cursor.execute("SELECT COUNT(*) FROM app_maplayer;")
        count = cursor.fetchone()[0]
        print(f"Total layers in database: {count}")

        if count > 0:
            # Get all layers
            cursor.execute("SELECT id, name, layer_type, is_active, is_default, url FROM app_maplayer;")
            layers = cursor.fetchall()

            print("\nLayers found:")
            for layer in layers:
                print(f"- ID: {layer[0]}, Name: {layer[1]}, Type: {layer[2]}")
                print(f"  Active: {layer[3]}, Default: {layer[4]}")
                print(f"  URL: {layer[5]}")
                print()
        else:
            print("No layers found in the table.")
    else:
        print("app_maplayer table does not exist - migrations may not have been run")

    conn.close()
else:
    print(f"Database file not found at: {db_path}")
