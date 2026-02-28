import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Get absolute path of .env
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")

# Load .env file
load_dotenv(env_path)

# Correct DEBUG (use variable names)
print("ENV PATH:", env_path)
print("DEBUG URL:", os.getenv("SUPABASE_URL"))
print("DEBUG KEY:", os.getenv("SUPABASE_KEY"))

# Read variables correctly
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Create client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("✅ Supabase Connected Successfully")