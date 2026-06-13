#!/usr/bin/env python3
"""Clear MongoDB database for experiment platform."""
from pymongo import MongoClient
import sys

def clear_database():
    try:
        # Connect to MongoDB
        client = MongoClient('mongodb://localhost:27017/')
        db = client['experiment_platform']

        # Get all collections
        collections = db.list_collection_names()

        # Drop each collection (except system collections)
        for collection in collections:
            if not collection.startswith('system.'):
                db[collection].drop()
                print(f"Dropped collection: {collection}")

        print("\n✓ Database cleared successfully")
        client.close()
        return True
    except Exception as e:
        print(f"Error clearing database: {e}")
        return False

if __name__ == '__main__':
    success = clear_database()
    sys.exit(0 if success else 1)
