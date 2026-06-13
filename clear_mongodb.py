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

        print("Found collections: {}".format(collections))

        # Drop each collection (except system collections)
        dropped = []
        for collection in collections:
            if not collection.startswith('system.'):
                db[collection].drop()
                dropped.append(collection)
                print("Dropped collection: {}".format(collection))

        print("\nDatabase cleared successfully")
        print("  Dropped {} collections".format(len(dropped)))
        client.close()
        return True
    except Exception as e:
        print("Error clearing database: {}".format(e))
        return False

if __name__ == '__main__':
    success = clear_database()
    sys.exit(0 if success else 1)
